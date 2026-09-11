import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAction } from '@/lib/api-guard';
import { ROLES } from '@/lib/rbac';
import { listUsers } from '@/lib/queries/users';
import { generateTempPassword } from '@/lib/password';

const schema = z.object({
  name: z.string().trim().min(1),
  username: z
    .string()
    .trim()
    .min(3)
    .regex(/^[a-z0-9._-]+$/i, 'Use letters, numbers, dot, dash or underscore only.'),
  email: z.string().trim().email('Enter a valid email address.'),
  role: z.enum(ROLES),
  phone: z.string().trim().optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters.').optional().or(z.literal('')),
});

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

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username: parsed.data.username }, { email: parsed.data.email }] },
  });
  if (existing) return NextResponse.json({ error: 'That username or email is already taken.' }, { status: 409 });

  const password = parsed.data.password || generateTempPassword();
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      username: parsed.data.username,
      email: parsed.data.email,
      role: parsed.data.role,
      phone: parsed.data.phone || null,
      passwordHash,
    },
  });

  await prisma.activityLog.create({
    data: {
      actorId: session.sub,
      icon: '◇',
      title: 'Team member invited',
      summary: `${user.name} · ${user.role}`,
      status: 'Done',
    },
  });

  return NextResponse.json(
    { user: { id: user.id, name: user.name, username: user.username, role: user.role }, password },
    { status: 201 }
  );
}
