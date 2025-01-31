/*
  Warnings:

  - You are about to drop the column `period` on the `payment` table. All the data in the column will be lost.
  - Added the required column `isUsed` to the `referral_user` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isUsed` to the `user_promocodes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payment" DROP COLUMN "period";

-- AlterTable
ALTER TABLE "referral_user" ADD COLUMN     "isUsed" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "user_promocodes" ADD COLUMN     "isUsed" BOOLEAN NOT NULL;
