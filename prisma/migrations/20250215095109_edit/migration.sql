/*
  Warnings:

  - You are about to drop the column `isActive` on the `protocol` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `protocol` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[protocol_id]` on the table `user_protocol` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "protocol_user_id_key";

-- AlterTable
ALTER TABLE "protocol" DROP COLUMN "isActive",
DROP COLUMN "user_id";

-- AlterTable
ALTER TABLE "user_protocol" ALTER COLUMN "protocol_id" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "user_protocol_protocol_id_key" ON "user_protocol"("protocol_id");

-- AddForeignKey
ALTER TABLE "user_protocol" ADD CONSTRAINT "user_protocol_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_protocol" ADD CONSTRAINT "user_protocol_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;
