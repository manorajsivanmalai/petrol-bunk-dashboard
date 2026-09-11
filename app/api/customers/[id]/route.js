import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/api-guard';

export async function GET(request, { params }) {
  const { error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { creditTransactions: { orderBy: { createdAt: 'desc' }, take: 50 } },
  });
  if (!customer) return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });

  return NextResponse.json({
    customer: {
      id: customer.id,
      name: customer.name,
      contactPhone: customer.contactPhone,
      creditLimit: Number(customer.creditLimit),
      outstandingAmount: Number(customer.outstandingAmount),
      status: customer.status,
    },
    transactions: customer.creditTransactions.map(tx => ({
      id: tx.id,
      amount: Number(tx.amount),
      type: tx.type,
      note: tx.note,
      createdAt: tx.createdAt,
    })),
  });
}
