/*
  Warnings:

  - You are about to drop the column `apiUrl` on the `region` table. All the data in the column will be lost.
  - You are about to drop the column `fingerprint` on the `region` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "free_subscription" ALTER COLUMN "date_last_free_sub" DROP NOT NULL,
ALTER COLUMN "isAvailable" SET DEFAULT true;

-- AlterTable
ALTER TABLE "region" DROP COLUMN "apiUrl",
DROP COLUMN "fingerprint";
