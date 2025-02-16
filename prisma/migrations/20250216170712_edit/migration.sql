/*
  Warnings:

  - Added the required column `protocol_id` to the `server_outline` table without a default value. This is not possible if the table is not empty.
  - Added the required column `protocol_id` to the `server_vless` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "server_outline" ADD COLUMN     "protocol_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "server_vless" ADD COLUMN     "protocol_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "user_promocodes" ADD COLUMN     "isDisabled" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "server_vless" ADD CONSTRAINT "server_vless_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_outline" ADD CONSTRAINT "server_outline_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;
