/*
  Warnings:

  - You are about to drop the column `vpn_smartTv_key_id` on the `connection_statistic` table. All the data in the column will be lost.
  - You are about to drop the `vpn_keys_smartTv` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "connection_statistic" DROP CONSTRAINT "connection_statistic_vpn_smartTv_key_id_fkey";

-- DropForeignKey
ALTER TABLE "vpn_keys_smartTv" DROP CONSTRAINT "vpn_keys_smartTv_protocol_id_fkey";

-- DropForeignKey
ALTER TABLE "vpn_keys_smartTv" DROP CONSTRAINT "vpn_keys_smartTv_region_id_fkey";

-- DropForeignKey
ALTER TABLE "vpn_keys_smartTv" DROP CONSTRAINT "vpn_keys_smartTv_user_id_fkey";

-- AlterTable
ALTER TABLE "connection_statistic" DROP COLUMN "vpn_smartTv_key_id";

-- DropTable
DROP TABLE "vpn_keys_smartTv";
