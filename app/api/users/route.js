import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireAction } from '@/lib/api-guard';
import { ROLES } from '@/lib/rbac';
import { listUsers } from '@/lib/queries/users';

const schema = z.object({
  name: z.string().trim().min(1),
  username: z
    .string()
    .trim()
    .min(3)
    .regex(/^[a-z0-9._-]+$/i, 'Use letters, numbers, dot, dash or underscore only.'),
  role: z.enum(ROLES),
  phone: z.string().trim().optional().or(z.literal('')),
});

function generateTempPassword() {
  return `${crypto.randomBytes(5).toString('hex')}Aa1`;
}

export async function GET() {
  const { error } = await requireAction('manageUsers');
  if (error) return error;

  const users = await listUsers();
  return NextResponse.json({ users });
}

export async function POST(request) {
  const { session, error } = await requireAction('manageUsers');
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid member.' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (existing) return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 });

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      username: parsed.data.username,
      role: parsed.data.role,
      phone: parsed.data.phone || null,
      passwordHash,
    },
  });

  await prisma.activityLog.create({
    data: { actorId: session.sub, icon: '◇', title: 'Team member invited', summary: `${user.name} · ${user.role}`, status: 'Done' },
  });

  return NextResponse.json(
    { user: { id: user.id, name: user.name, username: user.username, role: user.role }, tempPassword },
    { status: 201 }
  );
}
