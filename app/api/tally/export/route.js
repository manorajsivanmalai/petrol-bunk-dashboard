import { prisma } from '@/lib/prisma';
import { requireAction } from '@/lib/api-guard';
import { buildTallyExportXML } from '@/lib/tally';

export async function GET() {
  const { error } = await requireAction('viewReports');
  if (error) return error;

  const [customers, fuelEntries, payments] = await Promise.all([
    prisma.customer.findMany({ select: { id: true, name: true, outstandingAmount: true } }),
    prisma.fuelEntry.findMany({
      where: { paymentMode: 'CREDIT', customerId: { not: null } },
      select: {
        id: true,
        customerId: true,
        fuelType: true,
        quantityL: true,
        vehicleNumber: true,
        amount: true,
        createdAt: true,
        customer: { select: { name: true } },
      },
    }),
    prisma.creditTransaction.findMany({
      where: { type: 'PAYMENT' },
      select: {
        id: true,
        customerId: true,
        amount: true,
        note: true,
        createdAt: true,
        customer: { select: { name: true } },
      },
    }),
  ]);

  const xml = buildTallyExportXML({
    customers: customers.map(c => ({ id: c.id, name: c.name, outstandingAmount: Number(c.outstandingAmount) })),
    fuelEntries: fuelEntries.map(e => ({
      id: e.id,
      customerId: e.customerId,
      customerName: e.customer.name,
      fuelType: e.fuelType,
      quantityL: Number(e.quantityL),
      vehicleNumber: e.vehicleNumber,
      amount: Number(e.amount),
      createdAt: e.createdAt,
    })),
    payments: payments.map(p => ({
      id: p.id,
      customerId: p.customerId,
      customerName: p.customer.name,
      amount: Number(p.amount),
      note: p.note,
      createdAt: p.createdAt,
    })),
  });

  return new Response(xml, {
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="tally-export-${new Date().toISOString().slice(0, 10)}.xml"`,
    },
  });
}
