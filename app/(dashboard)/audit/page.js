import { listActivity } from '@/lib/queries/audit';
import { PageHeading, Panel } from '@/components/ui';
import AuditTable from '@/components/AuditTable';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  const entries = await listActivity({ take: 200 });

  return (
    <>
      <PageHeading eyebrow="ADMIN / AUDIT LOG" title="Who did what" text="Every fuel entry, approval, and access change, with the person behind it.">
        <a className="secondary" href="/api/audit/export">Export CSV <span>↗</span></a>
      </PageHeading>
      <Panel title="Recent activity" aside={`Last ${entries.length} events`}>
        <AuditTable entries={entries} />
      </Panel>
    </>
  );
}
