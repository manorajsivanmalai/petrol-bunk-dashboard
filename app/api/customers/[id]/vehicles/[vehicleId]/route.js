import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAction } from '@/lib/api-guard';

export async function DELETE(request, { params }) {
  const { session, error } = await requireAction('manageCustomers');
  if (error) return error;

  const { id, vehicleId } = await params;
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId }, include: { customer: true } });
  if (!vehicle || vehicle.customerId !== id) {
    return NextResponse.json({ error: 'Vehicle not found.' }, { status: 404 });
  }

  await prisma.vehicle.delete({ where: { id: vehicleId } });

  await prisma.activityLog.create({
    data: {
      actorId: session.sub,
      icon: '♙',
      title: `Vehicle removed · ${vehicle.customer.name}`,
      summary: vehicle.vehicleNumber,
      status: 'Done',
    },
  });

  return NextResponse.json({ ok: true });
}
