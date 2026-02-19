-- Add delegation tree tracking fields
ALTER TABLE "WorkspaceMember"
ADD COLUMN "grantedById" TEXT,
ADD COLUMN "grantRootId" TEXT,
ADD COLUMN "grantDepth" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "WorkspaceInvite"
ADD COLUMN "grantRootId" TEXT;

-- Indexes for delegation traversal and lookups
CREATE INDEX "WorkspaceMember_grantedById_idx" ON "WorkspaceMember"("grantedById");
CREATE INDEX "WorkspaceMember_grantRootId_idx" ON "WorkspaceMember"("grantRootId");
CREATE INDEX "WorkspaceInvite_grantRootId_idx" ON "WorkspaceInvite"("grantRootId");