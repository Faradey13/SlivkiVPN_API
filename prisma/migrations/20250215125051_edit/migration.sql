/*
  Warnings:

  - You are about to drop the column `apiUrl` on the `server_vless` table. All the data in the column will be lost.
  - Added the required column `api_url` to the `server_vless` table without a default value. This is not possible if the table is not empty.
  - Added the required column `key_url` to the `server_vless` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "server_vless" DROP COLUMN "apiUrl",
ADD COLUMN     "api_url" TEXT NOT NULL,
ADD COLUMN     "key_url" TEXT NOT NULL;
