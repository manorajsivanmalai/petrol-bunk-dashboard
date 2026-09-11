import { prisma } from '@/lib/prisma';

export async function getReportsSummary() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const thisMonthEntries = await prisma.fuelEntry.findMany({
    where: { createdAt: { gte: startOfMonth } },
    select: { amount: true, quantityL: true },
  });
  const lastMonthEntries = await prisma.fuelEntry.findMany({
    where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } },
    select: { amount: true },
  });
  const activeShiftsCount = await prisma.shift.count({ where: { startedAt: { gte: startOfMonth } } });
  const decidedApprovals = await prisma.approval.findMany({
    where: { createdAt: { gte: startOfMonth }, status: { in: ['APPROVED', 'REJECTED'] } },
    select: { status: true },
  });

  const grossSales = thisMonthEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);
  const lastMonthSales = lastMonthEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);
  const totalVolume = thisMonthEntries.reduce((sum, entry) => sum + Number(entry.quantityL), 0);
  const growthPct = lastMonthSales > 0 ? ((grossSales - lastMonthSales) / lastMonthSales) * 100 : 0;
  const approvedCount = decidedApprovals.filter(item => item.status === 'APPROVED').length;
  const reconciliation = decidedApprovals.length > 0 ? (approvedCount / decidedApprovals.length) * 100 : 100;

  return { grossSales, growthPct, reconciliation, totalVolume, activeShiftsCount };
}
