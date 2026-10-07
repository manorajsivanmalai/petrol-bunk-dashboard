#!/usr/bin/env node
/**
 * Tally sync agent
 * -----------------
 * Run this script on the SAME computer as Tally (it talks to Tally's XML
 * gateway at http://localhost:9000, which has no authentication of its own
 * and should never be exposed to the internet).
 *
 * It polls the KANNUSAMY Agency Portal for fuel entries / payments that
 * haven't been pushed to Tally yet, imports them as vouchers, and marks
 * them as synced so they're never sent twice.
 *
 * Requires Node.js 18 or newer (for the built-in fetch).
 *
 * Setup:
 *   1. In Tally: enable the XML/HTTP server (Help (F1) > Settings >
 *      Connectivity in TallyPrime, or F12 > Advanced Configuration in
 *      Tally.ERP 9) and note the port (default 9000).
 *   2. Set the environment variables below (see .env.example in this repo
 *      for APP_BASE_URL / TALLY_SYNC_API_KEY — they must match the values
 *      configured on the deployed app).
 *   3. Run:  node tally-sync-agent.js
 *   4. Keep it running — e.g. via Windows Task Scheduler ("When the
 *      computer starts", action: node.exe, this file as argument) or a
 *      tool like NSSM/pm2 so it survives reboots.
 */

const APP_BASE_URL = process.env.APP_BASE_URL;
const TALLY_API_KEY = process.env.TALLY_SYNC_API_KEY;
const TALLY_GATEWAY_URL = process.env.TALLY_GATEWAY_URL || 'http://localhost:9000';
const POLL_INTERVAL_MS = Number(process.env.TALLY_SYNC_INTERVAL_MS || 5 * 60 * 1000);

if (!APP_BASE_URL) {
  console.error('Set APP_BASE_URL (e.g. https://your-app.vercel.app) before running this script.');
  process.exit(1);
}
if (!TALLY_API_KEY) {
  console.error('Set TALLY_SYNC_API_KEY (must match the value configured on the deployed app) before running this script.');
  process.exit(1);
}

function log(...args) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

async function syncOnce() {
  const pendingRes = await fetch(`${APP_BASE_URL}/api/tally/sync/pending`, {
    headers: { 'x-tally-api-key': TALLY_API_KEY },
  });
  if (!pendingRes.ok) {
    log('Failed to fetch pending records:', pendingRes.status, await pendingRes.text());
    return;
  }

  const { count, xml, fuelEntryIds, paymentIds } = await pendingRes.json();
  if (!count) {
    log('Nothing new to sync.');
    return;
  }

  log(`Pushing ${count} record(s) to Tally at ${TALLY_GATEWAY_URL}…`);
  let tallyRes;
  try {
    tallyRes = await fetch(TALLY_GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml' },
      body: xml,
    });
  } catch (err) {
    log('Could not reach Tally — is it running with the XML server enabled on', TALLY_GATEWAY_URL, '?', err.message);
    return;
  }

  const tallyText = await tallyRes.text();
  if (!tallyRes.ok) {
    log('Tally rejected the request (HTTP', tallyRes.status, '):', tallyText.slice(0, 500));
    return;
  }
  if (!/<CREATED>|<ALTERED>|<LASTVCHID>/i.test(tallyText)) {
    log('Unexpected response from Tally — NOT acknowledging this batch (will retry next run):');
    log(tallyText.slice(0, 500));
    return;
  }

  const createdMatch = tallyText.match(/<CREATED>(\d+)<\/CREATED>/i);
  const errorMatch = tallyText.match(/<LINEERROR>(.*?)<\/LINEERROR>/i);
  log('Tally response: created =', createdMatch?.[1] ?? 'unknown', errorMatch ? `| first error: ${errorMatch[1]}` : '');

  const ackRes = await fetch(`${APP_BASE_URL}/api/tally/sync/ack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tally-api-key': TALLY_API_KEY },
    body: JSON.stringify({ fuelEntryIds, paymentIds }),
  });
  if (!ackRes.ok) {
    log('Failed to acknowledge synced records — they will be retried next run:', await ackRes.text());
    return;
  }
  log(`Synced and acknowledged ${count} record(s).`);
}

async function loop() {
  log(`Tally sync agent started. Polling every ${Math.round(POLL_INTERVAL_MS / 1000)}s.`);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await syncOnce();
    } catch (err) {
      log('Sync error:', err);
    }
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

loop();
