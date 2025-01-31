/*
  Warnings:

  - A unique constraint covering the columns `[region_name_eng]` on the table `region` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `region_name_eng` to the `region` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "region" ADD COLUMN     "region_name_eng" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "region_region_name_eng_key" ON "region"("region_name_eng");
