/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `Document` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Document_deletedAt_idx";

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "deletedAt";
