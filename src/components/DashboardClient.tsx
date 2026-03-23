'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { GlassCard } from '@/components/ui/glass-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { CreateWorkspaceDialog } from '@/components/create-workspace-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Users,
  FileIcon,
  Clock,
  Edit,
  Trash2,
  Download,
  Upload,
  UserPlus,
  UserMinus,
  Search,
  ChevronRight,
  ArrowUpDown,
  ChevronDown,
  Check,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { WorkspaceListSkeleton, ActivityFeedSkeleton } from '@/components/LoadingStates';
import { computeWorkspaceGitHubSyncState } from '@/lib/github-sync-status';
import { NoWorkspaces, NoActivity } from '@/components/EmptyStates';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';
import { WorkspaceFavoriteToggleButton } from '@/components/WorkspaceFavoriteToggleButton';

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  updatedAt: Date;
  owner: {
    id: string;
  };
  _count: {
    documents: number;
    members: number;
  };
  members: {
    permissions: string[];
    userId: string;
  }[];
  workspaceFavorites?: {
    id: string;
  }[];
  // Optional GitHub integration and repo sync metadata
  githubIntegration?: { repository: string; connectedAt?: Date } | null;
  githubRepos?: { lastSyncedAt?: Date | null }[];
}

interface RecentActivityItem {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  createdAt: Date;
  metadata: Record<string, unknown> | null;
  workspaceId: string | null;
  workspaceName: string | null;
  actorName: string | null;
  actorEmail: string | null;
  workspace: {
    id: string;
    name: string;
  } | null;
}

interface DashboardClientProps {
  workspaces: Workspace[];
  recentActivity: RecentActivityItem[];
  userId: string;
}

type SortOption = 'updated-desc' | 'updated-asc' | 'name-asc' | 'name-desc';

const SORT_OPTIONS: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  {
    value: 'updated-desc',
    label: 'Last Updated (Newest)',
    icon: <ArrowDown className="h-3.5 w-3.5" />,
  },
  {
    value: 'updated-asc',
    label: 'Last Updated (Oldest)',
    icon: <ArrowUp className="h-3.5 w-3.5" />,
  },
  { value: 'name-asc', label: 'Name (A–Z)', icon: <ArrowDown className="h-3.5 w-3.5" /> },
  { value: 'name-desc', label: 'Name (Z–A)', icon: <ArrowUp className="h-3.5 w-3.5" /> },
];

export function DashboardClient({ workspaces, recentActivity, userId }: DashboardClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updated-desc');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<RecentActivityItem | null>(null);
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({});

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filter workspaces based on search query
  const filtered = workspaces.filter(
    (workspace) =>
      workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (workspace.description &&
        workspace.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Sort filtered workspaces
  const filteredWorkspaces = [...filtered].sort((a, b) => {
    const aFavorite = favoriteOverrides[a.id] ?? Boolean(a.workspaceFavorites?.length);
    const bFavorite = favoriteOverrides[b.id] ?? Boolean(b.workspaceFavorites?.length);

    if (aFavorite !== bFavorite) {
      return aFavorite ? -1 : 1;
    }

    switch (sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'updated-asc':
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      case 'updated-desc':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  const activeSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Sort';

  // Show only 5 activity items by default, or all if expanded
  const visibleActivity = showAllActivity ? recentActivity : recentActivity.slice(0, 5);

  return (
    <div className="grid gap-10 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {/* Workspaces Section Header with Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-7 space-y-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">Your Workspaces</h2>
              <p className="mt-1.5 text-sm font-medium text-slate-400">
                {filteredWorkspaces.length} workspace{filteredWorkspaces.length !== 1 ? 's' : ''}{' '}
                {searchQuery ? 'found' : 'available'}
              </p>
            </div>
          </div>

          {/* Search + Sort Row */}
          <div className="flex gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors peer-focus:text-purple-400" />
              <input
                type="text"
                placeholder="Search workspaces by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="peer w-full rounded-xl border border-white/10 bg-slate-900/60 py-3.5 pr-4 pl-12 text-sm text-white placeholder-slate-500 shadow-lg backdrop-blur-xl transition-all focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
              />
              {searchQuery && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={() => setSearchQuery('')}
                  className="absolute top-1/2 right-4 -translate-y-1/2 rounded-lg bg-slate-700/50 px-2 py-1 text-xs text-slate-400 hover:bg-slate-600/50 hover:text-white"
                >
                  Clear
                </motion.button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative shrink-0" ref={sortRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-label="Sort workspaces"
                onClick={() => setSortOpen((v) => !v)}
                className="flex h-full items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3.5 text-sm text-white shadow-lg backdrop-blur-xl transition-all hover:border-purple-500/40 hover:bg-slate-800/60 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
              >
                <ArrowUpDown className="h-4 w-4 text-slate-400" />
                <span className="hidden max-w-[140px] truncate text-slate-300 sm:block">
                  {activeSortLabel}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-200 ${
                    sortOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Panel */}
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  role="dialog"
                  aria-label="Sort options"
                  className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/40 backdrop-blur-xl"
                >
                  <div className="border-b border-white/10 px-3 py-2">
                    <p className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase">
                      Sort by
                    </p>
                  </div>
                  <div role="menu" aria-label="Sort options" className="py-1.5">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setSortBy(opt.value);
                          setSortOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                          sortBy === opt.value
                            ? 'bg-purple-600/20 text-purple-300'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-md ${
                            sortBy === opt.value
                              ? 'bg-purple-600/30 text-purple-400'
                              : 'text-slate-600'
                          }`}
                        >
                          {opt.icon}
                        </span>
                        <span className="flex-1 text-left">{opt.label}</span>
                        {sortBy === opt.value && <Check className="h-3.5 w-3.5 text-purple-400" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {workspaces.length === 0 ? (
          <>
            <NoWorkspaces onCreate={() => setShowCreateDialog(true)} />
            <CreateWorkspaceDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
          </>
        ) : filteredWorkspaces.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-white/10 bg-slate-900/40 p-12 text-center"
          >
            <p className="text-slate-400">No workspaces match your search</p>
          </motion.div>
        ) : (
          <motion.div
            className="grid gap-5 md:grid-cols-2"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.08,
                },
              },
            }}
          >
            {filteredWorkspaces.map((workspace) => {
              const userMember = workspace.members.find((m) => m.userId === userId);
              const isOwner = workspace.owner.id === userId;

              // Format last updated
              const lastUpdated = getTimeAgo(new Date(workspace.updatedAt));

              return (
                <motion.div
                  key={workspace.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <Link href={`/dashboard/${workspace.id}`} className="group block h-full">
                    <GlassCard
                      hover
                      className="group relative h-full overflow-hidden p-7 transition-all hover:shadow-2xl hover:shadow-purple-500/20"
                    >
                      {/* Glow effect on hover */}
                      <div className="absolute inset-0 -z-10 bg-linear-to-br from-purple-500/0 via-purple-500/0 to-fuchsia-500/0 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-20" />

                      {/* Header with icon and badge */}
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ rotate: 5, scale: 1.1 }}
                            transition={{ type: 'spring', stiffness: 400 }}
                            className="rounded-xl bg-linear-to-br from-purple-600 to-fuchsia-600 p-3 shadow-xl shadow-purple-500/30"
                          >
                            <FileText className="h-5 w-5 text-white" />
                          </motion.div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <WorkspaceFavoriteToggleButton
                              workspaceId={workspace.id}
                              initialIsFavorite={
                                favoriteOverrides[workspace.id] ??
                                Boolean(workspace.workspaceFavorites?.length)
                              }
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 p-0 text-slate-200 hover:bg-white/10 hover:text-white"
                              onToggle={(isFavorite) => {
                                setFavoriteOverrides((prev) => ({
                                  ...prev,
                                  [workspace.id]: isFavorite,
                                }));
                              }}
                            />
                          </div>
                          <StatusBadge
                            status={
                              isOwner
                                ? 'owner'
                                : userMember?.permissions.includes(
                                      WORKSPACE_PERMISSION.MEMBERS_UPDATE_PERMISSIONS
                                    )
                                  ? 'admin'
                                  : userMember?.permissions.includes(
                                        WORKSPACE_PERMISSION.DOCUMENTS_EDIT
                                      )
                                    ? 'member'
                                    : 'member'
                            }
                            size="sm"
                          />
                        </div>
                      </div>

                      {/* Workspace name */}
                      <h3 className="mb-2 flex items-center gap-2 text-2xl font-bold text-white transition-colors group-hover:text-purple-300">
                        {workspace.name}
                        <ChevronRight className="h-5 w-5 translate-x-0 text-slate-600 opacity-0 transition-all group-hover:translate-x-1 group-hover:text-purple-400 group-hover:opacity-100" />
                      </h3>

                      {/* Description */}
                      <p className="mb-4 line-clamp-2 min-h-10 text-sm leading-relaxed text-slate-400">
                        {workspace.description || 'No description provided'}
                      </p>

                      {/* Last Updated */}
                      <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Updated {lastUpdated}</span>
                      </div>

                      {/* Stats and GitHub Status */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 transition-all group-hover:border-purple-500/50 group-hover:bg-purple-500/20">
                          <FileIcon className="h-4 w-4 text-purple-400" />
                          <span className="text-sm font-semibold text-purple-300">
                            {workspace._count.documents}
                          </span>
                          <span className="text-xs text-purple-400">docs</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 transition-all group-hover:border-blue-500/50 group-hover:bg-blue-500/20">
                          <Users className="h-4 w-4 text-blue-400" />
                          <span className="text-sm font-semibold text-blue-300">
                            {workspace._count.members}
                          </span>
                          <span className="text-xs text-blue-400">members</span>
                        </div>
                        {/* GitHub Sync Status (dynamic) */}
                        {(() => {
                          const syncState = computeWorkspaceGitHubSyncState(workspace);
                          if (syncState === 'not-connected') {
                            return <StatusBadge status="not-connected" size="sm" />;
                          }

                          if (syncState === 'connected') {
                            return <StatusBadge status="connected" size="sm" />;
                          }

                          return <StatusBadge status="synced" size="sm" />;
                        })()}
                      </div>
                    </GlassCard>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Enhanced Activity Feed */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="lg:col-span-1"
      >
        <GlassCard className="sticky top-24 overflow-hidden">
          {/* Header */}
          <div className="border-b border-white/10 bg-linear-to-br from-slate-800/50 to-slate-900/50 p-6 pb-5">
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-xl bg-linear-to-br from-emerald-600 to-teal-600 p-2 shadow-xl shadow-emerald-500/30">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Recent Activity</h3>
            </div>
            <p className="text-sm text-slate-400">
              Your recent actions across current and past workspaces
            </p>
          </div>

          {/* Activity List */}
          <div className="scrollbar-thin scrollbar-track-slate-900/20 scrollbar-thumb-slate-700/50 hover:scrollbar-thumb-slate-600/50 max-h-[600px] overflow-y-auto p-6">
            {recentActivity.length === 0 ? (
              <NoActivity />
            ) : (
              <>
                <div className="space-y-3">
                  {visibleActivity.map((activity, index) => {
                    const timeAgo = getTimeAgo(new Date(activity.createdAt));
                    const workspaceName =
                      activity.workspace?.name || activity.workspaceName || 'Deleted workspace';
                    const summary = getActivitySummary(activity);
                    const detail = getActivityDetail(activity);

                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedActivity(activity)}
                          className="group block w-full text-left"
                        >
                          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 transition-all hover:border-purple-500/30 hover:bg-slate-900/60 hover:shadow-lg hover:shadow-purple-500/10 focus-visible:ring-2 focus-visible:ring-purple-500/40 focus-visible:outline-none">
                            <div className="mb-3 flex items-start gap-3">
                              {/* Action Icon */}
                              <motion.div
                                whileHover={{ rotate: 5, scale: 1.1 }}
                                className="mt-0.5 rounded-lg bg-linear-to-br from-purple-600 to-fuchsia-600 p-2 shadow-lg shadow-purple-500/30"
                              >
                                {getActivityIcon(activity.type)}
                              </motion.div>

                              <div className="min-w-0 flex-1">
                                <h4 className="mb-1 truncate text-base font-bold text-white transition-colors group-hover:text-purple-300">
                                  {summary}
                                </h4>

                                <div className="mb-2 flex items-center gap-2">
                                  <FileText className="h-3.5 w-3.5 text-slate-500" />
                                  <span className="text-sm text-slate-400">{workspaceName}</span>
                                </div>

                                {detail && (
                                  <p className="mb-2 line-clamp-2 text-sm leading-relaxed text-slate-400">
                                    {detail}
                                  </p>
                                )}

                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                  <span className="font-medium">
                                    {formatActivityType(activity.type)}
                                  </span>
                                  <span>•</span>
                                  <span>{timeAgo}</span>
                                  <span>•</span>
                                  <span className="text-purple-400 group-hover:text-purple-300">
                                    View details
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Show More Button */}
                {recentActivity.length > 5 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-4 text-center"
                  >
                    <button
                      onClick={() => setShowAllActivity(!showAllActivity)}
                      className="group inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-sm font-semibold text-purple-400 transition-all hover:border-purple-500/50 hover:bg-purple-500/20 hover:text-purple-300"
                    >
                      <span>
                        {showAllActivity ? 'Show Less' : `Show ${recentActivity.length - 5} More`}
                      </span>
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${showAllActivity ? 'rotate-90' : 'group-hover:translate-x-0.5'}`}
                      />
                    </button>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </GlassCard>

        <Dialog
          open={Boolean(selectedActivity)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedActivity(null);
            }
          }}
        >
          <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden border-white/10 bg-slate-950 p-0 text-slate-100 sm:max-w-2xl">
            {selectedActivity && (
              <>
                <DialogHeader className="border-b border-white/10 px-6 pt-6 pb-4">
                  <DialogTitle className="pr-8 text-xl text-white">
                    {getActivitySummary(selectedActivity)}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    {formatActivityType(selectedActivity.type)} •{' '}
                    {getTimeAgo(new Date(selectedActivity.createdAt))}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 overflow-y-auto px-6 pb-6">
                  <div className="rounded-lg border border-white/10 bg-slate-900/60 p-3 text-sm text-slate-300">
                    {getActivityDetail(selectedActivity) ||
                      'No additional detail was recorded for this activity.'}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-white/10 bg-slate-900/40 p-3">
                      <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                        Workspace
                      </p>
                      <p className="mt-1 text-sm text-slate-200">
                        {selectedActivity.workspace?.name ||
                          selectedActivity.workspaceName ||
                          'Deleted workspace'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-slate-900/40 p-3">
                      <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                        Actor
                      </p>
                      <p className="mt-1 text-sm text-slate-200">
                        {selectedActivity.actorName ||
                          selectedActivity.actorEmail ||
                          'Unknown user'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-slate-900/40 p-3">
                      <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                        Entity Type
                      </p>
                      <p className="mt-1 text-sm break-all text-slate-200">
                        {selectedActivity.entityType}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-slate-900/40 p-3">
                      <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                        Entity ID
                      </p>
                      <p className="mt-1 text-sm break-all text-slate-200">
                        {selectedActivity.entityId}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-slate-900/40 p-3">
                    <p className="mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                      Metadata
                    </p>
                    <div className="max-h-[35vh] overflow-y-auto pr-1">
                      {renderActivityMetadata(selectedActivity.metadata)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const path = getActivityNavigationPath(selectedActivity);
                        if (!path) {
                          toast.info('No dedicated page is available for this activity yet.');
                          return;
                        }
                        setSelectedActivity(null);
                        router.push(path);
                      }}
                      className="rounded-lg border border-purple-500/40 bg-purple-500/15 px-3 py-2 text-sm font-semibold text-purple-300 transition-colors hover:bg-purple-500/25"
                    >
                      Open related page
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedActivity(null)}
                      className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/10"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getActivityIcon(type: string) {
  const className = 'h-4 w-4 text-white';

  switch (type) {
    case 'WORKSPACE_CREATED':
      return <FileIcon className={className} />;
    case 'WORKSPACE_DELETED':
      return <Trash2 className={className} />;
    case 'DOCUMENT_DELETED':
      return <Trash2 className={className} />;
    case 'COMMENT_ADDED':
    case 'COMMENT_RESOLVED':
      return <FileText className={className} />;
    case 'GITHUB_IMPORT':
      return <Download className={className} />;
    case 'GITHUB_EXPORT':
      return <Upload className={className} />;
    case 'GITHUB_PR_OPENED':
    case 'GITHUB_PR_UPDATED':
    case 'GITHUB_PR_MERGED':
    case 'GITHUB_PR_CLOSED':
    case 'GITHUB_PULL_REQUEST_CREATED':
      return <Upload className={className} />;
    case 'GITHUB_ISSUE_OPENED':
    case 'GITHUB_ISSUE_UPDATED':
    case 'GITHUB_ISSUE_CLOSED':
      return <Download className={className} />;
    case 'GITHUB_REPO_CONNECTED':
    case 'GITHUB_REPO_DISCONNECTED':
    case 'GITHUB_REPO_SYNCED':
    case 'GITHUB_SYNC_STARTED':
    case 'GITHUB_SYNC_SUCCESS':
    case 'GITHUB_SYNC_FAILED':
    case 'GITHUB_CONFLICT_DETECTED':
      return <ArrowUpDown className={className} />;
    case 'MEMBER_ADDED':
    case 'MEMBER_INVITED':
    case 'INVITE_SENT':
    case 'INVITE_RESENT':
    case 'INVITE_ACCEPTED':
    case 'INVITE_REJECTED':
      return <UserPlus className={className} />;
    case 'MEMBER_REMOVED':
    case 'INVITE_CANCELLED':
      return <UserMinus className={className} />;
    case 'OWNERSHIP_TRANSFERRED':
      return <Users className={className} />;
    case 'TAG_ADDED':
    case 'TAG_REMOVED':
    case 'DOCUMENT_LINKED':
    case 'DOCUMENT_MENTIONED':
    case 'DOCUMENT_STATUS_CHANGED':
    case 'PASSWORD_CHANGED':
    case 'ACCOUNT_DELETED':
      return <Edit className={className} />;
    case 'VERSION_CREATED':
      return <Clock className={className} />;
    case 'DOCUMENT_UPDATED':
    case 'DOCUMENT_CREATED':
    default:
      return <Edit className={className} />;
  }
}

function formatActivityType(type: string): string {
  return type.toLowerCase().replace(/_/g, ' ');
}

function getActivitySummary(activity: RecentActivityItem): string {
  const metadata = activity.metadata || {};

  switch (activity.type) {
    case 'WORKSPACE_CREATED':
      return `Created ${String(metadata.workspaceName || activity.workspaceName || 'a workspace')}`;
    case 'DOCUMENT_CREATED':
      return `Created ${String(metadata.title || 'a document')}`;
    case 'DOCUMENT_UPDATED':
      return `Updated ${String(metadata.title || 'a document')}`;
    case 'DOCUMENT_DELETED':
      return `Deleted ${String(metadata.title || 'a document')}`;
    case 'VERSION_CREATED':
      return 'Created a version';
    case 'COMMENT_ADDED':
      return 'Added a comment';
    case 'COMMENT_RESOLVED':
      return 'Resolved a comment';
    case 'MEMBER_ADDED':
      return `Added ${String(metadata.userName || metadata.userEmail || metadata.memberUserName || 'a member')}`;
    case 'MEMBER_REMOVED':
      return `Removed ${String(metadata.removedUserName || metadata.removedUserEmail || 'a member')}`;
    case 'MEMBER_INVITED':
    case 'INVITE_SENT':
      return `Invited ${String(metadata.userName || metadata.userEmail || metadata.email || 'a member')}`;
    case 'INVITE_RESENT':
      return `Resent invite to ${String(metadata.userName || metadata.userEmail || metadata.email || 'a member')}`;
    case 'INVITE_CANCELLED':
      return `Cancelled invite for ${String(metadata.userName || metadata.userEmail || metadata.email || 'a member')}`;
    case 'INVITE_ACCEPTED':
      return `${String(metadata.userName || metadata.userEmail || 'A member')} accepted an invite`;
    case 'INVITE_REJECTED':
      return `${String(metadata.userName || metadata.userEmail || 'A member')} rejected an invite`;
    case 'GITHUB_IMPORT':
      return `Imported from ${String(metadata.repoName || metadata.repository || 'GitHub')}`;
    case 'GITHUB_EXPORT':
      return `Exported to ${String(metadata.repoName || metadata.repository || 'GitHub')}`;
    case 'GITHUB_REPO_CONNECTED':
      return `Connected repository ${String(metadata.repoName || metadata.repository || 'GitHub')}`;
    case 'GITHUB_REPO_DISCONNECTED':
      return `Disconnected repository ${String(metadata.repoName || metadata.repository || 'GitHub')}`;
    case 'GITHUB_REPO_SYNCED':
      return `Synced ${String(metadata.repoName || metadata.repository || 'GitHub repository')}`;
    case 'GITHUB_SYNC_STARTED':
      return 'Started GitHub sync';
    case 'GITHUB_SYNC_SUCCESS':
      return 'GitHub sync completed';
    case 'GITHUB_SYNC_FAILED':
      return 'GitHub sync failed';
    case 'GITHUB_CONFLICT_DETECTED':
      return 'GitHub conflict detected';
    case 'GITHUB_PR_OPENED':
      return `Opened PR #${String(metadata.prNumber || activity.entityId || '?')}`;
    case 'GITHUB_PR_UPDATED':
      return `Updated PR #${String(metadata.prNumber || activity.entityId || '?')}`;
    case 'GITHUB_PR_MERGED':
      return `Merged PR #${String(metadata.prNumber || activity.entityId || '?')}`;
    case 'GITHUB_PR_CLOSED':
      return `Closed PR #${String(metadata.prNumber || activity.entityId || '?')}`;
    case 'GITHUB_PULL_REQUEST_CREATED':
      return `Created PR #${String(metadata.prNumber || activity.entityId || '?')}`;
    case 'GITHUB_ISSUE_OPENED':
      return `Opened issue #${String(metadata.issueNumber || activity.entityId || '?')}`;
    case 'GITHUB_ISSUE_UPDATED':
      return `Updated issue #${String(metadata.issueNumber || activity.entityId || '?')}`;
    case 'GITHUB_ISSUE_CLOSED':
      return `Closed issue #${String(metadata.issueNumber || activity.entityId || '?')}`;
    case 'OWNERSHIP_TRANSFERRED':
      return 'Transferred workspace ownership';
    case 'DOCUMENT_LINKED':
      return 'Linked documents';
    case 'DOCUMENT_MENTIONED':
      return 'Mentioned a document';
    case 'DOCUMENT_STATUS_CHANGED':
      return `Changed document status to ${String(metadata.status || metadata.to || 'new status')}`;
    case 'TAG_ADDED':
      return `Added tag ${String(metadata.tagName || metadata.tag || '')}`.trim();
    case 'TAG_REMOVED':
      return `Removed tag ${String(metadata.tagName || metadata.tag || '')}`.trim();
    case 'WORKSPACE_DELETED':
      return `Deleted ${String(metadata.workspaceName || activity.workspaceName || 'workspace')}`;
    case 'PASSWORD_CHANGED':
      return 'Changed account password';
    case 'ACCOUNT_DELETED':
      return 'Deleted account';
    default:
      return formatActivityType(activity.type);
  }
}

function getActivityDetail(activity: RecentActivityItem): string | null {
  const metadata = activity.metadata || {};

  switch (activity.type) {
    case 'VERSION_CREATED':
      return String(metadata.message || 'Saved a new version');
    case 'COMMENT_ADDED':
      return String(metadata.commentPreview || metadata.message || 'A comment was added');
    case 'COMMENT_RESOLVED':
      return String(metadata.commentPreview || metadata.message || 'A comment was resolved');
    case 'GITHUB_IMPORT':
      return `${String(metadata.filesImported || 0)} file(s) imported`;
    case 'GITHUB_EXPORT':
      return `${String(metadata.filesExported || 0)} file(s) exported`;
    case 'GITHUB_REPO_SYNCED':
      return `${String(metadata.syncedCount || 0)} item(s) synced`;
    case 'GITHUB_SYNC_FAILED':
      return String(metadata.error || metadata.reason || 'Sync failed');
    case 'GITHUB_CONFLICT_DETECTED':
      return String(
        metadata.conflictSummary || metadata.message || 'Manual review may be required'
      );
    case 'GITHUB_PR_OPENED':
    case 'GITHUB_PR_UPDATED':
    case 'GITHUB_PR_MERGED':
    case 'GITHUB_PR_CLOSED':
    case 'GITHUB_PULL_REQUEST_CREATED':
      return String(
        metadata.title || metadata.repoName || metadata.repository || 'GitHub pull request activity'
      );
    case 'GITHUB_ISSUE_OPENED':
    case 'GITHUB_ISSUE_UPDATED':
    case 'GITHUB_ISSUE_CLOSED':
      return String(
        metadata.title || metadata.repoName || metadata.repository || 'GitHub issue activity'
      );
    case 'MEMBER_ADDED':
    case 'MEMBER_REMOVED':
      return `Total impacted members: ${String(metadata.removedMemberCount || 1)}`;
    case 'OWNERSHIP_TRANSFERRED':
      return String(
        metadata.newOwnerName ||
          metadata.newOwnerEmail ||
          'Ownership was transferred to another member'
      );
    case 'DOCUMENT_STATUS_CHANGED':
      return `${String(metadata.from || 'unknown')} -> ${String(metadata.to || 'unknown')}`;
    case 'TAG_ADDED':
      return String(metadata.documentTitle || metadata.title || 'Tag updated on document');
    case 'TAG_REMOVED':
      return String(metadata.documentTitle || metadata.title || 'Tag removed from document');
    case 'MEMBER_INVITED':
    case 'INVITE_SENT':
    case 'INVITE_RESENT':
    case 'INVITE_CANCELLED':
    case 'INVITE_ACCEPTED':
    case 'INVITE_REJECTED':
      return String(metadata.email || metadata.userEmail || 'Invite lifecycle event');
    case 'WORKSPACE_DELETED':
      return `${String(metadata.documentsCount || 0)} document(s), ${String(metadata.membersCount || 0)} member(s)`;
    default:
      if (metadata && Object.keys(metadata).length > 0) {
        return 'Open to view full metadata details.';
      }
      return null;
  }
}

function getActivityNavigationPath(activity: RecentActivityItem): string | null {
  const metadata = activity.metadata || {};
  const workspaceId = activity.workspace?.id || activity.workspaceId;

  if (!workspaceId) {
    return null;
  }

  if (['DOCUMENT_CREATED', 'DOCUMENT_UPDATED'].includes(activity.type) && activity.entityId) {
    return `/dashboard/${workspaceId}/documents/${activity.entityId}`;
  }

  if (['VERSION_CREATED', 'COMMENT_ADDED', 'COMMENT_RESOLVED'].includes(activity.type)) {
    const documentId = String(metadata.documentId || '');
    if (documentId) {
      return `/dashboard/${workspaceId}/documents/${documentId}`;
    }
  }

  if (activity.type.startsWith('GITHUB_')) {
    return `/dashboard/${workspaceId}/settings/github`;
  }

  if (
    [
      'MEMBER_ADDED',
      'MEMBER_REMOVED',
      'MEMBER_INVITED',
      'INVITE_SENT',
      'INVITE_RESENT',
      'INVITE_CANCELLED',
      'INVITE_ACCEPTED',
      'INVITE_REJECTED',
      'WORKSPACE_CREATED',
      'OWNERSHIP_TRANSFERRED',
    ].includes(activity.type)
  ) {
    return `/dashboard/${workspaceId}`;
  }

  return null;
}

function formatMetadataValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function renderActivityMetadata(metadata: Record<string, unknown> | null) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return <p className="text-sm text-slate-400">No metadata recorded for this activity.</p>;
  }

  const entries = Object.entries(metadata);

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-md bg-slate-950/50 p-2">
          <p className="text-xs font-semibold text-slate-500">{key}</p>
          <p className="mt-1 text-sm break-all text-slate-200">{formatMetadataValue(value)}</p>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <WorkspaceListSkeleton count={4} />
      </div>
      <div className="lg:col-span-1">
        <ActivityFeedSkeleton />
      </div>
    </div>
  );
}
