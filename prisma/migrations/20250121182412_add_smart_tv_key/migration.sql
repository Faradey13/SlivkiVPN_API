/*
  Warnings:

  - Added the required column `vpn_smartTv_key_id` to the `connection_statistic` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "connection_statistic" ADD COLUMN     "vpn_smartTv_key_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "vpn_keys_smartTv" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "protocol_id" INTEGER NOT NULL,
    "server" TEXT NOT NULL,
    "server_port" INTEGER NOT NULL,
    "local_port" INTEGER NOT NULL,
    "password" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "remarks" TEXT NOT NULL,
    "key_id" INTEGER NOT NULL,
    "region_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vpn_keys_smartTv_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "vpn_keys_smartTv" ADD CONSTRAINT "vpn_keys_smartTv_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vpn_keys_smartTv" ADD CONSTRAINT "vpn_keys_smartTv_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vpn_keys_smartTv" ADD CONSTRAINT "vpn_keys_smartTv_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connection_statistic" ADD CONSTRAINT "connection_statistic_vpn_smartTv_key_id_fkey" FOREIGN KEY ("vpn_smartTv_key_id") REFERENCES "vpn_keys_smartTv"("id") ON DELETE CASCADE ON UPDATE CASCADE;
