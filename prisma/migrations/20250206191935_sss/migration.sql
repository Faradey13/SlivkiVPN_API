-- AlterTable
ALTER TABLE "subscription" ALTER COLUMN "subscription_start" DROP NOT NULL,
ALTER COLUMN "subscription_end" DROP NOT NULL;
