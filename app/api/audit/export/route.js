import { requireAction } from '@/lib/api-guard';
import { listActivity } from '@/lib/queries/audit';

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export async function GET() {
  const { error } = await requireAction('viewAuditLog');
  if (error) return error;

  const entries = await listActivity({ take: 5000 });

  const header = ['Date', 'Person', 'User ID', 'Role', 'Action', 'Detail', 'Status'];
  const rows = entries.map(entry => [
    new Date(entry.createdAt).toISOString(),
    entry.actorName,
    entry.actorUsername || '',
    entry.actorRole || '',
    entry.title,
    entry.summary,
    entry.status || '',
  ]);
  const csv = [header, ...rows].map(row => row.map(csvEscape).join(',')).join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
