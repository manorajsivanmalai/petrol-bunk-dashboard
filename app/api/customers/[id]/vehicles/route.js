import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAction } from '@/lib/api-guard';
import { normalizeVehicleNumber } from '@/lib/vehicle';

const schema = z.object({
  vehicleNumber: z.string().trim().min(1, 'Enter a vehicle number.').transform(normalizeVehicleNumber),
});

export async function POST(request, { params }) {
  const { session, error } = await requireAction('manageCustomers');
  if (error) return error;

  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid vehicle number.' }, { status: 400 });
  }

  const existing = await prisma.vehicle.findUnique({ where: { vehicleNumber: parsed.data.vehicleNumber } });
  if (existing) {
    return NextResponse.json({ error: 'That vehicle number is already registered to a customer.' }, { status: 409 });
  }

  const vehicle = await prisma.vehicle.create({
    data: { vehicleNumber: parsed.data.vehicleNumber, customerId: id },
  });

  await prisma.activityLog.create({
    data: {
      actorId: session.sub,
      icon: '♙',
      title: `Vehicle added · ${customer.name}`,
      summary: vehicle.vehicleNumber,
      status: 'Done',
    },
  });

  return NextResponse.json({ vehicle }, { status: 201 });
}
