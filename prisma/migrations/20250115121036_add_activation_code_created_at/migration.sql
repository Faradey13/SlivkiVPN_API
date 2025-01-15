/*
  Warnings:

  - You are about to drop the column `deletion_date` on the `activation_codes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "activation_codes" DROP COLUMN "deletion_date";
