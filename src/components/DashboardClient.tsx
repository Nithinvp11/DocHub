'use client';

import { useState } from 'react';
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
  Search,
  GitBranch,
  CheckCircle,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { WorkspaceListSkeleton, ActivityFeedSkeleton } from '@/components/LoadingStates';
import { NoWorkspaces, NoActivity } from '@/components/EmptyStates';
import { PAGINATION_LIMITS } from '@/lib/constants';
import { WORKSPACE_PERMISSION } from '@/lib/workspace-permission-definitions';

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
}

interface Version {
  id: string;
  message: string;
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  document: {
    id: string;
    title: string;
    workspaceId: string;
    workspace: {
      name: string;
    };
  };
}

interface DashboardClientProps {
  workspaces: Workspace[];
  recentVersions: Version[];
  userId: string;
}

export function DashboardClient({ workspaces, recentVersions, userId }: DashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllActivity, setShowAllActivity] = useState(false);

  // Filter workspaces based on search query
  const filteredWorkspaces = workspaces.filter(
    (workspace) =>
      workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (workspace.description &&
        workspace.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Show only 5 activity items by default, or all if expanded
  const visibleActivity = showAllActivity ? recentVersions : recentVersions.slice(0, 5);

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

          {/* Search Bar */}
          <div className="relative">
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
        </motion.div>

        {workspaces.length === 0 ? (
          <NoWorkspaces onCreate={() => (window.location.href = '/dashboard/new')} />
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
            {filteredWorkspaces.map((workspace, index) => {
              const userMember = workspace.members.find((m) => m.userId === userId);
              const isOwner = workspace.owner.id === userId;
              const roleLabel = isOwner
                ? 'Owner'
                : userMember?.permissions.includes(WORKSPACE_PERMISSION.MEMBERS_UPDATE_PERMISSIONS)
                  ? 'Admin'
                  : userMember?.permissions.includes(WORKSPACE_PERMISSION.DOCUMENTS_EDIT)
                    ? 'Editor'
                    : 'Viewer';

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
                      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-fuchsia-500/0 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-20" />

                      {/* Header with icon and badge */}
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ rotate: 5, scale: 1.1 }}
                            transition={{ type: 'spring', stiffness: 400 }}
                            className="rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 p-3 shadow-xl shadow-purple-500/30"
                          >
                            <FileText className="h-5 w-5 text-white" />
                          </motion.div>
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

                      {/* Workspace name */}
                      <h3 className="mb-2 flex items-center gap-2 text-2xl font-bold text-white transition-colors group-hover:text-purple-300">
                        {workspace.name}
                        <ChevronRight className="h-5 w-5 translate-x-0 text-slate-600 opacity-0 transition-all group-hover:translate-x-1 group-hover:text-purple-400 group-hover:opacity-100" />
                      </h3>

                      {/* Description */}
                      <p className="mb-4 line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-slate-400">
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
                        {/* GitHub Sync Status (simulated - you can add real data later) */}
                        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 transition-all group-hover:border-emerald-500/50 group-hover:bg-emerald-500/20">
                          <GitBranch className="h-4 w-4 text-emerald-400" />
                          <span className="text-xs text-emerald-400">Synced</span>
                        </div>
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
          <div className="border-b border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 pb-5">
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 p-2 shadow-xl shadow-emerald-500/30">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Recent Activity</h3>
            </div>
            <p className="text-sm text-slate-400">Latest updates across your workspaces</p>
          </div>

          {/* Activity List */}
          <div className="scrollbar-thin scrollbar-track-slate-900/20 scrollbar-thumb-slate-700/50 hover:scrollbar-thumb-slate-600/50 max-h-[600px] overflow-y-auto p-6">
            {recentVersions.length === 0 ? (
              <NoActivity />
            ) : (
              <>
                <div className="space-y-3">
                  {visibleActivity.map((version, index) => {
                    const timeAgo = getTimeAgo(new Date(version.createdAt));
                    const authorName = version.author.name || version.author.email.split('@')[0];

                    return (
                      <motion.div
                        key={version.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          href={`/dashboard/${version.document.workspaceId}/documents/${version.document.id}`}
                          className="group block"
                        >
                          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 transition-all hover:border-purple-500/30 hover:bg-slate-900/60 hover:shadow-lg hover:shadow-purple-500/10">
                            <div className="mb-3 flex items-start gap-3">
                              {/* Action Icon */}
                              <motion.div
                                whileHover={{ rotate: 5, scale: 1.1 }}
                                className="mt-0.5 rounded-lg bg-gradient-to-br from-purple-600 to-fuchsia-600 p-2 shadow-lg shadow-purple-500/30"
                              >
                                <Edit className="h-4 w-4 text-white" />
                              </motion.div>

                              <div className="min-w-0 flex-1">
                                {/* Document Title */}
                                <h4 className="mb-1 truncate text-base font-bold text-white transition-colors group-hover:text-purple-300">
                                  {version.document.title}
                                </h4>

                                {/* Workspace Name */}
                                <div className="mb-2 flex items-center gap-2">
                                  <FileText className="h-3.5 w-3.5 text-slate-500" />
                                  <span className="text-sm text-slate-400">
                                    {version.document.workspace.name}
                                  </span>
                                </div>

                                {/* Commit Message */}
                                {version.message && (
                                  <p className="mb-2 line-clamp-2 text-sm leading-relaxed text-slate-400">
                                    {version.message}
                                  </p>
                                )}

                                {/* Author and Time */}
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                  <span className="font-medium">{authorName}</span>
                                  <span>•</span>
                                  <span>{timeAgo}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Show More Button */}
                {recentVersions.length > 5 && (
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
                        {showAllActivity ? 'Show Less' : `Show ${recentVersions.length - 5} More`}
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
