import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const searchSchema = z.object({
  q: z.string().min(1),
  workspaceId: z.string().optional(),
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

    // If specific email or id is provided, do a direct lookup
    if (email || username || id) {
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

      return NextResponse.json(foundUser);
    }

    const params = searchSchema.parse({
      q: searchParams.get('q'),
      workspaceId: searchParams.get('workspaceId'),
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

    // If workspace specified, only search workspace members
    let users;
    if (params.workspaceId) {
      // Verify user has access to workspace
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: params.workspaceId,
            userId: currentUser.id,
          },
        },
      });

      if (!membership) {
        return NextResponse.json({ error: 'Access denied to workspace' }, { status: 403 });
      }

      // Search workspace members
      const members = await prisma.workspaceMember.findMany({
        where: {
          workspaceId: params.workspaceId,
          user: searchFilter,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        take: params.limit,
      });

      users = members.map((m) => m.user);
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
