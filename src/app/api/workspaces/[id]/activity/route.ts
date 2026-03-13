import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityTracker } from '@/lib/activity';
import { getCurrentUser } from '@/lib/session';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

// GET workspace activity log with pagination
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const type = searchParams.get('type'); // Optional filter by activity type

    await assertPermission(user.id, id, WORKSPACE_PERMISSION.ACTIVITY_VIEW);

    // Build where clause
    const where: Record<string, unknown> = { workspaceId: id };
    if (type) {
      where.type = type;
    }

    // Get total count
    const totalCount = await prisma.activity.count({ where });

    // Get activities with pagination
    const activities = await prisma.activity.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Format activities with user-friendly descriptions
    const formattedActivities = activities.map((activity) => ({
      ...activity,
      description: formatActivityDescription({
        type: activity.type,
        actor: activity.actor
          ? {
              name: activity.actor.name,
              email: activity.actor.email,
            }
          : undefined,
        actorName: activity.actorName,
        actorEmail: activity.actorEmail,
        metadata: activity.metadata as Record<string, unknown>,
      }),
    }));

    return NextResponse.json({
      activities: formattedActivities,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page < Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error fetching workspace activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to format activity descriptions
function formatActivityDescription(activity: {
  type: string;
  actor?: { name?: string | null; email: string };
  actorName?: string | null;
  actorEmail?: string | null;
  metadata?: Record<string, unknown>;
}): string {
  const actorName = ActivityTracker.getActorLabel(activity);
  const metadata = activity.metadata || {};

  switch (activity.type) {
    case 'DOCUMENT_CREATED':
      return `${actorName} created document "${metadata.title || 'Untitled'}"`;
    case 'DOCUMENT_UPDATED':
      return `${actorName} updated document "${metadata.title || 'Untitled'}"`;
    case 'DOCUMENT_DELETED':
      return `${actorName} deleted document "${metadata.title || 'Untitled'}"`;
    case 'VERSION_CREATED':
      return `${actorName} created version ${metadata.version || ''} of "${metadata.documentTitle || 'a document'}"`;
    case 'MEMBER_ADDED':
      if (metadata.action === 'permissions_updated') {
        return `${actorName} updated permissions for a workspace member`;
      }
      return `${actorName} added ${metadata.userName || metadata.userEmail || 'a member'} to the workspace`;
    case 'MEMBER_REMOVED':
      return `${actorName} removed ${metadata.removedUserName || metadata.removedUserEmail || 'a member'} from the workspace`;
    case 'MEMBER_INVITED':
      return `${actorName} invited ${metadata.invitedUserName || metadata.invitedEmail || 'a user'} to the workspace`;
    case 'INVITE_SENT':
      return `${actorName} invited ${metadata.invitedUserName || metadata.invitedEmail || 'a user'} to the workspace`;
    case 'INVITE_RESENT':
      return `${actorName} resent an invitation to ${metadata.invitedUserName || metadata.invitedEmail || 'a user'}`;
    case 'INVITE_CANCELLED':
      return `${actorName} cancelled an invitation for ${metadata.invitedUserName || metadata.invitedEmail || 'a user'}`;
    case 'INVITE_ACCEPTED':
      return `${actorName} accepted an invitation to join the workspace`;
    case 'INVITE_REJECTED':
      return `${actorName} declined an invitation to join the workspace`;
    case 'OWNERSHIP_TRANSFERRED':
      return `${actorName} transferred workspace ownership to ${metadata.newOwnerName || 'another user'}`;
    case 'WORKSPACE_CREATED':
      return `${actorName} created the workspace`;
    case 'WORKSPACE_DELETED':
      return `${actorName} deleted the workspace`;
    case 'GITHUB_IMPORT':
      return `${actorName} imported ${metadata.filesImported || 0} file(s) from "${metadata.repoName || metadata.repository || 'a repository'}"`;
    case 'GITHUB_EXPORT':
      return `${actorName} exported ${metadata.filesExported || 0} file(s) to "${metadata.repoName || metadata.repository || 'a repository'}"`;
    case 'GITHUB_SYNC_SUCCESS':
      return `${actorName} successfully synced document "${metadata.documentTitle || 'a document'}" with GitHub`;
    case 'GITHUB_SYNC_FAILED':
      return `GitHub sync failed for document "${metadata.documentTitle || 'a document'}"`;
    case 'GITHUB_REPO_CONNECTED':
      return `${actorName} connected GitHub repository "${metadata.repository || 'a repository'}"`;
    case 'GITHUB_REPO_DISCONNECTED':
      return `${actorName} disconnected GitHub repository "${metadata.repository || 'a repository'}"`;
    case 'GITHUB_PULL_REQUEST_CREATED':
      return `${actorName} created pull request #${metadata.prNumber || ''} in "${metadata.repository || 'a repository'}"`;
    case 'GITHUB_CONFLICT_DETECTED':
      return `Merge conflict detected in "${metadata.documentTitle || 'a document'}"`;
    case 'DOCUMENT_LINKED':
      return `${actorName} linked documents`;
    case 'DOCUMENT_MENTIONED':
      return `${actorName} mentioned a document`;
    case 'DOCUMENT_STATUS_CHANGED':
      return `${actorName} changed document status from ${metadata.from || ''} to ${metadata.to || ''}`;
    case 'TAG_ADDED':
      return `${actorName} added tag "${metadata.tagName || ''}"`;
    case 'TAG_REMOVED':
      return `${actorName} removed tag "${metadata.tagName || ''}"`;
    case 'PASSWORD_CHANGED':
      return `${actorName} changed their password`;
    case 'ACCOUNT_DELETED':
      return `${actorName} deleted their account`;
    default:
      return `${actorName} performed an action (${activity.type})`;
  }
}
