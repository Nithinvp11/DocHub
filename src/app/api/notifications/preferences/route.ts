import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';

import { prisma } from '@/lib/prisma';

// GET /api/notifications/preferences - Get user's notification preferences
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: user.id },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.notificationPreferences.create({
        data: {
          userId: user.id,
        },
      });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications/preferences - Update user's notification preferences
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validate that only allowed fields are being updated
    const allowedFields = [
      'commentMention',
      'documentShared',
      'githubPrReview',
      'githubIssueAssigned',
      'versionConflict',
      'workspaceInvite',
      'emailCommentMention',
      'emailDocumentShared',
      'emailGithubPrReview',
      'emailGithubIssueAssigned',
      'emailVersionConflict',
      'emailWorkspaceInvite',
    ];

    const updates: Record<string, boolean> = {};
    for (const field of Object.keys(body)) {
      if (allowedFields.includes(field) && typeof body[field] === 'boolean') {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const preferences = await prisma.notificationPreferences.upsert({
      where: { userId: user.id },
      update: updates,
      create: {
        userId: user.id,
        ...updates,
      },
    });

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
