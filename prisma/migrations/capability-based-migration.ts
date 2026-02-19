/**
 * Migration Script: Role-Based to Capability-Based Access Control
 *
 * This script migrates from the old role-based system (OWNER, ADMIN, EDITOR, VIEWER)
 * to the new capability-based system with explicit permissions.
 *
 * Changes:
 * 1. Adds ownerId field to Workspace model
 * 2. Removes role field from WorkspaceMember model
 * 3. Converts existing roles to explicit permission arrays
 * 4. Removes workspace owner from members (owner is separate now)
 *
 * Run with: npx ts-node prisma/migrations/capability-based-migration.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Type for old WorkspaceMember with role field (before migration)
type OldWorkspaceMember = {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
};

// Role to permissions mapping
const roleToPermissions: Record<string, string[]> = {
  OWNER: [
    'view_documents',
    'edit_documents',
    'delete_documents',
    'manage_versions',
    'manage_comments',
    'manage_members',
    'github_sync',
  ],
  ADMIN: [
    'view_documents',
    'edit_documents',
    'delete_documents',
    'manage_versions',
    'manage_comments',
    'manage_members',
    'github_sync',
  ],
  EDITOR: ['view_documents', 'edit_documents', 'manage_versions', 'manage_comments'],
  VIEWER: ['view_documents'],
};

async function migrate() {
  console.log('🚀 Starting migration from role-based to capability-based access control...\n');

  try {
    // Step 1: Get all workspaces
    const workspaces = await prisma.workspace.findMany({
      include: {
        members: true,
      },
    });

    console.log(`📋 Found ${workspaces.length} workspaces to migrate\n`);

    let updatedWorkspaces = 0;
    let updatedMembers = 0;
    let removedOwnerMembers = 0;

    for (const workspace of workspaces) {
      console.log(`\n🏢 Processing workspace: ${workspace.name} (${workspace.id})`);

      // Find the owner member
      const ownerMember = workspace.members.find(
        (m) => (m as unknown as OldWorkspaceMember).role === 'OWNER'
      ) as unknown as OldWorkspaceMember | undefined;

      if (!ownerMember) {
        console.warn(`  ⚠️  No OWNER found for workspace ${workspace.name}, skipping...`);
        continue;
      }

      // Step 2: Set workspace ownerId (but schema needs to support it first)
      // This is handled by Prisma migration - we'll update members only
      console.log(`  👤 Owner: ${ownerMember.userId}`);

      // Step 3: Update all non-owner members with permissions based on their roles
      for (const member of workspace.members) {
        if (member.userId === ownerMember.userId) {
          // Step 4: Remove owner from members (owner is workspace property now)
          await prisma.workspaceMember.delete({
            where: { id: member.id },
          });
          console.log(`  🗑️  Removed owner from members list`);
          removedOwnerMembers++;
        } else {
          // Convert role to permissions
          const oldMember = member as unknown as OldWorkspaceMember;
          const permissions = roleToPermissions[oldMember.role] || roleToPermissions.VIEWER;

          await prisma.workspaceMember.update({
            where: { id: member.id },
            data: {
              permissions,
            },
          });
          console.log(
            `  ✅ Updated member ${member.userId}: ${oldMember.role} → ${permissions.length} permissions`
          );
          updatedMembers++;
        }
      }

      updatedWorkspaces++;
    }

    console.log('\n\n✨ Migration completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`  - Workspaces processed: ${updatedWorkspaces}`);
    console.log(`  - Members updated: ${updatedMembers}`);
    console.log(`  - Owner memberships removed: ${removedOwnerMembers}`);
    console.log(`\n⚠️  IMPORTANT: Run 'npx prisma generate' to regenerate Prisma client`);
    console.log(
      `⚠️  IMPORTANT: Run 'npx prisma db push' or create a Prisma migration for schema changes`
    );
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrate().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
