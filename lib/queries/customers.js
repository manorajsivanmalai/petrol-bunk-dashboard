import { prisma } from '@/lib/prisma';

export async function listCustomers() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
    include: { vehicles: { orderBy: { createdAt: 'asc' } } },
  });
  return customers.map(customer => ({
    id: customer.id,
    name: customer.name,
    contactPhone: customer.contactPhone,
    vehicles: customer.vehicles.map(vehicle => ({ id: vehicle.id, vehicleNumber: vehicle.vehicleNumber })),
    creditLimit: Number(customer.creditLimit),
    outstandingAmount: Number(customer.outstandingAmount),
    status: customer.status,
    createdAt: customer.createdAt,
  }));
}
