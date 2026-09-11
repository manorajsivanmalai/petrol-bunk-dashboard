import { prisma } from '@/lib/prisma';

export async function listUsers() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  return users.map(user => ({
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    active: user.active,
    lastActiveAt: user.lastActiveAt,
  }));
}
