-- Migration: Remove Role-Based Access Control, Add Capability-Based System
-- This migration transforms the access control system from roles to explicit permissions

-- Step 1: Add ownerId column to Workspace (nullable at first to handle existing data)
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;

-- Step 2: For each workspace, set the ownerId to the user who has the OWNER role
-- If no OWNER exists, use the first ADMIN, then the first member
UPDATE "Workspace" w
SET "ownerId" = COALESCE(
  (
    SELECT wm."userId"
    FROM "WorkspaceMember" wm
    WHERE wm."workspaceId" = w.id
      AND wm.role = 'OWNER'
    LIMIT 1
  ),
  (
    SELECT wm."userId"
    FROM "WorkspaceMember" wm
    WHERE wm."workspaceId" = w.id
      AND wm.role = 'ADMIN'
    LIMIT 1
  ),
  (
    SELECT wm."userId"
    FROM "WorkspaceMember" wm
    WHERE wm."workspaceId" = w.id
    ORDER BY wm."createdAt" ASC
    LIMIT 1
  )
)
WHERE w."ownerId" IS NULL;

-- Step 3: Make ownerId required (NOT NULL)
ALTER TABLE "Workspace" ALTER COLUMN "ownerId" SET NOT NULL;

-- Step 4: Add foreign key constraint for ownerId (drop if exists first)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Workspace_ownerId_fkey'
  ) THEN
    ALTER TABLE "Workspace" DROP CONSTRAINT "Workspace_ownerId_fkey";
  END IF;
END $$;

ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_ownerId_fkey" 
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 5: Create index on ownerId for performance (drop if exists first)
DROP INDEX IF EXISTS "Workspace_ownerId_idx";
CREATE INDEX "Workspace_ownerId_idx" ON "Workspace"("ownerId");

-- Step 6: Update WorkspaceMember permissions based on existing roles
-- Only if the role column still exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'WorkspaceMember' AND column_name = 'role'
  ) THEN
    -- OWNER → All permissions (but will be removed from members)
    -- ADMIN → All permissions
    -- EDITOR → View, edit, version, comment permissions
    -- VIEWER → View only
    
    UPDATE "WorkspaceMember"
    SET permissions = ARRAY[
      'view_documents',
      'edit_documents',
      'delete_documents',
      'manage_versions',
      'manage_comments',
      'manage_members',
      'github_sync'
    ]::text[]
    WHERE role IN ('OWNER', 'ADMIN');

    UPDATE "WorkspaceMember"
    SET permissions = ARRAY[
      'view_documents',
      'edit_documents',
      'manage_versions',
      'manage_comments'
    ]::text[]
    WHERE role = 'EDITOR';

    UPDATE "WorkspaceMember"
    SET permissions = ARRAY['view_documents']::text[]
    WHERE role = 'VIEWER';

    -- Step 7: Delete workspace owner from WorkspaceMember table
    -- Owner is now a workspace property, not a member
    DELETE FROM "WorkspaceMember" wm
    WHERE EXISTS (
      SELECT 1
      FROM "Workspace" w
      WHERE w.id = wm."workspaceId"
        AND w."ownerId" = wm."userId"
    );

    -- Step 8: Drop the role column from WorkspaceMember
    ALTER TABLE "WorkspaceMember" DROP COLUMN role;
  END IF;
END $$;

-- Step 9: Drop the Role enum type (if exists)
DROP TYPE IF EXISTS "Role";

-- Step 10: Add index on permissions for query performance (drop if exists first)
DROP INDEX IF EXISTS "WorkspaceMember_permissions_idx";
CREATE INDEX "WorkspaceMember_permissions_idx" ON "WorkspaceMember"("permissions");
