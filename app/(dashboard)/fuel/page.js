import { getSession } from '@/lib/session';
import { listFuelEntries } from '@/lib/queries/fuel-entries';
import { can } from '@/lib/rbac';
import { PageHeading, Panel, Tag } from '@/components/ui';
import NewFuelEntryButton from '@/components/NewFuelEntryButton';
import { formatCurrency, formatVolume } from '@/lib/format';

export const dynamic = 'force-dynamic';

const statusTone = { Pending: 'pending', Approved: '', Rejected: 'danger', Recorded: 'muted' };

export default async function FuelPage() {
  const session = await getSession();
  const entries = await listFuelEntries();

  return (
    <>
      <PageHeading eyebrow="WORKSPACE / FUEL ENTRY" title="Fuel movement" text="Capture a sale, issue, or shift movement.">
        {can(session.role, 'createFuelEntry') && <NewFuelEntryButton />}
      </PageHeading>

      <Panel title="Recent fuel entries" aside={`${entries.length} shown`}>
        {entries.length === 0 ? (
          <p className="table-empty">No fuel entries yet — record the first one above.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fuel</th>
                <th>Qty</th>
                <th>Vehicle / Customer</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Recorded by</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id}>
                  <td>{entry.fuelType.charAt(0) + entry.fuelType.slice(1).toLowerCase()}</td>
                  <td>{formatVolume(entry.quantityL)}</td>
                  <td>{entry.vehicleNumber || entry.customerName || '—'}</td>
                  <td>{formatCurrency(entry.amount)}</td>
                  <td>{entry.paymentMode}</td>
                  <td>
                    <Tag tone={statusTone[entry.status] || ''}>{entry.status}</Tag>
                  </td>
                  <td>{entry.createdByName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </>
  );
}
