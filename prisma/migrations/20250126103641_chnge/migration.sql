/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `subscription_plan` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "subscription_plan_name_key" ON "subscription_plan"("name");
