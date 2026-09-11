const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const SEED_PASSWORD = 'Agency@123';

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { name: 'Arun Kumar', username: 'admin', role: 'SUPER_ADMIN', passwordHash, phone: '9443218012' },
  });
  const manager = await prisma.user.upsert({
    where: { username: 'manager' },
    update: {},
    create: { name: 'Meena S.', username: 'manager', role: 'MANAGER', passwordHash, phone: '9842177102' },
  });
  const attendant = await prisma.user.upsert({
    where: { username: 'attendant' },
    update: {},
    create: { name: 'Karthik R.', username: 'attendant', role: 'ATTENDANT', passwordHash, phone: '9600011223' },
  });
  const accountant = await prisma.user.upsert({
    where: { username: 'accountant' },
    update: {},
    create: { name: 'Priya V.', username: 'accountant', role: 'ACCOUNTANT', passwordHash, phone: '9600044556' },
  });

  const pump1 = await prisma.pump.upsert({ where: { name: 'Pump 01' }, update: {}, create: { name: 'Pump 01' } });
  const pump3 = await prisma.pump.upsert({ where: { name: 'Pump 03' }, update: {}, create: { name: 'Pump 03' } });

  const customerA = await prisma.customer.create({
    data: { name: 'ABC Transport', contactPhone: '9443218012', creditLimit: 100000, outstandingAmount: 36700 },
  });
  const customerB = await prisma.customer.create({
    data: { name: 'Selvam Earth Movers', contactPhone: '9842177102', creditLimit: 75000, outstandingAmount: 18400 },
  });

  const morningShift = await prisma.shift.create({
    data: {
      pumpId: pump1.id,
      attendantId: attendant.id,
      status: 'CLOSED',
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 10),
      endedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
      openingReading: 0,
      closingReading: 486,
      volumeL: 486,
      collectionAmount: 61200,
    },
  });

  const eveningShift = await prisma.shift.create({
    data: {
      pumpId: pump3.id,
      attendantId: attendant.id,
      status: 'LIVE',
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
      openingReading: 0,
      volumeL: 526,
      collectionAmount: 67250,
    },
  });

  const dieselEntry = await prisma.fuelEntry.create({
    data: {
      shiftId: eveningShift.id,
      fuelType: 'DIESEL',
      quantityL: 240,
      ratePerL: 100,
      amount: 24000,
      vehicleNumber: 'TN15 AB 4582',
      customerId: customerA.id,
      paymentMode: 'CREDIT',
      createdById: attendant.id,
    },
  });

  await prisma.fuelEntry.create({
    data: {
      shiftId: eveningShift.id,
      fuelType: 'PETROL',
      quantityL: 40,
      ratePerL: 105,
      amount: 4200,
      vehicleNumber: 'TN32 K 9931',
      paymentMode: 'CASH',
      createdById: attendant.id,
      status: 'Approved',
    },
  });

  await prisma.creditTransaction.create({
    data: { customerId: customerA.id, fuelEntryId: dieselEntry.id, amount: 24000, type: 'DEBIT', note: 'Diesel · TN15 AB 4582' },
  });

  await prisma.approval.createMany({
    data: [
      {
        type: 'FUEL_ISSUE',
        fuelEntryId: dieselEntry.id,
        title: 'Fuel issue · TN15 AB 4582',
        detail: 'Diesel / 240 L',
        amount: 24000,
        status: 'PENDING',
        requestedById: attendant.id,
      },
      {
        type: 'CREDIT_SALE',
        title: 'Credit sale · ABC Transport',
        detail: 'Invoice #KA-2480',
        amount: 8120,
        status: 'PENDING',
        requestedById: manager.id,
      },
      {
        type: 'SHIFT_CLOSE',
        title: 'Shift close · Evening',
        detail: 'Pump 03 / 18 entries',
        amount: 42800,
        status: 'PENDING',
        requestedById: attendant.id,
      },
      {
        type: 'FUEL_ISSUE',
        title: 'Fuel issue · TN32 K 9931',
        detail: 'Petrol / 40 L',
        amount: 4200,
        status: 'APPROVED',
        requestedById: attendant.id,
        decidedById: manager.id,
        decidedAt: new Date(),
      },
    ],
  });

  await prisma.activityLog.createMany({
    data: [
      { actorId: attendant.id, icon: '⛽', title: 'Diesel · TN15 AB 4582', summary: 'ABC Transport · ₹8,120', status: 'Approved' },
      { actorId: attendant.id, icon: '⛽', title: 'Petrol · TN32 K 9931', summary: 'Cash sale · ₹2,400', status: 'Paid' },
      { actorId: admin.id, icon: '◫', title: 'Tally sync completed', summary: '18 vouchers posted', status: 'Done' },
    ],
  });

  console.log('Seed complete. Demo accounts (all use password "Agency@123"):');
  console.log('  admin / manager / attendant / accountant');
  console.log('IMPORTANT: change these passwords before going live.');
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
