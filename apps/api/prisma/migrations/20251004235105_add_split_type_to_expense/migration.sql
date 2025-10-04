-- CreateEnum
CREATE TYPE "ExpenseSplitType" AS ENUM ('EQUAL', 'PERCENTAGE', 'SHARES', 'EXACT');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "splitType" "ExpenseSplitType" NOT NULL DEFAULT 'EQUAL';
