/*
  Warnings:

  - You are about to drop the column `disabele_data` on the `user_promocodes` table. All the data in the column will be lost.
  - Added the required column `disabledAt` to the `user_promocodes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user_promocodes" DROP COLUMN "disabele_data",
ADD COLUMN     "disabledAt" TIMESTAMP(3) NOT NULL;
