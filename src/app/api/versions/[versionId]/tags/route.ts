import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

// GET all tags for a version
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { versionId } = await params;

    const version = await prisma.version.findUnique({
      where: { id: versionId },
      select: { document: { select: { workspaceId: true } } },
    });

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    await assertPermission(
      user.id,
      version.document.workspaceId,
      WORKSPACE_PERMISSION.VERSIONS_VIEW
    );

    const tags = await prisma.versionTag.findMany({
      where: { versionId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(tags);
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error fetching version tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

// POST create a new tag
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { versionId } = await params;
    const { name, color, description } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    // Verify version exists and user has access
    const version = await prisma.version.findUnique({
      where: { id: versionId },
      select: {
        document: {
          select: {
            workspaceId: true,
          },
        },
      },
    });

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    await assertPermission(
      user.id,
      version.document.workspaceId,
      WORKSPACE_PERMISSION.VERSIONS_CREATE
    );

    // Check if tag with same name already exists for this version
    const existing = await prisma.versionTag.findUnique({
      where: {
        versionId_name: {
          versionId,
          name: name.trim(),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A tag with this name already exists for this version' },
        { status: 400 }
      );
    }

    const tag = await prisma.versionTag.create({
      data: {
        versionId,
        name: name.trim(),
        color: color || '#3B82F6',
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error creating version tag:', error);
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}
