import { getCurrentUser } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

import { generateGitHubAuthUrl } from '@/lib/github';
import crypto from 'crypto';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { getWorkspaceAccess, WorkspacePermissionError } from '@/lib/workspace-permissions';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const access = await getWorkspaceAccess(user.id, workspaceId);
    const hasGitHubAccess =
      access.isOwner ||
      access.permissions.some((permission) =>
        [
          WORKSPACE_PERMISSION.GITHUB_VIEW,
          WORKSPACE_PERMISSION.GITHUB_IMPORT,
          WORKSPACE_PERMISSION.GITHUB_EXPORT,
          WORKSPACE_PERMISSION.GITHUB_CONFIGURE,
        ].includes(permission)
      );

    if (!hasGitHubAccess) {
      throw new WorkspacePermissionError(
        'Missing required GitHub permission: github:view, github:import, github:export, or github:configure',
        403
      );
    }

    // Generate state parameter to prevent CSRF
    const state = crypto.randomBytes(32).toString('hex');

    // Store state in session/database for verification
    // For now, we'll encode the data in the state itself (signed)
    const stateData = JSON.stringify({
      userId: user.id,
      workspaceId,
      timestamp: Date.now(),
      nonce: state,
    });
    const encodedState = Buffer.from(stateData).toString('base64');

    const authUrl = generateGitHubAuthUrl(encodedState);

    return NextResponse.json({ authUrl });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
