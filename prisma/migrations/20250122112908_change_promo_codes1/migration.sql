/*
  Warnings:

  - Added the required column `isAvailable` to the `free_subscription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "free_subscription" ADD COLUMN     "isAvailable" BOOLEAN NOT NULL;
