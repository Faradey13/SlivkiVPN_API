/*
  Warnings:

  - You are about to drop the `operating_system` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `is_active` to the `user_promocodes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "connection_statistic" DROP CONSTRAINT "connection_statistic_os_id_fkey";

-- AlterTable
ALTER TABLE "user_promocodes" ADD COLUMN     "is_active" BOOLEAN NOT NULL;

-- DropTable
DROP TABLE "operating_system";
