import { NextResponse } from 'next/server';

export function requireTallyApiKey(request) {
  const expected = process.env.TALLY_SYNC_API_KEY;
  if (!expected) {
    return NextResponse.json(
      { error: 'Tally sync is not configured on the server (missing TALLY_SYNC_API_KEY).' },
      { status: 500 }
    );
  }
  const provided = request.headers.get('x-tally-api-key');
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  return null;
}
