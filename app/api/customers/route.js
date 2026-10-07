import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAction, requireSession } from '@/lib/api-guard';
import { listCustomers } from '@/lib/queries/customers';
import { normalizeVehicleNumber } from '@/lib/vehicle';

const schema = z.object({
  name: z.string().trim().min(1),
  vehicleNumbers: z.preprocess(
    value => (Array.isArray(value) ? value : []),
    z
      .array(z.string().trim().min(1))
      .transform(values => [...new Set(values.map(normalizeVehicleNumber).filter(Boolean))])
      .refine(values => values.length > 0, { message: 'Add at least one vehicle number.' })
  ),
  contactPhone: z.string().trim().optional().or(z.literal('')),
  creditLimit: z.coerce.number().min(0).default(0),
});

export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  const customers = await listCustomers();
  return NextResponse.json({ customers });
}

export async function POST(request) {
  const { session, error } = await requireAction('manageCustomers');
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid customer.' }, { status: 400 });
  }

  const existingVehicles = await prisma.vehicle.findMany({
    where: { vehicleNumber: { in: parsed.data.vehicleNumbers } },
  });
  if (existingVehicles.length > 0) {
    return NextResponse.json(
      { error: `Vehicle ${existingVehicles[0].vehicleNumber} is already registered to another customer.` },
      { status: 409 }
    );
  }

  const customer = await prisma.customer.create({
    data: {
      name: parsed.data.name,
      contactPhone: parsed.data.contactPhone || null,
      creditLimit: parsed.data.creditLimit,
      vehicles: { create: parsed.data.vehicleNumbers.map(vehicleNumber => ({ vehicleNumber })) },
    },
    include: { vehicles: true },
  });

  await prisma.activityLog.create({
    data: { actorId: session.sub, icon: '♙', title: 'New customer added', summary: customer.name, status: 'Done' },
  });

  return NextResponse.json({ customer }, { status: 201 });
}
