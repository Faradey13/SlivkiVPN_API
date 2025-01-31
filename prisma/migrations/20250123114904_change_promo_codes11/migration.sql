/*
  Warnings:

  - Added the required column `promo_code_id` to the `payment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "connection_statistic" DROP CONSTRAINT "connection_statistic_protocol_id_fkey";

-- DropForeignKey
ALTER TABLE "connection_statistic" DROP CONSTRAINT "connection_statistic_region_id_fkey";

-- DropForeignKey
ALTER TABLE "connection_statistic" DROP CONSTRAINT "connection_statistic_user_id_fkey";

-- DropForeignKey
ALTER TABLE "connection_statistic" DROP CONSTRAINT "connection_statistic_vpn_key_id_fkey";

-- DropForeignKey
ALTER TABLE "payment" DROP CONSTRAINT "payment_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "subscription_statictic" DROP CONSTRAINT "subscription_statictic_user_id_fkey";

-- AlterTable
ALTER TABLE "payment" ADD COLUMN     "promo_code_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "subscription_statictic" ADD CONSTRAINT "subscription_statictic_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "promo_codes"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_statistic" ADD CONSTRAINT "connection_statistic_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_statistic" ADD CONSTRAINT "connection_statistic_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "region"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_statistic" ADD CONSTRAINT "connection_statistic_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "protocol"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_statistic" ADD CONSTRAINT "connection_statistic_vpn_key_id_fkey" FOREIGN KEY ("vpn_key_id") REFERENCES "vpn_keys"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
