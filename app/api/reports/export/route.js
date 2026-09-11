import { prisma } from '@/lib/prisma';
import { requireAction } from '@/lib/api-guard';

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export async function GET() {
  const { error } = await requireAction('viewReports');
  if (error) return error;

  const entries = await prisma.fuelEntry.findMany({
    orderBy: { createdAt: 'desc' },
    include: { customer: { select: { name: true } }, createdBy: { select: { name: true } } },
  });

  const header = ['Date', 'Fuel type', 'Quantity (L)', 'Amount (INR)', 'Vehicle/Customer', 'Payment mode', 'Status', 'Recorded by'];
  const rows = entries.map(entry => [
    new Date(entry.createdAt).toISOString(),
    entry.fuelType,
    Number(entry.quantityL),
    Number(entry.amount),
    entry.vehicleNumber || entry.customer?.name || '',
    entry.paymentMode,
    entry.status,
    entry.createdBy.name,
  ]);
  const csv = [header, ...rows].map(row => row.map(csvEscape).join(',')).join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="station-report-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
