import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/session';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

// Schema for creating/updating tags
const tagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

// GET /api/tags?workspaceId=xxx - Get all tags for a workspace
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    // Check permissions
    await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_VIEW);

    const tags = await prisma.tag.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: { documents: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(tags);
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

// POST /api/tags - Create a new tag
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId, name, color } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    // Validate input
    const validation = tagSchema.safeParse({ name, color });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid tag data', details: validation.error },
        { status: 400 }
      );
    }

    // Check permissions
    await assertPermission(user.id, workspaceId, WORKSPACE_PERMISSION.DOCUMENTS_EDIT);

    // Create tag
    const tag = await prisma.tag.create({
      data: {
        name: validation.data.name,
        color: validation.data.color,
        workspaceId,
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error creating tag:', error);

    // Handle unique constraint violation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'A tag with this name already exists in the workspace' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}
