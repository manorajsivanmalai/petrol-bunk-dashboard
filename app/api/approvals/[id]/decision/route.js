import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAction } from '@/lib/api-guard';

const schema = z.object({ action: z.enum(['approve', 'reject']) });

export async function POST(request, { params }) {
  const { session, error } = await requireAction('decideApproval');
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid decision.' }, { status: 400 });

  const approval = await prisma.approval.findUnique({ where: { id } });
  if (!approval) return NextResponse.json({ error: 'Approval not found.' }, { status: 404 });
  if (approval.status !== 'PENDING') {
    return NextResponse.json({ error: 'This approval has already been decided.' }, { status: 409 });
  }

  const nextStatus = parsed.data.action === 'approve' ? 'APPROVED' : 'REJECTED';

  await prisma.$transaction(async tx => {
    await tx.approval.update({
      where: { id },
      data: { status: nextStatus, decidedById: session.sub, decidedAt: new Date() },
    });
    if (approval.fuelEntryId) {
      await tx.fuelEntry.update({
        where: { id: approval.fuelEntryId },
        data: { status: nextStatus === 'APPROVED' ? 'Approved' : 'Rejected' },
      });
    }
    await tx.activityLog.create({
      data: {
        actorId: session.sub,
        icon: '✓',
        title: approval.title,
        summary: `${nextStatus === 'APPROVED' ? 'Approved' : 'Rejected'} · ${approval.detail || ''}`.trim(),
        status: nextStatus === 'APPROVED' ? 'Approved' : 'Rejected',
      },
    });
  });

  return NextResponse.json({ status: nextStatus });
}
