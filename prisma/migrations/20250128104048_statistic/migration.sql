/*
  Warnings:

  - You are about to drop the column `os_id` on the `connection_statistic` table. All the data in the column will be lost.
  - You are about to drop the column `time_connection` on the `connection_statistic` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "connection_statistic" DROP COLUMN "os_id",
DROP COLUMN "time_connection";
