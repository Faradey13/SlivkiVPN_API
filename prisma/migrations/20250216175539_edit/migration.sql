/*
  Warnings:

  - You are about to drop the column `isDisabled` on the `user_promocodes` table. All the data in the column will be lost.
  - You are about to drop the column `isUsed` on the `user_promocodes` table. All the data in the column will be lost.
  - Added the required column `disabele_data` to the `user_promocodes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user_promocodes" DROP COLUMN "isDisabled",
DROP COLUMN "isUsed",
ADD COLUMN     "disabele_data" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "is_disabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_used" BOOLEAN NOT NULL DEFAULT false;
