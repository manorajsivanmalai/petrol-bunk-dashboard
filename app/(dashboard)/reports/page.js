import { getReportsSummary } from '@/lib/queries/reports';
import { PageHeading, Kpi, EmptyState } from '@/components/ui';
import { formatCurrency, formatVolume } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const summary = await getReportsSummary();
  const growthLabel = `${summary.growthPct >= 0 ? '↗' : '↘'} ${Math.abs(summary.growthPct).toFixed(1)}% vs last month`;

  return (
    <>
      <PageHeading eyebrow="WORKSPACE / REPORTS" title="Reports & insights" text="A live view of performance and reconciliation." />
      <section className="kpis">
        <Kpi label="Gross sales · this month" value={formatCurrency(summary.grossSales)} trend={growthLabel} />
        <Kpi label="Reconciliation" value={`${summary.reconciliation.toFixed(1)}%`} trend="Approvals decided cleanly" blue />
        <Kpi label="Total volume" value={formatVolume(summary.totalVolume)} trend={`${summary.activeShiftsCount} active shifts`} />
      </section>
      <EmptyState icon="▤" title="Reports are ready to export" text="Download a CSV of every fuel movement recorded so far.">
        <a className="primary" href="/api/reports/export">
          Export monthly report <span>↗</span>
        </a>
      </EmptyState>
    </>
  );
}
