import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { ActivityTracker } from '@/lib/activity';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

// GET /api/activity?workspaceId=xxx&limit=50&cursor=xxx&page=1
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const cursor = searchParams.get('cursor') || undefined;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.ACTIVITY_VIEW);

    // Use cursor if provided, otherwise calculate skip from page
    const skip = cursor ? undefined : (page - 1) * limit;
    const activities = await ActivityTracker.getWorkspaceActivity(workspaceId, limit, cursor, skip);

    return NextResponse.json({
      activities,
      nextCursor: activities.length === limit ? activities[activities.length - 1].id : null,
    });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Activity fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}
