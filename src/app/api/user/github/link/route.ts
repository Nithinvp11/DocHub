import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

// DELETE /api/user/github/link - Unlink GitHub account
export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update user to unlink GitHub
    await prisma.user.update({
      where: { id: user.id },
      data: {
        githubLinked: false,
        githubUserId: null,
        githubUsername: null,
        githubAvatarUrl: null,
        githubProfileUrl: null,
        githubEmail: null,
        githubTokenScopes: [],
        githubTokenExpiresAt: null,
      },
    });

    // Delete all GitHubAuth records for this user
    await prisma.gitHubAuth.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      message: 'GitHub account unlinked successfully',
    });
  } catch (error) {
    console.error('Error unlinking GitHub account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
