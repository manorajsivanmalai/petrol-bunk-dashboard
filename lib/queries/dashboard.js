import { prisma } from '@/lib/prisma';

export async function getDashboardSummary() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const weekEntries = await prisma.fuelEntry.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { amount: true, quantityL: true, fuelType: true, paymentMode: true, customerId: true, createdAt: true },
  });
  const pendingApprovalsCount = await prisma.approval.count({ where: { status: 'PENDING' } });
  const recentActivity = await prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  const recentShifts = await prisma.shift.findMany({
    orderBy: { startedAt: 'desc' },
    take: 4,
    include: { attendant: { select: { name: true } }, pump: { select: { name: true } } },
  });

  const todaysEntries = weekEntries.filter(entry => entry.createdAt >= startOfToday);
  const todaysSales = todaysEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);
  const dieselSoldToday = todaysEntries
    .filter(entry => entry.fuelType === 'DIESEL')
    .reduce((sum, entry) => sum + Number(entry.quantityL), 0);
  const creditEntriesToday = todaysEntries.filter(entry => entry.paymentMode === 'CREDIT');
  const creditSalesToday = creditEntriesToday.reduce((sum, entry) => sum + Number(entry.amount), 0);
  const creditCustomersToday = new Set(creditEntriesToday.map(entry => entry.customerId).filter(Boolean)).size;

  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(startOfToday);
    day.setDate(day.getDate() - i);
    days.push(day);
  }
  const dailyTotals = days.map(day => {
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const total = weekEntries
      .filter(entry => entry.createdAt >= day && entry.createdAt < next)
      .reduce((sum, entry) => sum + Number(entry.amount), 0);
    return { label: day.toLocaleDateString('en-US', { weekday: 'short' }), total };
  });
  const maxTotal = Math.max(1, ...dailyTotals.map(entry => entry.total));
  const chart = dailyTotals.map(entry => ({
    label: entry.label,
    total: entry.total,
    height: Math.max(6, Math.round((entry.total / maxTotal) * 100)),
  }));

  return {
    kpis: {
      todaysSales,
      todaysEntriesCount: todaysEntries.length,
      dieselSoldToday,
      creditSalesToday,
      creditCustomersToday,
      pendingApprovalsCount,
    },
    chart,
    recentActivity: recentActivity.map(item => ({
      id: item.id,
      icon: item.icon,
      title: item.title,
      summary: item.summary,
      status: item.status,
    })),
    shifts: recentShifts.map(shift => ({
      id: shift.id,
      pump: shift.pump.name,
      attendant: shift.attendant.name,
      volumeL: Number(shift.volumeL),
      collectionAmount: Number(shift.collectionAmount),
      status: shift.status,
    })),
  };
}
