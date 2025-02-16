/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `protocol` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `protocol` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "protocol" ADD COLUMN     "user_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "protocol_user_id_key" ON "protocol"("user_id");
