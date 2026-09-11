import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAction, requireSession } from '@/lib/api-guard';
import { listCustomers } from '@/lib/queries/customers';

const schema = z.object({
  name: z.string().trim().min(1),
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

  const customer = await prisma.customer.create({
    data: {
      name: parsed.data.name,
      contactPhone: parsed.data.contactPhone || null,
      creditLimit: parsed.data.creditLimit,
    },
  });

  await prisma.activityLog.create({
    data: { actorId: session.sub, icon: '♙', title: 'New customer added', summary: customer.name, status: 'Done' },
  });

  return NextResponse.json({ customer }, { status: 201 });
}
