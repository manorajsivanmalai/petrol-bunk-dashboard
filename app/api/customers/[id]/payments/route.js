import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAction } from '@/lib/api-guard';

const schema = z.object({
  amount: z.coerce.number().positive(),
  note: z.string().trim().max(200).optional().or(z.literal('')),
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
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid payment.' }, { status: 400 });
  }

  const transaction = await prisma.creditTransaction.create({
    data: {
      customerId: id,
      amount: parsed.data.amount,
      type: 'PAYMENT',
      note: parsed.data.note || 'Payment received',
    },
  });
  await prisma.customer.update({ where: { id }, data: { outstandingAmount: { decrement: parsed.data.amount } } });

  await prisma.activityLog.create({
    data: {
      actorId: session.sub,
      icon: '₹',
      title: `Payment received · ${customer.name}`,
      summary: `₹${parsed.data.amount.toLocaleString('en-IN')}`,
      status: 'Done',
    },
  });

  return NextResponse.json({ transaction: { id: transaction.id, amount: Number(transaction.amount) } }, { status: 201 });
}
