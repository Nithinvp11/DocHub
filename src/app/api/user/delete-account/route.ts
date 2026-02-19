import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { existsSync } from 'fs';
import { join } from 'path';
import { unlink, readdir, rmdir } from 'fs/promises';

/**
 * Recursively delete a directory and all its contents
 */
async function deleteDirectory(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) return;

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = join(dirPath, entry.name);
        if (entry.isDirectory()) {
          await deleteDirectory(fullPath);
        } else {
          await unlink(fullPath);
        }
      })
    );

    await rmdir(dirPath);
    console.log(`[Delete Account] Deleted directory: ${dirPath}`);
  } catch (error) {
    console.error(`[Delete Account] Error deleting directory ${dirPath}:`, error);
  }
}

/**
 * DELETE /api/user/delete-account
 * Permanently delete user account and all associated data
 *
 * This includes:
 * - User profile and authentication data
 * - Owned workspaces (and all their documents, versions, etc.)
 * - Workspace memberships
 * - Documents authored by user
 * - Comments, activities, notifications
 * - GitHub tokens and integrations
 * - Uploaded files from disk
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { password } = body;

    console.log(`[Delete Account] Starting account deletion for user: ${session.user.id}`);

    // Get user with all necessary data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        password: true,
        ownedWorkspaces: {
          select: { id: true, name: true },
        },
        uploadedImages: {
          select: { filename: true, workspaceId: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify password if user has password auth
    if (user.password && password) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }
    } else if (user.password && !password) {
      return NextResponse.json({ error: 'Password required for verification' }, { status: 400 });
    }

    // Step 1: Delete all uploaded images from disk
    console.log(`[Delete Account] Deleting ${user.uploadedImages.length} uploaded images...`);
    const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'images');
    for (const image of user.uploadedImages) {
      const filepath = join(UPLOAD_DIR, image.filename);
      if (existsSync(filepath)) {
        try {
          await unlink(filepath);
          console.log(`[Delete Account] Deleted image: ${image.filename}`);
        } catch (error) {
          console.error(`[Delete Account] Failed to delete image ${image.filename}:`, error);
        }
      }
    }

    // Step 2: Delete workspace-specific uploads for owned workspaces
    for (const workspace of user.ownedWorkspaces) {
      const workspaceUploadDir = join(
        process.cwd(),
        'public',
        'uploads',
        'workspaces',
        workspace.id
      );
      if (existsSync(workspaceUploadDir)) {
        await deleteDirectory(workspaceUploadDir);
      }
    }

    // Step 3: Delete user avatar/profile images
    const userUploadDir = join(process.cwd(), 'public', 'uploads', 'users', session.user.id);
    if (existsSync(userUploadDir)) {
      await deleteDirectory(userUploadDir);
    }

    // Step 4: Delete database records in proper order
    console.log('[Delete Account] Deleting database records...');

    // Delete owned workspaces (cascade will handle most relations)
    if (user.ownedWorkspaces.length > 0) {
      console.log(`[Delete Account] Deleting ${user.ownedWorkspaces.length} owned workspaces...`);
      await prisma.workspace.deleteMany({
        where: { ownerId: session.user.id },
      });
    }

    // Delete workspace memberships (for workspaces user doesn't own)
    await prisma.workspaceMember.deleteMany({
      where: { userId: session.user.id },
    });
    console.log('[Delete Account] Deleted workspace memberships');

    // Delete GitHub tokens and integrations
    await prisma.gitHubAuth.deleteMany({
      where: { userId: session.user.id },
    });
    console.log('[Delete Account] Deleted GitHub tokens');

    // Delete notification preferences
    await prisma.notificationPreferences.deleteMany({
      where: { userId: session.user.id },
    });
    console.log('[Delete Account] Deleted notification preferences');

    // Delete mentions
    await prisma.mention.deleteMany({
      where: { userId: session.user.id },
    });
    console.log('[Delete Account] Deleted mentions');

    // Delete favorites
    await prisma.userFavorite.deleteMany({
      where: { userId: session.user.id },
    });
    console.log('[Delete Account] Deleted favorites');

    // Delete recent documents
    await prisma.recentDocument.deleteMany({
      where: { userId: session.user.id },
    });
    console.log('[Delete Account] Deleted recent documents');

    // Delete presence records
    await prisma.presence.deleteMany({
      where: { userId: session.user.id },
    });
    console.log('[Delete Account] Deleted presence records');

    // Delete document locks
    await prisma.documentLock.deleteMany({
      where: { userId: session.user.id },
    });
    console.log('[Delete Account] Deleted document locks');

    // Delete feedback
    await prisma.feedback.deleteMany({
      where: {
        OR: [{ userId: session.user.id }, { assignedTo: session.user.id }],
      },
    });
    console.log('[Delete Account] Deleted feedback');

    // Step 5: Finally delete the user (cascade will handle remaining relations)
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    console.log(`[Delete Account] Successfully deleted account for user: ${session.user.id}`);

    return NextResponse.json({
      message: 'Account deleted successfully',
      deleted: {
        user: true,
        workspaces: user.ownedWorkspaces.length,
        uploadedImages: user.uploadedImages.length,
      },
    });
  } catch (error) {
    console.error('[Delete Account] Error deleting account:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete account',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
