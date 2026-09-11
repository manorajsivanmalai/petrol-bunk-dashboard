import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAction } from '@/lib/api-guard';
import { ROLES } from '@/lib/rbac';

const schema = z.object({
  role: z.enum(ROLES).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(request, { params }) {
  const { session, error } = await requireAction('manageUsers');
  if (error) return error;

  const { id } = await params;
  if (id === session.sub) {
    return NextResponse.json({ error: 'You cannot change your own role or access.' }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success || (parsed.data.role === undefined && parsed.data.active === undefined)) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  const user = await prisma.user.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ user: { id: user.id, role: user.role, active: user.active } });
}
