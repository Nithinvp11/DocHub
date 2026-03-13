-- CreateTable
CREATE TABLE "WorkspaceFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkspaceFavorite_userId_idx" ON "WorkspaceFavorite"("userId");

-- CreateIndex
CREATE INDEX "WorkspaceFavorite_workspaceId_idx" ON "WorkspaceFavorite"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceFavorite_userId_workspaceId_key" ON "WorkspaceFavorite"("userId", "workspaceId");

-- AddForeignKey
ALTER TABLE "WorkspaceFavorite" ADD CONSTRAINT "WorkspaceFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceFavorite" ADD CONSTRAINT "WorkspaceFavorite_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
