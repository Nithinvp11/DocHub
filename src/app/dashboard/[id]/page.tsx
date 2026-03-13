import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { WorkspaceNavbar } from '@/components/workspace/workspace-navbar';
import { CreateDocumentDialog } from '@/components/create-document-dialog';
import { WorkspaceActions } from '@/components/WorkspaceActions';
import { DocumentList } from '@/components/document-list';
import { WorkspaceMembersPanel } from '@/components/workspace-members-panel';
import { WorkspaceGitHubSyncDialog } from '@/components/WorkspaceGitHubSyncDialog';
import { WorkspaceFavoriteToggleButton } from '@/components/WorkspaceFavoriteToggleButton';
import {
  ALL_WORKSPACE_PERMISSIONS,
  WORKSPACE_PERMISSION,
  normalizePermissions,
} from '@/lib/workspace-permission-definitions';

export default async function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/auth');
  }

  const { id } = await params;

  const workspace = await prisma.workspace.findFirst({
    where: {
      id,
      OR: [
        { ownerId: session.user.id },
        {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      ],
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
        select: {
          id: true,
          permissions: true,
          userId: true,
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
      workspaceFavorites: {
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
        },
      },
      documents: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          syncInfo: {
            select: {
              syncStatus: true,
              lastSyncedAt: true,
              autoSync: true,
            },
          },
          favorites: {
            where: {
              userId: session.user.id,
            },
            select: {
              id: true,
            },
          },
          _count: {
            select: {
              versions: true,
              comments: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      },
    },
  });

  if (!workspace) {
    redirect('/dashboard');
  }

  const isOwner = workspace.ownerId === session.user.id;
  const userMember = workspace.members.find((m) => m.userId === session.user.id);

  // Get user permissions
  const userPermissions = isOwner
    ? ALL_WORKSPACE_PERMISSIONS
    : normalizePermissions(userMember?.permissions || []);
  const canEditWorkspace = isOwner || userPermissions.includes(WORKSPACE_PERMISSION.WORKSPACE_EDIT);
  const canCreateDocuments =
    isOwner ||
    userPermissions.includes(WORKSPACE_PERMISSION.DOCUMENTS_CREATE) ||
    userPermissions.includes(WORKSPACE_PERMISSION.DOCUMENTS_EDIT);
  const canViewMembers = isOwner || userPermissions.includes(WORKSPACE_PERMISSION.MEMBERS_VIEW);

  return (
    <AuroraBackground showGrids showGlowOrbs>
      <div className="min-h-screen">
        <WorkspaceNavbar
          workspaceName={workspace.name}
          workspaceDescription={workspace.description}
          userName={session.user.name}
          userEmail={session.user.email || undefined}
          userImage={session.user.image}
        >
          <>
            <WorkspaceFavoriteToggleButton
              workspaceId={workspace.id}
              initialIsFavorite={Boolean(workspace.workspaceFavorites.length)}
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 p-0 text-slate-200 hover:bg-white/10 hover:text-white"
            />
            <WorkspaceActions
              workspaceId={workspace.id}
              workspaceName={workspace.name}
              workspaceDescription={workspace.description || ''}
              isOwner={isOwner}
              canManage={canEditWorkspace}
            />
          </>
        </WorkspaceNavbar>

        {/* Main Content */}
        <main className="mx-auto max-w-[1800px] px-6 py-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* Left - Documents Section */}
            <div className="min-w-0">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Documents</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {workspace.documents.length} document
                    {workspace.documents.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <WorkspaceGitHubSyncDialog workspaceId={workspace.id} />
                  {canCreateDocuments && <CreateDocumentDialog workspaceId={workspace.id} />}
                </div>
              </div>

              <DocumentList
                documents={workspace.documents}
                workspaceId={workspace.id}
                canCreate={canCreateDocuments}
              />

              {canViewMembers && (
                <div className="mt-6 lg:hidden">
                  <WorkspaceMembersPanel
                    workspaceId={workspace.id}
                    userPermissions={userPermissions}
                    initialMembers={workspace.members}
                    workspaceOwner={workspace.owner}
                    isOwner={isOwner}
                  />
                </div>
              )}
            </div>

            {/* Right - Members Panel */}
            {canViewMembers && (
              <div className="hidden lg:block">
                <div className="sticky top-24">
                  <WorkspaceMembersPanel
                    workspaceId={workspace.id}
                    userPermissions={userPermissions}
                    initialMembers={workspace.members}
                    workspaceOwner={workspace.owner}
                    isOwner={isOwner}
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </AuroraBackground>
  );
}
