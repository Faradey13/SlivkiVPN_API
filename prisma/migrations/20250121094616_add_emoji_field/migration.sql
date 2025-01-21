/*
  Warnings:

  - Added the required column `flag` to the `region` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "region" ADD COLUMN     "flag" TEXT NOT NULL;
