import { prisma } from '@/lib/prisma';

export async function listCustomers() {
  const customers = await prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });
  return customers.map(customer => ({
    id: customer.id,
    name: customer.name,
    contactPhone: customer.contactPhone,
    creditLimit: Number(customer.creditLimit),
    outstandingAmount: Number(customer.outstandingAmount),
    status: customer.status,
    createdAt: customer.createdAt,
  }));
}
