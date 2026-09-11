import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAction } from '@/lib/api-guard';
import { generateTempPassword } from '@/lib/password';

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters.').optional().or(z.literal('')),
});

export async function POST(request, { params }) {
  const { session, error } = await requireAction('manageUsers');
  if (error) return error;

  const { id } = await params;
  if (id === session.sub) {
    return NextResponse.json({ error: 'You cannot reset your own password here.' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: 'Member not found.' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid password.' }, { status: 400 });
  }

  const password = parsed.data.password || generateTempPassword();
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash } });

  await prisma.activityLog.create({
    data: {
      actorId: session.sub,
      icon: '◇',
      title: `Password reset · ${target.name}`,
      summary: 'Password reset by admin',
      status: 'Done',
    },
  });

  return NextResponse.json({ password });
}
