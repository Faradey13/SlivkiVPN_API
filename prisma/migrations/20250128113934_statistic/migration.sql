/*
  Warnings:

  - A unique constraint covering the columns `[user_id,vpn_key_id]` on the table `connection_statistic` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "connection_statistic_user_id_vpn_key_id_key" ON "connection_statistic"("user_id", "vpn_key_id");
