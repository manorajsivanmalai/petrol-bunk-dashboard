const COMPANY_NAME = process.env.TALLY_COMPANY_NAME || 'KANNUSAMY AGENCY';

function xmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function tallyDate(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

function ledgerMaster(name, parent, openingBalance) {
  return `    <TALLYMESSAGE xmlns:UDF="TallyUDF">
      <LEDGER NAME="${xmlEscape(name)}" ACTION="Create">
        <PARENT>${xmlEscape(parent)}</PARENT>
        <OPENINGBALANCE>${openingBalance.toFixed(2)}</OPENINGBALANCE>
      </LEDGER>
    </TALLYMESSAGE>`;
}

function salesVoucher({ date, voucherNumber, partyLedger, narration, amount }) {
  return `    <TALLYMESSAGE xmlns:UDF="TallyUDF">
      <VOUCHER VCHTYPE="Sales" ACTION="Create">
        <DATE>${tallyDate(date)}</DATE>
        <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
        <VOUCHERNUMBER>${xmlEscape(voucherNumber)}</VOUCHERNUMBER>
        <PARTYLEDGERNAME>${xmlEscape(partyLedger)}</PARTYLEDGERNAME>
        <NARRATION>${xmlEscape(narration)}</NARRATION>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>${xmlEscape(partyLedger)}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-${amount.toFixed(2)}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Fuel Sales</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${amount.toFixed(2)}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
      </VOUCHER>
    </TALLYMESSAGE>`;
}

function receiptVoucher({ date, voucherNumber, partyLedger, narration, amount }) {
  return `    <TALLYMESSAGE xmlns:UDF="TallyUDF">
      <VOUCHER VCHTYPE="Receipt" ACTION="Create">
        <DATE>${tallyDate(date)}</DATE>
        <VOUCHERTYPENAME>Receipt</VOUCHERTYPENAME>
        <VOUCHERNUMBER>${xmlEscape(voucherNumber)}</VOUCHERNUMBER>
        <PARTYLEDGERNAME>${xmlEscape(partyLedger)}</PARTYLEDGERNAME>
        <NARRATION>${xmlEscape(narration)}</NARRATION>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Cash</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-${amount.toFixed(2)}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>${xmlEscape(partyLedger)}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${amount.toFixed(2)}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
      </VOUCHER>
    </TALLYMESSAGE>`;
}

function wrapEnvelope(messages) {
  return `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${xmlEscape(COMPANY_NAME)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
${messages.join('\n')}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>
`;
}

export function buildTallyExportXML({ customers, fuelEntries, payments }) {
  const messages = [];

  messages.push(ledgerMaster('Fuel Sales', 'Sales Accounts', 0));
  messages.push(ledgerMaster('Cash', 'Cash-in-Hand', 0));

  for (const customer of customers) {
    const debitTotal = fuelEntries
      .filter(entry => entry.customerId === customer.id)
      .reduce((sum, entry) => sum + entry.amount, 0);
    const paymentTotal = payments
      .filter(payment => payment.customerId === customer.id)
      .reduce((sum, payment) => sum + payment.amount, 0);
    const openingBalance = customer.outstandingAmount - debitTotal + paymentTotal;
    messages.push(ledgerMaster(customer.name, 'Sundry Debtors', openingBalance));
  }

  for (const entry of fuelEntries) {
    messages.push(
      salesVoucher({
        date: entry.createdAt,
        voucherNumber: entry.id,
        partyLedger: entry.customerName,
        narration: `${entry.fuelType} ${entry.quantityL}L · ${entry.vehicleNumber}`,
        amount: entry.amount,
      })
    );
  }

  for (const payment of payments) {
    messages.push(
      receiptVoucher({
        date: payment.createdAt,
        voucherNumber: payment.id,
        partyLedger: payment.customerName,
        narration: payment.note || 'Payment received',
        amount: payment.amount,
      })
    );
  }

  return wrapEnvelope(messages);
}

/**
 * Incremental batch for the sync agent: only the new vouchers since the last run,
 * plus a ledger-create (opening balance 0) for any customer the agent hasn't seen
 * before. Tally safely no-ops ledger-create for names that already exist.
 */
export function buildTallySyncXML({ fuelEntries, payments }) {
  const messages = [];
  const customerNames = new Set();

  for (const entry of fuelEntries) customerNames.add(entry.customerName);
  for (const payment of payments) customerNames.add(payment.customerName);

  if (customerNames.size > 0) {
    messages.push(ledgerMaster('Fuel Sales', 'Sales Accounts', 0));
    messages.push(ledgerMaster('Cash', 'Cash-in-Hand', 0));
  }
  for (const name of customerNames) {
    messages.push(ledgerMaster(name, 'Sundry Debtors', 0));
  }

  for (const entry of fuelEntries) {
    messages.push(
      salesVoucher({
        date: entry.createdAt,
        voucherNumber: entry.id,
        partyLedger: entry.customerName,
        narration: `${entry.fuelType} ${entry.quantityL}L · ${entry.vehicleNumber}`,
        amount: entry.amount,
      })
    );
  }

  for (const payment of payments) {
    messages.push(
      receiptVoucher({
        date: payment.createdAt,
        voucherNumber: payment.id,
        partyLedger: payment.customerName,
        narration: payment.note || 'Payment received',
        amount: payment.amount,
      })
    );
  }

  return wrapEnvelope(messages);
}
