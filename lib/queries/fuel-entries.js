import { prisma } from '@/lib/prisma';

export async function listFuelEntries() {
  const entries = await prisma.fuelEntry.findMany({
    orderBy: { createdAt: 'desc' },
    take: 25,
    include: {
      customer: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
  });

  return entries.map(entry => ({
    id: entry.id,
    fuelType: entry.fuelType,
    quantityL: Number(entry.quantityL),
    amount: Number(entry.amount),
    vehicleNumber: entry.vehicleNumber,
    customerName: entry.customer?.name || null,
    paymentMode: entry.paymentMode,
    status: entry.status,
    createdAt: entry.createdAt,
    createdByName: entry.createdBy.name,
  }));
}
