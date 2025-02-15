/*
  Warnings:

  - You are about to drop the column `apiUrl` on the `region` table. All the data in the column will be lost.
  - You are about to drop the column `fingerprint` on the `region` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "region" DROP COLUMN "apiUrl",
DROP COLUMN "fingerprint";

-- CreateTable
CREATE TABLE "server_vless" (
    "id" SERIAL NOT NULL,
    "apiUrl" TEXT NOT NULL,
    "uername" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "security" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "serverNames" TEXT NOT NULL,
    "shortIds" TEXT NOT NULL,
    "flow" TEXT NOT NULL,
    "region_id" INTEGER NOT NULL,

    CONSTRAINT "server_vless_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_outline" (
    "id" SERIAL NOT NULL,
    "apiUrl" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "region_id" INTEGER NOT NULL,

    CONSTRAINT "server_outline_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "server_vless" ADD CONSTRAINT "server_vless_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_outline" ADD CONSTRAINT "server_outline_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "region"("id") ON DELETE CASCADE ON UPDATE CASCADE;
