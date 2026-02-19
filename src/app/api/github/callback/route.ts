import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exchangeCodeForToken, getAuthenticatedUser } from '@/lib/github';
import { encryptToken } from '@/lib/encryption';
import { getCurrentUser } from '@/lib/session';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission } from '@/lib/workspace-permissions';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.redirect(new URL('/dashboard?error=github_auth_failed', req.url));
  }

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.redirect(new URL('/auth?error=unauthorized', req.url));
    }

    // Decode and verify state
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
    const { userId, workspaceId, timestamp } = stateData;

    if (userId !== currentUser.id) {
      return NextResponse.redirect(new URL('/dashboard?error=invalid_state_user', req.url));
    }

    // Check if state is not too old (10 minutes)
    if (Date.now() - timestamp > 10 * 60 * 1000) {
      return NextResponse.redirect(new URL('/dashboard?error=state_expired', req.url));
    }

    await assertPermission(userId, workspaceId, WORKSPACE_PERMISSION.GITHUB_CONFIGURE);

    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(code);
    const { access_token, scope, token_type } = tokenData;

    // Get GitHub user info
    const githubUser = await getAuthenticatedUser(access_token);

    // Store GitHub auth in database (encrypt token)
    await prisma.gitHubAuth.upsert({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
      create: {
        userId,
        workspaceId,
        accessToken: encryptToken(access_token),
        scope,
        tokenType: token_type,
      },
      update: {
        accessToken: encryptToken(access_token),
        scope,
        tokenType: token_type,
        updatedAt: new Date(),
      },
    });

    // Update user's GitHub linked status and image
    await prisma.user.update({
      where: { id: userId },
      data: {
        githubLinked: true,
        image: githubUser.avatar_url,
      },
    });

    // Redirect back to dashboard
    return NextResponse.redirect(
      new URL(`/dashboard/${workspaceId}?success=github_linked`, req.url)
    );
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    return NextResponse.redirect(new URL('/dashboard?error=github_auth_failed', req.url));
  }
}
