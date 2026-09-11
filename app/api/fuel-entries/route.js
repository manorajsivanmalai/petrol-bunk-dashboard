import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAction, requireSession } from '@/lib/api-guard';
import { listFuelEntries } from '@/lib/queries/fuel-entries';

const CREDIT_OR_LARGE_THRESHOLD = 20000;

const schema = z.object({
  fuelType: z.enum(['PETROL', 'DIESEL', 'XP95']),
  quantityL: z.coerce.number().positive(),
  amount: z.coerce.number().positive(),
  vehicleNumber: z.string().trim().max(20).optional().or(z.literal('')),
  customerId: z.string().optional().or(z.literal('')),
  paymentMode: z.enum(['CASH', 'CREDIT', 'UPI']).default('CASH'),
});

async function getOrCreateActiveShift(userId) {
  const existing = await prisma.shift.findFirst({
    where: { attendantId: userId, status: 'LIVE' },
    orderBy: { startedAt: 'desc' },
  });
  if (existing) return existing;

  let pump = await prisma.pump.findFirst({ orderBy: { name: 'asc' } });
  if (!pump) pump = await prisma.pump.create({ data: { name: 'Pump 01' } });

  return prisma.shift.create({ data: { pumpId: pump.id, attendantId: userId, status: 'LIVE' } });
}

export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  const entries = await listFuelEntries();
  return NextResponse.json({ entries });
}

export async function POST(request) {
  const { session, error } = await requireAction('createFuelEntry');
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid entry.' }, { status: 400 });
  }
  const data = parsed.data;
  const customerId = data.customerId || null;
  const vehicleNumber = data.vehicleNumber || null;

  if (data.paymentMode === 'CREDIT' && !customerId) {
    return NextResponse.json({ error: 'Select a customer for a credit sale.' }, { status: 400 });
  }

  const shift = await getOrCreateActiveShift(session.sub);
  const ratePerL = data.amount / data.quantityL;

  const entry = await prisma.fuelEntry.create({
    data: {
      shiftId: shift.id,
      fuelType: data.fuelType,
      quantityL: data.quantityL,
      ratePerL,
      amount: data.amount,
      vehicleNumber,
      customerId,
      paymentMode: data.paymentMode,
      createdById: session.sub,
      status: 'Pending',
    },
  });

  await prisma.shift.update({
    where: { id: shift.id },
    data: { volumeL: { increment: data.quantityL }, collectionAmount: { increment: data.amount } },
  });

  if (data.paymentMode === 'CREDIT' && customerId) {
    await prisma.creditTransaction.create({
      data: {
        customerId,
        fuelEntryId: entry.id,
        amount: data.amount,
        type: 'DEBIT',
        note: `${data.fuelType} · ${vehicleNumber || 'Credit sale'}`,
      },
    });
    await prisma.customer.update({ where: { id: customerId }, data: { outstandingAmount: { increment: data.amount } } });
  }

  const needsApproval = data.paymentMode === 'CREDIT' || data.amount >= CREDIT_OR_LARGE_THRESHOLD;
  if (needsApproval) {
    await prisma.approval.create({
      data: {
        type: data.paymentMode === 'CREDIT' ? 'CREDIT_SALE' : 'FUEL_ISSUE',
        fuelEntryId: entry.id,
        title: `Fuel issue · ${vehicleNumber || data.fuelType}`,
        detail: `${data.fuelType} / ${data.quantityL} L`,
        amount: data.amount,
        requestedById: session.sub,
      },
    });
  } else {
    await prisma.fuelEntry.update({ where: { id: entry.id }, data: { status: 'Approved' } });
  }

  await prisma.activityLog.create({
    data: {
      actorId: session.sub,
      icon: '⛽',
      title: `${data.fuelType.charAt(0)}${data.fuelType.slice(1).toLowerCase()} · ${vehicleNumber || 'Walk-in'}`,
      summary: `${data.paymentMode === 'CREDIT' ? 'Credit sale' : 'Cash sale'} · ₹${data.amount.toLocaleString('en-IN')}`,
      status: needsApproval ? 'Pending' : 'Paid',
    },
  });

  return NextResponse.json({ entry: { id: entry.id, status: needsApproval ? 'Pending' : 'Approved' } }, { status: 201 });
}
