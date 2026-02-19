import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { AuroraBackground } from '@/components/ui/aurora-background';
import dynamic from 'next/dynamic';
import { ArrowLeft, Clock, User, MessageSquare, Settings, FileText } from 'lucide-react';
import {
  ALL_WORKSPACE_PERMISSIONS,
  WORKSPACE_PERMISSION,
} from '@/lib/workspace-permission-definitions';

// Lazy load heavy components (code splitting for better performance)
const DocumentEditor = dynamic(
  () => import('@/components/document-editor').then((mod) => ({ default: mod.DocumentEditor })),
  {
    loading: () => <div className="h-96 animate-pulse rounded bg-gray-100" />,
  }
);

const CommentsDialog = dynamic(() =>
  import('@/components/comments-dialog').then((mod) => ({ default: mod.CommentsDialog }))
);

const DocumentActions = dynamic(() =>
  import('@/components/DocumentActions').then((mod) => ({ default: mod.DocumentActions }))
);

const VersionHistory = dynamic(() =>
  import('@/components/VersionHistory').then((mod) => ({ default: mod.VersionHistory }))
);

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string; documentId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/auth');
  }

  const { id: workspaceId, documentId } = await params;

  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      workspaceId,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
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
      versions: {
        take: 10,
        orderBy: {
          version: 'desc',
        },
        select: {
          id: true,
          version: true,
          content: true,
          diff: true,
          message: true,
          sha: true,
          label: true,
          isAutoSave: true,
          isDraft: true,
          createdAt: true,
          authorId: true,
          author: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      comments: {
        where: {
          resolved: false,
        },
        include: {
          author: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!document) {
    redirect(`/dashboard/${workspaceId}`);
  }

  // Check if user has access (is workspace owner or member)
  const isOwner = document.workspace.ownerId === session.user.id;
  const member = document.workspace.members[0];

  if (!isOwner && !member) {
    redirect(`/dashboard/${workspaceId}`);
  }

  const canEdit = isOwner || member?.permissions.includes(WORKSPACE_PERMISSION.DOCUMENTS_EDIT);

  // Use permissions from database (owners have all permissions)
  const userPermissions = isOwner
    ? ALL_WORKSPACE_PERMISSIONS
    : member?.permissions || [WORKSPACE_PERMISSION.DOCUMENTS_VIEW];

  return (
    <AuroraBackground showGrids showGlowOrbs>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95">
        <div className="mx-auto max-w-[1600px] px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href={`/dashboard/${workspaceId}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-white hover:bg-white/10 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Workspace
                </Button>
              </Link>
              <div className="h-6 w-px bg-white/10" />
              <div>
                <h1 className="text-lg font-semibold text-white">{document.title}</h1>
                <p className="text-xs text-slate-400">{document.path}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CommentsDialog documentId={documentId} />
              <DocumentActions
                documentId={documentId}
                documentTitle={document.title}
                workspaceId={workspaceId}
              />
              <div className="h-6 w-px bg-white/10" />
              <span className="truncate text-sm text-slate-300">
                {session.user.name || session.user.email}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10">
        <div className="mx-auto max-w-[1600px] px-10 py-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            {/* Document Editor */}
            <div className="min-w-0">
              <DocumentEditor
                document={document}
                canEdit={canEdit}
                workspaceId={workspaceId}
                session={session}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Document Info */}
              <GlassCard className="p-6" hover={false}>
                <div className="mb-4">
                  <div className="mb-1 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-400" />
                    <h3 className="text-base font-bold text-white">Document Info</h3>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="group flex items-center gap-3 rounded-lg border border-white/10 bg-slate-900/40 p-3 transition-all hover:border-purple-500/30 hover:bg-slate-900/60">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 shadow-sm">
                      <User className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-slate-400">Author</div>
                      <div className="truncate text-sm font-semibold text-white">
                        {document.author.name || document.author.email}
                      </div>
                    </div>
                  </div>
                  <div className="group flex items-center gap-3 rounded-lg border border-white/10 bg-slate-900/40 p-3 transition-all hover:border-purple-500/30 hover:bg-slate-900/60">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 shadow-sm">
                      <Clock className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-slate-400">Last Updated</div>
                      <div className="text-sm font-semibold text-white">
                        {new Date(document.updatedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-900/40 p-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
                      <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-slate-400">Comments</div>
                      <div className="text-sm font-medium text-white">
                        {document.comments.length} active
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Version History */}
              <GlassCard className="p-4" hover={false}>
                <VersionHistory
                  versions={document.versions.map((v) => ({
                    ...v,
                    createdAt: v.createdAt.toISOString(),
                  }))}
                  documentId={document.id}
                  currentContent={document.content}
                />
              </GlassCard>
            </div>
          </div>
        </div>
      </main>
    </AuroraBackground>
  );
}
