-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "vehicleNumber" TEXT;

-- CreateIndex
CREATE INDEX "Customer_vehicleNumber_idx" ON "Customer"("vehicleNumber");
