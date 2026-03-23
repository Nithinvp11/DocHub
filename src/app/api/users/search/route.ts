import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const searchSchema = z.object({
  q: z.string().min(1),
  workspaceId: z.string().optional(),
  includeWorkspaceMembers: z.coerce.boolean().optional().default(false),
  limit: z.coerce.number().min(1).max(50).default(10),
  email: z.string().email().optional(),
  id: z.string().optional(),
});

/**
 * GET /api/users/search
 * Search for users (for @mentions autocomplete and member addition)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const username = searchParams.get('username');
    const id = searchParams.get('id');
    const workspaceId = searchParams.get('workspaceId');
    const includeWorkspaceMembers = searchParams.get('includeWorkspaceMembers') === 'true';

    const getWorkspaceAccessContext = async () => {
      if (!workspaceId) {
        return null;
      }

      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: {
          ownerId: true,
          members: {
            where: {
              userId: currentUser.id,
            },
            select: {
              id: true,
            },
            take: 1,
          },
        },
      });

      if (!workspace) {
        throw new Error('WORKSPACE_NOT_FOUND');
      }

      if (workspace.ownerId !== currentUser.id && workspace.members.length === 0) {
        throw new Error('WORKSPACE_ACCESS_DENIED');
      }

      return workspace;
    };

    const getWorkspaceMembership = async (targetUserId: string) => {
      if (!workspaceId) {
        return null;
      }

      const [workspace, membership] = await Promise.all([
        prisma.workspace.findUnique({
          where: { id: workspaceId },
          select: { ownerId: true },
        }),
        prisma.workspaceMember.findFirst({
          where: {
            workspaceId,
            userId: targetUserId,
          },
          select: { id: true },
        }),
      ]);

      if (!workspace) {
        return null;
      }

      return {
        isWorkspaceOwner: workspace.ownerId === targetUserId,
        isWorkspaceMember: Boolean(membership) || workspace.ownerId === targetUserId,
      };
    };

    // If specific email or id is provided, do a direct lookup
    if (email || username || id) {
      try {
        await getWorkspaceAccessContext();
      } catch (workspaceError) {
        if (workspaceError instanceof Error) {
          if (workspaceError.message === 'WORKSPACE_NOT_FOUND') {
            return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
          }

          if (workspaceError.message === 'WORKSPACE_ACCESS_DENIED') {
            return NextResponse.json({ error: 'Access denied to workspace' }, { status: 403 });
          }
        }
        throw workspaceError;
      }

      const directFilters = [] as Array<Record<string, unknown>>;
      if (email) {
        directFilters.push({ email: { equals: email, mode: 'insensitive' as const } });
      }
      if (username) {
        directFilters.push({ username: { equals: username, mode: 'insensitive' as const } });
      }
      if (id) {
        directFilters.push({ id });
      }

      const foundUser = await prisma.user.findFirst({
        where: {
          OR: directFilters,
          NOT: { id: currentUser.id },
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          username: true,
        },
      });

      if (!foundUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const workspaceMembership = await getWorkspaceMembership(foundUser.id);

      return NextResponse.json({
        ...foundUser,
        label: foundUser.name || foundUser.email,
        ...(workspaceMembership || {
          isWorkspaceOwner: false,
          isWorkspaceMember: false,
        }),
      });
    }

    const params = searchSchema.parse({
      q: searchParams.get('q'),
      workspaceId,
      includeWorkspaceMembers,
      limit: searchParams.get('limit'),
    });

    // Build user search filter (including username and user ID search)
    const searchFilter = {
      OR: [
        { username: { contains: params.q, mode: 'insensitive' as const } },
        { name: { contains: params.q, mode: 'insensitive' as const } },
        { email: { contains: params.q, mode: 'insensitive' as const } },
        { id: params.q }, // Direct ID search for connection feature
      ],
      NOT: {
        id: currentUser.id, // Exclude current user from search
      },
    };

    // If workspace specified, default to excluding existing members so invite flows can surface
    // "already exists" in the UI instead of returning them as valid invite targets.
    let users;
    if (params.workspaceId) {
      let workspace;
      try {
        workspace = await getWorkspaceAccessContext();
      } catch (workspaceError) {
        if (workspaceError instanceof Error) {
          if (workspaceError.message === 'WORKSPACE_NOT_FOUND') {
            return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
          }

          if (workspaceError.message === 'WORKSPACE_ACCESS_DENIED') {
            return NextResponse.json({ error: 'Access denied to workspace' }, { status: 403 });
          }
        }
        throw workspaceError;
      }

      const workspaceMembers = await prisma.workspaceMember.findMany({
        where: { workspaceId: params.workspaceId },
        select: { userId: true },
      });
      const workspaceMemberIds = new Set(workspaceMembers.map((member) => member.userId));

      const baseWhere = {
        ...searchFilter,
        ...(params.includeWorkspaceMembers
          ? {}
          : {
              id: {
                notIn: [workspace!.ownerId, ...Array.from(workspaceMemberIds)],
              },
            }),
      };

      users = await prisma.user.findMany({
        where: {
          ...baseWhere,
        },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          image: true,
        },
        take: params.limit,
      });
    } else {
      // Search all users (for platform-wide mentions)
      users = await prisma.user.findMany({
        where: searchFilter,
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          image: true,
        },
        take: params.limit,
      });
    }

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        name: u.name,
        email: u.email,
        image: u.image,
        label: u.name || u.email,
        isWorkspaceMember: false,
        isWorkspaceOwner: false,
      })),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}
