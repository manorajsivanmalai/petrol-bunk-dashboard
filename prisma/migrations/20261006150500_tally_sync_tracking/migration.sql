-- AlterTable
ALTER TABLE "FuelEntry" ADD COLUMN "tallySyncedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CreditTransaction" ADD COLUMN "tallySyncedAt" TIMESTAMP(3);
