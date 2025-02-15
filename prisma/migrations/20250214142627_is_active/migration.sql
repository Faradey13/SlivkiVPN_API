/*
  Warnings:

  - You are about to drop the column `uername` on the `server_vless` table. All the data in the column will be lost.
  - Added the required column `username` to the `server_vless` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "server_vless" DROP COLUMN "uername",
ADD COLUMN     "username" TEXT NOT NULL;
