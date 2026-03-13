import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Suspense } from 'react';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { NotificationBell } from '@/components/NotificationBell';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import { FileText } from 'lucide-react';
import { PAGINATION_LIMITS } from '@/lib/constants';
import { DashboardClient, DashboardSkeleton } from '@/components/DashboardClient';
import { DashboardHeader } from '@/components/DashboardHeader';

export default async function DashboardPage() {
  const session = await requireAuth();

  const workspaces = await prisma.workspace.findMany({
    where: {
      OR: [
        // User is the owner
        { ownerId: session.user.id },
        // User is a member
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
      // Include GitHub integration & repo sync info so UI can reflect real status
      githubIntegration: {
        select: {
          repository: true,
          connectedAt: true,
        },
      },
      githubRepos: {
        select: {
          lastSyncedAt: true,
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
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: PAGINATION_LIMITS.WORKSPACES_PER_PAGE,
  });

  // Get recent activity performed by this user across current and past workspaces (last 30 days)
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

  const recentActivity = await prisma.activity.findMany({
    where: {
      actorId: session.user.id,
      createdAt: {
        gte: oneMonthAgo,
      },
    },
    select: {
      id: true,
      type: true,
      entityType: true,
      entityId: true,
      createdAt: true,
      metadata: true,
      workspaceId: true,
      workspaceName: true,
      actorName: true,
      actorEmail: true,
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  });

  return (
    <AuroraBackground showGrids showGlowOrbs>
      {/* Premium Glassmorphic Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/60 shadow-lg shadow-purple-500/5 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between px-8 py-4">
          <Link
            href="/dashboard"
            className="group flex items-center gap-3 transition-all hover:scale-[1.02]"
          >
            <div className="rounded-xl bg-linear-to-br from-purple-600 to-fuchsia-600 p-2.5 shadow-xl shadow-purple-500/30 transition-shadow group-hover:shadow-purple-500/50">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="hidden md:block">
              <h1 className="bg-linear-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
                DocHub
              </h1>
              <p className="text-xs text-slate-500">Your workspace dashboard</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <ProfileDropdown user={session.user} />
          </div>
        </div>
      </nav>

      <main className="relative mx-auto max-w-[1800px] px-6 py-10 md:px-8 lg:px-12">
        <DashboardHeader
          workspacesCount={workspaces.length}
          documentsCount={workspaces.reduce((sum, ws) => sum + ws._count.documents, 0)}
          recentUpdatesCount={recentActivity.length}
        />

        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardClient
            workspaces={workspaces}
            recentActivity={recentActivity}
            userId={session.user.id}
          />
        </Suspense>
      </main>
    </AuroraBackground>
  );
}
