import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireTallyApiKey } from '@/lib/tally-auth';

const schema = z.object({
  fuelEntryIds: z.array(z.string()).default([]),
  paymentIds: z.array(z.string()).default([]),
});

export async function POST(request) {
  const error = requireTallyApiKey(request);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const now = new Date();
  const [fuelResult, paymentResult] = await Promise.all([
    parsed.data.fuelEntryIds.length > 0
      ? prisma.fuelEntry.updateMany({ where: { id: { in: parsed.data.fuelEntryIds } }, data: { tallySyncedAt: now } })
      : Promise.resolve({ count: 0 }),
    parsed.data.paymentIds.length > 0
      ? prisma.creditTransaction.updateMany({ where: { id: { in: parsed.data.paymentIds } }, data: { tallySyncedAt: now } })
      : Promise.resolve({ count: 0 }),
  ]);

  return NextResponse.json({ fuelEntriesAcked: fuelResult.count, paymentsAcked: paymentResult.count });
}
