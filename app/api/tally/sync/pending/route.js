import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTallyApiKey } from '@/lib/tally-auth';
import { buildTallySyncXML } from '@/lib/tally';

const BATCH_LIMIT = 200;

export async function GET(request) {
  const error = requireTallyApiKey(request);
  if (error) return error;

  const [fuelEntries, payments] = await Promise.all([
    prisma.fuelEntry.findMany({
      where: { paymentMode: 'CREDIT', customerId: { not: null }, tallySyncedAt: null },
      orderBy: { createdAt: 'asc' },
      take: BATCH_LIMIT,
      select: {
        id: true,
        fuelType: true,
        quantityL: true,
        vehicleNumber: true,
        amount: true,
        createdAt: true,
        customer: { select: { name: true } },
      },
    }),
    prisma.creditTransaction.findMany({
      where: { type: 'PAYMENT', tallySyncedAt: null },
      orderBy: { createdAt: 'asc' },
      take: BATCH_LIMIT,
      select: {
        id: true,
        amount: true,
        note: true,
        createdAt: true,
        customer: { select: { name: true } },
      },
    }),
  ]);

  const fuelEntryIds = fuelEntries.map(e => e.id);
  const paymentIds = payments.map(p => p.id);

  if (fuelEntryIds.length === 0 && paymentIds.length === 0) {
    return NextResponse.json({ count: 0, fuelEntryIds: [], paymentIds: [], xml: null });
  }

  const xml = buildTallySyncXML({
    fuelEntries: fuelEntries.map(e => ({
      id: e.id,
      customerName: e.customer.name,
      fuelType: e.fuelType,
      quantityL: Number(e.quantityL),
      vehicleNumber: e.vehicleNumber,
      amount: Number(e.amount),
      createdAt: e.createdAt,
    })),
    payments: payments.map(p => ({
      id: p.id,
      customerName: p.customer.name,
      amount: Number(p.amount),
      note: p.note,
      createdAt: p.createdAt,
    })),
  });

  return NextResponse.json({
    count: fuelEntryIds.length + paymentIds.length,
    fuelEntryIds,
    paymentIds,
    xml,
  });
}
