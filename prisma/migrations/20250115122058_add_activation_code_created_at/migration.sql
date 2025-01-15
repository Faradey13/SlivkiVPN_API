/*
  Warnings:

  - Made the column `is_activated` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "user" ALTER COLUMN "is_activated" SET NOT NULL;
