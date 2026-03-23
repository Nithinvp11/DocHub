import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { decryptToken } from '@/lib/encryption';
import bcrypt from 'bcryptjs';
import { existsSync } from 'fs';
import { join } from 'path';
import { unlink, readdir, rmdir } from 'fs/promises';

function getGitHubOAuthCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.GITHUB_ID || process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  return { clientId, clientSecret };
}

async function revokeGitHubOAuthGrant(accessToken: string): Promise<void> {
  const credentials = getGitHubOAuthCredentials();
  if (!credentials) {
    console.warn('[Delete Account] Skipping GitHub token revocation (OAuth credentials missing)');
    return;
  }

  const basicAuth = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString(
    'base64'
  );

  const response = await fetch(
    `https://api.github.com/applications/${credentials.clientId}/grant`,
    {
      method: 'DELETE',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
        'User-Agent': 'DocHub',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ access_token: accessToken }),
    }
  );

  // 204: revoked, 404/422: already invalid or already revoked
  if (response.status === 204 || response.status === 404 || response.status === 422) {
    return;
  }

  const errorBody = await response.text();
  throw new Error(`GitHub revoke failed (${response.status}): ${errorBody}`);
}

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
 * - Uploaded workspace files from disk
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
        accounts: {
          where: { provider: 'github' },
          select: {
            access_token: true,
          },
        },
        githubAuth: {
          select: {
            accessToken: true,
          },
        },
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

    // Step 2.5: Revoke GitHub OAuth grants before removing local auth records
    const githubTokens = new Set<string>();

    for (const account of user.accounts) {
      if (account.access_token) {
        githubTokens.add(decryptToken(account.access_token));
      }
    }

    for (const auth of user.githubAuth) {
      if (auth.accessToken) {
        githubTokens.add(decryptToken(auth.accessToken));
      }
    }

    if (githubTokens.size > 0) {
      console.log(`[Delete Account] Revoking ${githubTokens.size} GitHub OAuth grant(s)...`);
      const revokeResults = await Promise.allSettled(
        Array.from(githubTokens).map((token) => revokeGitHubOAuthGrant(token))
      );

      const failedRevocations = revokeResults.filter((result) => result.status === 'rejected');
      if (failedRevocations.length > 0) {
        console.warn(
          `[Delete Account] ${failedRevocations.length} GitHub grant revocation(s) failed; continuing account deletion.`
        );
        failedRevocations.forEach((result) => {
          if (result.status === 'rejected') {
            console.warn('[Delete Account] GitHub revoke error:', result.reason);
          }
        });
      } else {
        console.log('[Delete Account] GitHub OAuth grants revoked successfully');
      }
    }

    // Step 3: Delete database records in proper order
    console.log('[Delete Account] Deleting database records...');

    await prisma.$transaction(async (tx) => {
      // Delete owned workspaces first (cascades workspace-scoped data).
      if (user.ownedWorkspaces.length > 0) {
        console.log(`[Delete Account] Deleting ${user.ownedWorkspaces.length} owned workspaces...`);
        await tx.workspace.deleteMany({
          where: { ownerId: session.user.id },
        });
      }

      // Remove documents still authored by this user in non-owned/shared workspaces.
      await tx.document.deleteMany({
        where: { authorId: session.user.id },
      });
      console.log('[Delete Account] Deleted authored documents');

      // Remove remaining records that hold required FK references to user.
      await tx.inlineCommentReply.deleteMany({
        where: { authorId: session.user.id },
      });

      await tx.inlineComment.deleteMany({
        where: {
          OR: [{ authorId: session.user.id }, { resolvedById: session.user.id }],
        },
      });

      await tx.comment.deleteMany({
        where: { authorId: session.user.id },
      });

      await tx.version.deleteMany({
        where: { authorId: session.user.id },
      });

      await tx.documentTemplate.deleteMany({
        where: { authorId: session.user.id },
      });
      console.log('[Delete Account] Deleted authored references (versions/comments/templates)');

      // Cleanup user-linked supporting records.
      await tx.workspaceMember.deleteMany({
        where: { userId: session.user.id },
      });
      console.log('[Delete Account] Deleted workspace memberships');

      await tx.gitHubAuth.deleteMany({
        where: { userId: session.user.id },
      });
      console.log('[Delete Account] Deleted GitHub tokens');

      await tx.notificationPreferences.deleteMany({
        where: { userId: session.user.id },
      });
      console.log('[Delete Account] Deleted notification preferences');

      await tx.mention.deleteMany({
        where: { userId: session.user.id },
      });

      await tx.userFavorite.deleteMany({
        where: { userId: session.user.id },
      });

      await tx.workspaceFavorite.deleteMany({
        where: { userId: session.user.id },
      });

      await tx.recentDocument.deleteMany({
        where: { userId: session.user.id },
      });

      await tx.presence.deleteMany({
        where: { userId: session.user.id },
      });

      await tx.documentLock.deleteMany({
        where: { userId: session.user.id },
      });

      await tx.loginEvent.deleteMany({
        where: { userId: session.user.id },
      });

      await tx.account.deleteMany({
        where: { userId: session.user.id },
      });

      await tx.session.deleteMany({
        where: { userId: session.user.id },
      });

      // Keep others' feedback intact by unassigning this user where needed.
      await tx.feedback.updateMany({
        where: { assignedTo: session.user.id },
        data: { assignedTo: null },
      });

      // Remove feedback submitted by this user.
      await tx.feedback.deleteMany({
        where: { userId: session.user.id },
      });
      console.log('[Delete Account] Deleted user feedback and unassigned admin assignments');

      // Finally delete the user row.
      await tx.user.delete({
        where: { id: session.user.id },
      });
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
