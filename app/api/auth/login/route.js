import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSessionToken, COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/auth';

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a username and password.' }, { status: 400 });
  }

  const { username, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Check the demo credentials for this role.' }, { status: 401 });
  }

  const token = await createSessionToken(user);
  await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });

  const response = NextResponse.json({
    user: { id: user.id, name: user.name, username: user.username, role: user.role },
  });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
