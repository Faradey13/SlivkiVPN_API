/*
  Warnings:

  - Added the required column `apiUrl` to the `region` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fingerprint` to the `region` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "region" ADD COLUMN     "apiUrl" TEXT NOT NULL,
ADD COLUMN     "fingerprint" TEXT NOT NULL;
