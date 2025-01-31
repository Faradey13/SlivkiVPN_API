/*
  Warnings:

  - Added the required column `isFree` to the `subscription_plans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN     "isFree" BOOLEAN NOT NULL;
