/*
  Warnings:

  - A unique constraint covering the columns `[protocol_name]` on the table `protocol` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "protocol_protocol_name_key" ON "protocol"("protocol_name");
