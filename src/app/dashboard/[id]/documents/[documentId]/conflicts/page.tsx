import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ConflictResolutionClient } from './ConflictResolutionClient';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';

export default async function ConflictResolutionPage({
  params,
}: {
  params: Promise<{ id: string; documentId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/auth');
  }

  const { id: workspaceId, documentId } = await params;

  // Fetch document and conflicts
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      workspaceId,
    },
    include: {
      versions: {
        orderBy: { version: 'desc' },
        take: 1,
        select: { version: true },
      },
      workspace: {
        select: {
          id: true,
          name: true,
          ownerId: true,
          members: {
            where: {
              userId: session.user.id,
            },
            select: {
              permissions: true,
            },
          },
        },
      },
    },
  });

  if (!document) {
    redirect(`/dashboard/${workspaceId}`);
  }

  // Check permissions
  const isOwner = document.workspace.ownerId === session.user.id;
  const member = document.workspace.members[0];

  if (!isOwner && !member) {
    redirect(`/dashboard/${workspaceId}`);
  }

  const canEdit = isOwner || member?.permissions.includes(WORKSPACE_PERMISSION.DOCUMENTS_EDIT);

  if (!canEdit) {
    redirect(`/dashboard/${workspaceId}/documents/${documentId}`);
  }

  // Fetch pending conflicts
  const conflicts = await prisma.conflictResolution.findMany({
    where: {
      documentId,
      status: 'pending',
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (conflicts.length === 0) {
    redirect(`/dashboard/${workspaceId}/documents/${documentId}`);
  }

  const conflict = conflicts[0]; // Get the most recent conflict

  return (
    <ConflictResolutionClient
      workspaceId={workspaceId}
      documentId={documentId}
      documentTitle={document.title}
      conflict={{
        id: conflict.id,
        platformContent: conflict.localContent,
        githubContent: conflict.remoteContent,
        platformVersion: document.versions[0]?.version || 1,
        githubCommitSha: conflict.remoteSha,
        lastSyncedAt: conflict.createdAt,
      }}
    />
  );
}
