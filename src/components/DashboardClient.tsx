'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { CreateWorkspaceDialog } from '@/components/create-workspace-dialog';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updated-desc');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);
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
                        <div className="group block">
                          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 transition-all hover:border-purple-500/30 hover:bg-slate-900/60 hover:shadow-lg hover:shadow-purple-500/10">
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
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
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
    case 'DOCUMENT_DELETED':
      return <Trash2 className={className} />;
    case 'GITHUB_IMPORT':
      return <Download className={className} />;
    case 'GITHUB_EXPORT':
      return <Upload className={className} />;
    case 'MEMBER_ADDED':
      return <UserPlus className={className} />;
    case 'MEMBER_REMOVED':
      return <UserMinus className={className} />;
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
    case 'DOCUMENT_CREATED':
      return `Created ${String(metadata.title || 'a document')}`;
    case 'DOCUMENT_UPDATED':
      return `Updated ${String(metadata.title || 'a document')}`;
    case 'DOCUMENT_DELETED':
      return `Deleted ${String(metadata.title || 'a document')}`;
    case 'VERSION_CREATED':
      return 'Created a version';
    case 'MEMBER_ADDED':
      return `Added ${String(metadata.userName || metadata.userEmail || metadata.memberUserName || 'a member')}`;
    case 'MEMBER_REMOVED':
      return `Removed ${String(metadata.removedUserName || metadata.removedUserEmail || 'a member')}`;
    case 'GITHUB_IMPORT':
      return `Imported from ${String(metadata.repoName || metadata.repository || 'GitHub')}`;
    case 'GITHUB_EXPORT':
      return `Exported to ${String(metadata.repoName || metadata.repository || 'GitHub')}`;
    case 'WORKSPACE_DELETED':
      return `Deleted ${String(metadata.workspaceName || activity.workspaceName || 'workspace')}`;
    default:
      return formatActivityType(activity.type);
  }
}

function getActivityDetail(activity: RecentActivityItem): string | null {
  const metadata = activity.metadata || {};

  switch (activity.type) {
    case 'VERSION_CREATED':
      return String(metadata.message || 'Saved a new version');
    case 'GITHUB_IMPORT':
      return `${String(metadata.filesImported || 0)} file(s) imported`;
    case 'GITHUB_EXPORT':
      return `${String(metadata.filesExported || 0)} file(s) exported`;
    case 'WORKSPACE_DELETED':
      return `${String(metadata.documentsCount || 0)} document(s), ${String(metadata.membersCount || 0)} member(s)`;
    default:
      return null;
  }
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
