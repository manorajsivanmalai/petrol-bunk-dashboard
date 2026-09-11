import { prisma } from '@/lib/prisma';

export async function listActivity({ take = 100 } = {}) {
  const entries = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take,
    include: { actor: { select: { name: true, username: true, role: true } } },
  });

  return entries.map(entry => ({
    id: entry.id,
    icon: entry.icon,
    title: entry.title,
    summary: entry.summary,
    status: entry.status,
    createdAt: entry.createdAt,
    actorName: entry.actor?.name || 'System',
    actorUsername: entry.actor?.username || null,
    actorRole: entry.actor?.role || null,
  }));
}
