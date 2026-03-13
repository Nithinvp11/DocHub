import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GlassCard } from '@/components/ui/glass-card';
import { AuroraBackground } from '@/components/ui/aurora-background';
import dynamic from 'next/dynamic';
import { ArrowLeft, Clock, User, MessageSquare, FileText, Home } from 'lucide-react';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';

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
      favorites: {
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
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

  return (
    <AuroraBackground showGrids showGlowOrbs>
      {/* Navigation */}
      <nav
        data-document-navbar="true"
        className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/60 shadow-lg shadow-purple-500/5 backdrop-blur-2xl"
      >
        <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4 px-6 py-3">
          {/* Left – back + document identity */}
          <div className="flex min-w-0 items-center gap-2">
            <Link href={`/dashboard/${workspaceId}`}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>

            <div className="flex max-w-[280px] min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 shadow-sm">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-purple-600 to-fuchsia-600 shadow-md shadow-purple-500/20">
                <FileText className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{document.title}</p>
                <p className="truncate text-[11px] leading-tight text-slate-400">
                  {document.githubPath ?? document.path}
                </p>
              </div>
            </div>
          </div>

          {/* Right – actions + home + user */}
          <div className="flex shrink-0 items-center gap-2">
            <CommentsDialog documentId={documentId} workspaceId={workspaceId} />
            <DocumentActions
              documentId={documentId}
              documentTitle={document.title}
              workspaceId={workspaceId}
              documentPhase={document.phase}
              documentType={document.type}
            />

            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 p-0 text-slate-200 hover:bg-white/10 hover:text-white"
                aria-label="Go to dashboard home"
              >
                <Home className="h-4 w-4" />
              </Button>
            </Link>

            <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-white/10 bg-linear-to-r from-slate-900/90 to-slate-800/90 px-2.5 py-1.5 shadow-sm shadow-purple-500/5">
              <Avatar className="h-8 w-8 shrink-0 rounded-lg ring-2 ring-purple-500/20">
                <AvatarImage
                  src={session.user.image || undefined}
                  alt={session.user.name || session.user.email || 'User'}
                />
                <AvatarFallback className="rounded-lg bg-linear-to-br from-purple-600 to-fuchsia-600 text-xs font-bold text-white shadow-md shadow-purple-500/25">
                  {(session.user.name || session.user.email || 'U')
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-semibold text-white">
                  {session.user.name || session.user.email}
                </p>
                {session.user.email && (
                  <p className="truncate text-[11px] leading-tight text-slate-400">
                    {session.user.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10">
        <div className="mx-auto max-w-[1800px] px-6 py-8 md:px-8 lg:px-10 lg:py-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
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
            <div
              data-document-sidebar="true"
              className="space-y-5 lg:sticky lg:top-28 lg:self-start"
            >
              {/* Document Info */}
              <GlassCard className="overflow-hidden p-0" hover={false}>
                <div className="border-b border-white/10 bg-linear-to-r from-slate-800/70 to-slate-900/70 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 shadow-sm">
                      <FileText className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Document Info</h3>
                      <p className="text-xs text-slate-400">
                        Quick metadata and collaboration details
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 p-6 text-sm">
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
              <GlassCard className="overflow-hidden p-0" hover={false}>
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
