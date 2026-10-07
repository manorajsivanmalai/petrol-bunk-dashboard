import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAction, requireSession } from '@/lib/api-guard';
import { listFuelEntries } from '@/lib/queries/fuel-entries';
import { normalizeVehicleNumber } from '@/lib/vehicle';

const schema = z.object({
  fuelType: z.enum(['PETROL', 'DIESEL', 'XP95']),
  quantityL: z.coerce.number().positive(),
  amount: z.coerce.number().positive(),
  vehicleNumber: z.string().trim().min(1, 'Select a registered customer vehicle.').transform(normalizeVehicleNumber),
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
  const vehicleNumber = data.vehicleNumber;

  const vehicle = await prisma.vehicle.findUnique({ where: { vehicleNumber } });
  if (!vehicle) {
    return NextResponse.json(
      { error: `No customer is registered to ${vehicleNumber}. Add them under Customers first.` },
      { status: 400 }
    );
  }
  const customerId = vehicle.customerId;

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
      paymentMode: 'CREDIT',
      createdById: session.sub,
      status: 'Pending',
    },
  });

  await prisma.shift.update({
    where: { id: shift.id },
    data: { volumeL: { increment: data.quantityL }, collectionAmount: { increment: data.amount } },
  });

  await prisma.creditTransaction.create({
    data: {
      customerId,
      fuelEntryId: entry.id,
      amount: data.amount,
      type: 'DEBIT',
      note: `${data.fuelType} · ${vehicleNumber}`,
    },
  });
  await prisma.customer.update({ where: { id: customerId }, data: { outstandingAmount: { increment: data.amount } } });

  await prisma.approval.create({
    data: {
      type: 'CREDIT_SALE',
      fuelEntryId: entry.id,
      title: `Fuel issue · ${vehicleNumber}`,
      detail: `${data.fuelType} / ${data.quantityL} L`,
      amount: data.amount,
      requestedById: session.sub,
    },
  });

  await prisma.activityLog.create({
    data: {
      actorId: session.sub,
      icon: '⛽',
      title: `${data.fuelType.charAt(0)}${data.fuelType.slice(1).toLowerCase()} · ${vehicleNumber}`,
      summary: `Credit sale · ₹${data.amount.toLocaleString('en-IN')}`,
      status: 'Pending',
    },
  });

  return NextResponse.json({ entry: { id: entry.id, status: 'Pending' } }, { status: 201 });
}
