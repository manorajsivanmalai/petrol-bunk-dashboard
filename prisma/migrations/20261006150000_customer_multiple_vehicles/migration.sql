-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- Migrate existing single vehicle numbers into the new table
INSERT INTO "Vehicle" ("id", "vehicleNumber", "customerId", "createdAt")
SELECT 'veh_' || "id", "vehicleNumber", "id", now()
FROM "Customer"
WHERE "vehicleNumber" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vehicleNumber_key" ON "Vehicle"("vehicleNumber");

-- CreateIndex
CREATE INDEX "Vehicle_customerId_idx" ON "Vehicle"("customerId");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropIndex
DROP INDEX IF EXISTS "Customer_vehicleNumber_idx";

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "vehicleNumber";
