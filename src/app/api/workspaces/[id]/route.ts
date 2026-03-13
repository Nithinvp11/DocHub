import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityTracker } from '@/lib/activity';
import { getCurrentUser } from '@/lib/session';
import { z } from 'zod';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

const workspaceUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
});

// GET workspace by ID
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await assertPermission(user.id, id, WORKSPACE_PERMISSION.WORKSPACE_VIEW);

    const workspace = await prisma.workspace.findFirst({
      where: {
        id,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        documents: {
          orderBy: {
            updatedAt: 'desc',
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            _count: {
              select: {
                versions: true,
                comments: true,
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    return NextResponse.json(workspace);
  } catch (error) {
    console.error('Error fetching workspace:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH update workspace
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await assertPermission(user.id, id, WORKSPACE_PERMISSION.WORKSPACE_EDIT);

    const body = await req.json();
    const data = workspaceUpdateSchema.parse(body);

    const workspace = await prisma.workspace.update({
      where: { id },
      data,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(workspace);
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    console.error('Error updating workspace:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE workspace
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await assertPermission(user.id, id, WORKSPACE_PERMISSION.WORKSPACE_EDIT);

    const { searchParams } = new URL(req.url);
    const confirmRemoveMembers = searchParams.get('confirmRemoveMembers') === 'true';

    // Check if user is owner and get workspace details
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            documents: true,
            members: true,
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    if (workspace.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Only workspace owner can delete the workspace' },
        { status: 403 }
      );
    }

    // Safety check: Warn if there are other members
    if (workspace._count.members > 0 && !confirmRemoveMembers) {
      return NextResponse.json(
        {
          error: 'Workspace has other members',
          message: `This workspace has ${workspace._count.members} member(s). Deleting it will remove all members and ${workspace._count.documents} document(s). Add ?confirmRemoveMembers=true to proceed.`,
          membersCount: workspace._count.members,
          documentsCount: workspace._count.documents,
          requiresConfirmation: true,
        },
        { status: 400 }
      );
    }

    // Delete workspace (cascade will handle related data)
    await prisma.$transaction(async (tx) => {
      // Log the deletion activity before deleting the workspace
      await ActivityTracker.createWithClient(tx, {
        type: 'WORKSPACE_DELETED',
        actorId: user.id,
        workspaceId: id,
        entityType: 'workspace',
        entityId: id,
        metadata: {
          workspaceName: workspace.name,
          documentsCount: workspace._count.documents,
          membersCount: workspace._count.members,
          deletedAt: new Date().toISOString(),
        },
      });

      // Send notifications to all members (except owner)
      const memberNotifications = workspace.members.map((member) =>
        tx.notification.create({
          data: {
            userId: member.userId,
            type: 'DOCUMENT_SHARED', // Reusing closest type
            title: 'Workspace Deleted',
            message: `The workspace "${workspace.name}" has been deleted by ${user.name || user.email}`,
            link: `/dashboard`,
          },
        })
      );

      await Promise.all(memberNotifications);

      // Delete the workspace (cascade will delete all related data)
      await tx.workspace.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Workspace "${workspace.name}" has been deleted successfully`,
    });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error deleting workspace:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
