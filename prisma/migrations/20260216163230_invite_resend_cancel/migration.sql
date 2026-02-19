-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityType" ADD VALUE 'INVITE_SENT';
ALTER TYPE "ActivityType" ADD VALUE 'INVITE_RESENT';
ALTER TYPE "ActivityType" ADD VALUE 'INVITE_CANCELLED';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'WORKSPACE_INVITE_CANCELLED';

-- AlterTable
ALTER TABLE "WorkspaceInvite" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "lastResentAt" TIMESTAMP(3),
ADD COLUMN     "resendCount" INTEGER NOT NULL DEFAULT 0;
