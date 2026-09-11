import { getSession } from '@/lib/session';
import { listApprovals } from '@/lib/queries/approvals';
import { can } from '@/lib/rbac';
import { PageHeading, Panel, Tag } from '@/components/ui';
import ApprovalActions from '@/components/ApprovalActions';
import { formatCurrency } from '@/lib/format';

export const dynamic = 'force-dynamic';

const statusLabel = status => status.charAt(0) + status.slice(1).toLowerCase();
const statusTone = { PENDING: 'pending', REJECTED: 'danger', APPROVED: '' };

export default async function ApprovalsPage() {
  const session = await getSession();
  const approvals = await listApprovals();
  const pendingCount = approvals.filter(item => item.status === 'PENDING').length;
  const canDecide = can(session.role, 'decideApproval');

  return (
    <>
      <PageHeading eyebrow="WORKSPACE / APPROVALS" title="Review queue" text="Keep the station moving with quick decisions." />
      <Panel title="Needs your attention" aside={`${pendingCount} pending`}>
        {approvals.length === 0 ? (
          <p className="table-empty">Nothing to review yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Request</th>
                <th>Details</th>
                <th>Amount</th>
                <th>Status</th>
                {canDecide && <th />}
              </tr>
            </thead>
            <tbody>
              {approvals.map(item => (
                <tr key={item.id}>
                  <td><strong>{item.title}</strong></td>
                  <td>{item.detail}</td>
                  <td>{formatCurrency(item.amount)}</td>
                  <td>
                    <Tag tone={statusTone[item.status]}>{statusLabel(item.status)}</Tag>
                  </td>
                  {canDecide && <td>{item.status === 'PENDING' && <ApprovalActions id={item.id} />}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </>
  );
}
