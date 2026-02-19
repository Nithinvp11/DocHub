import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { z } from 'zod';
import {
  ALL_WORKSPACE_PERMISSIONS,
  WORKSPACE_PERMISSION,
} from '@/lib/workspace-permission-definitions';
import { assertPermission, WorkspacePermissionError } from '@/lib/workspace-permissions';

const transferOwnershipSchema = z.object({
  newOwnerId: z.string().min(1, 'New owner ID is required'),
});

// POST transfer workspace ownership
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { newOwnerId } = transferOwnershipSchema.parse(body);

    await assertPermission(user.id, id, WORKSPACE_PERMISSION.WORKSPACE_EDIT);

    // Get workspace with membership details
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
          where: { userId: newOwnerId },
          select: {
            id: true,
            userId: true,
            permissions: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Validate: Only current owner can transfer ownership
    if (workspace.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Only the workspace owner can transfer ownership' },
        { status: 403 }
      );
    }

    // Validate: Cannot transfer to self
    if (newOwnerId === user.id) {
      return NextResponse.json(
        { error: 'You are already the owner of this workspace' },
        { status: 400 }
      );
    }

    // Validate: New owner must be an existing member
    if (workspace.members.length === 0) {
      return NextResponse.json(
        { error: 'The new owner must be a member of the workspace' },
        { status: 400 }
      );
    }

    const newOwnerMembership = workspace.members[0];

    // Get new owner details
    const newOwner = await prisma.user.findUnique({
      where: { id: newOwnerId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!newOwner) {
      return NextResponse.json({ error: 'New owner user not found' }, { status: 404 });
    }

    // Perform the transfer in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update workspace owner
      const updatedWorkspace = await tx.workspace.update({
        where: { id },
        data: { ownerId: newOwnerId },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      // Remove the new owner from members list (owner is not a member)
      await tx.workspaceMember.delete({
        where: { id: newOwnerMembership.id },
      });

      // Add or update the old owner as a member with full permissions
      await tx.workspaceMember.upsert({
        where: {
          workspaceId_userId: {
            workspaceId: id,
            userId: user.id,
          },
        },
        update: {
          permissions: ALL_WORKSPACE_PERMISSIONS,
        },
        create: {
          workspaceId: id,
          userId: user.id,
          permissions: ALL_WORKSPACE_PERMISSIONS,
        },
      });

      // Log the activity
      await tx.activity.create({
        data: {
          type: 'OWNERSHIP_TRANSFERRED',
          actorId: user.id,
          workspaceId: id,
          entityType: 'workspace',
          entityId: id,
          metadata: {
            previousOwnerId: user.id,
            previousOwnerName: workspace.owner.name,
            previousOwnerEmail: workspace.owner.email,
            newOwnerId: newOwnerId,
            newOwnerName: newOwner.name,
            newOwnerEmail: newOwner.email,
            transferredAt: new Date().toISOString(),
          },
        },
      });

      // Send notification to the new owner
      await tx.notification.create({
        data: {
          userId: newOwnerId,
          type: 'DOCUMENT_SHARED', // Reusing this type as it's the closest match
          title: 'Workspace Ownership Transferred',
          message: `You are now the owner of "${workspace.name}". ${workspace.owner.name} has transferred ownership to you.`,
          link: `/dashboard/${id}`,
        },
      });

      // Send notification to the old owner (confirmation)
      await tx.notification.create({
        data: {
          userId: user.id,
          type: 'DOCUMENT_SHARED',
          title: 'Workspace Ownership Transferred',
          message: `You have successfully transferred ownership of "${workspace.name}" to ${newOwner.name}.`,
          link: `/dashboard/${id}`,
        },
      });

      return updatedWorkspace;
    });

    return NextResponse.json({
      success: true,
      workspace: result,
      message: `Ownership of "${workspace.name}" has been transferred to ${newOwner.name}`,
    });
  } catch (error) {
    if (error instanceof WorkspacePermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    console.error('Error transferring workspace ownership:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
