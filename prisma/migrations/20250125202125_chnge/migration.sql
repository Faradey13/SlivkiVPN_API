/*
  Warnings:

  - You are about to drop the `subscription_plans` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "payment" DROP CONSTRAINT "payment_plan_id_fkey";

-- DropTable
DROP TABLE "subscription_plans";

-- CreateTable
CREATE TABLE "subscription_plan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isFree" BOOLEAN NOT NULL,
    "price" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,

    CONSTRAINT "subscription_plan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plan"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
