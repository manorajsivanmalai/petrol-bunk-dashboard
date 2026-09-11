import { getSession } from '@/lib/session';
import { getDashboardSummary } from '@/lib/queries/dashboard';
import { can } from '@/lib/rbac';
import { PageHeading, Kpi, Panel, Tag } from '@/components/ui';
import NewFuelEntryButton from '@/components/NewFuelEntryButton';
import { formatCurrency, formatVolume, getGreeting } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getSession();
  const summary = await getDashboardSummary();

  return (
    <>
      <PageHeading
        eyebrow="OPERATIONS / TODAY"
        title={`${getGreeting()}, ${session.name}`}
        text="Live overview across Kallakurichi station activity."
      >
        {can(session.role, 'createFuelEntry') && <NewFuelEntryButton />}
      </PageHeading>

      <section className="kpis">
        <Kpi label="Today's sales" value={formatCurrency(summary.kpis.todaysSales)} trend={`${summary.kpis.todaysEntriesCount} entries today`} />
        <Kpi label="Diesel sold" value={formatVolume(summary.kpis.dieselSoldToday)} trend="Today" blue />
        <Kpi label="Credit sales" value={formatCurrency(summary.kpis.creditSalesToday)} trend={`${summary.kpis.creditCustomersToday} customers`} />
        <Kpi
          label="Pending approval"
          value={summary.kpis.pendingApprovalsCount}
          trend={summary.kpis.pendingApprovalsCount ? 'Needs action' : 'All clear'}
          blue
        />
      </section>

      <section className="dashboard-grid">
        <Panel title="Sales this week" aside={formatCurrency(summary.chart.reduce((sum, day) => sum + day.total, 0))}>
          <div className="chart">
            {summary.chart.map(day => (
              <div className="bar-column" key={day.label}>
                <div className="bar" style={{ height: `${day.height}%` }} title={formatCurrency(day.total)} />
                <span>{day.label}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Recent activity" aside="Updated now">
          {summary.recentActivity.length === 0 ? (
            <p className="table-empty">No activity recorded yet.</p>
          ) : (
            <div className="activity-list">
              {summary.recentActivity.map(item => (
                <div className="activity" key={item.id}>
                  <div className="activity-icon">{item.icon}</div>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.summary}</small>
                  </div>
                  <span className="trend">{item.status}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>

      <Panel title="Shift snapshot">
        {summary.shifts.length === 0 ? (
          <p className="table-empty">No shifts recorded yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Pump</th>
                <th>Attendant</th>
                <th>Volume</th>
                <th>Collection</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {summary.shifts.map(shift => (
                <tr key={shift.id}>
                  <td>{shift.pump}</td>
                  <td>{shift.attendant}</td>
                  <td>{formatVolume(shift.volumeL)}</td>
                  <td>{formatCurrency(shift.collectionAmount)}</td>
                  <td>
                    <Tag tone={shift.status === 'LIVE' ? 'pending' : ''}>{shift.status === 'LIVE' ? 'Live' : 'Closed'}</Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </>
  );
}
