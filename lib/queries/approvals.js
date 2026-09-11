import { prisma } from '@/lib/prisma';

export async function listApprovals(status) {
  const approvals = await prisma.approval.findMany({
    where: status ? { status: status.toUpperCase() } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { requestedBy: { select: { name: true } }, decidedBy: { select: { name: true } } },
  });

  return approvals.map(item => ({
    id: item.id,
    type: item.type,
    title: item.title,
    detail: item.detail,
    amount: Number(item.amount),
    status: item.status,
    requestedByName: item.requestedBy.name,
    decidedByName: item.decidedBy?.name || null,
    createdAt: item.createdAt,
    decidedAt: item.decidedAt,
  }));
}
