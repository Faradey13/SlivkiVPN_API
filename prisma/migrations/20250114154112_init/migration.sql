/*
  Warnings:

  - Added the required column `discount` to the `promo_codes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "promo_codes" ADD COLUMN     "discount" INTEGER NOT NULL;
