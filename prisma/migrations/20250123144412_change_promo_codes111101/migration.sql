/*
  Warnings:

  - A unique constraint covering the columns `[user_id,code_id]` on the table `user_promocodes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "user_promocodes_user_id_code_id_key" ON "user_promocodes"("user_id", "code_id");
