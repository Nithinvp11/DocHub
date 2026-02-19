'use client';

import { motion } from 'framer-motion';
import { FileText, FileIcon, Users, TrendingUp, Sparkles } from 'lucide-react';
import { CreateWorkspaceDialog } from '@/components/create-workspace-dialog';
import { GlassCard } from '@/components/ui/glass-card';

interface DashboardHeaderProps {
  workspacesCount: number;
  documentsCount: number;
  recentUpdatesCount: number;
}

export function DashboardHeader({
  workspacesCount,
  documentsCount,
  recentUpdatesCount,
}: DashboardHeaderProps) {
  return (
    <div className="mb-12 space-y-10">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 p-3 shadow-2xl shadow-purple-500/40"
            >
              <Sparkles className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h1 className="bg-gradient-to-r from-white via-purple-200 to-fuchsia-200 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-5xl">
                Welcome back!
              </h1>
            </div>
          </div>
          <p className="max-w-2xl text-lg leading-relaxed text-slate-400">
            Manage your knowledge base, collaborate with your team, and keep everything organized in
            one place
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-shrink-0"
        >
          <CreateWorkspaceDialog />
        </motion.div>
      </motion.div>

      {/* Premium KPI Stats Widgets (Distinct from Workspace Cards) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {/* Workspaces Stat */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="group relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-slate-900/50 to-slate-900/90 p-6 backdrop-blur-xl transition-all hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/20"
        >
          {/* Subtle gradient line at top */}
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />

          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <div className="rounded-lg bg-purple-500/20 p-1.5">
                  <FileText className="h-4 w-4 text-purple-400" />
                </div>
                <span className="text-xs font-semibold tracking-wider text-purple-400 uppercase">
                  Workspaces
                </span>
              </div>
              <div className="mb-1 text-4xl font-black text-white">{workspacesCount}</div>
              <p className="text-xs text-slate-500">
                Active workspace{workspacesCount !== 1 ? 's' : ''}
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-400 opacity-60" />
          </div>
        </motion.div>

        {/* Documents Stat */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="group relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-slate-900/50 to-slate-900/90 p-6 backdrop-blur-xl transition-all hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/20"
        >
          {/* Subtle gradient line at top */}
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <div className="rounded-lg bg-blue-500/20 p-1.5">
                  <FileIcon className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-xs font-semibold tracking-wider text-blue-400 uppercase">
                  Documents
                </span>
              </div>
              <div className="mb-1 text-4xl font-black text-white">{documentsCount}</div>
              <p className="text-xs text-slate-500">
                Total document{documentsCount !== 1 ? 's' : ''}
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-400 opacity-60" />
          </div>
        </motion.div>

        {/* Recent Updates Stat */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-900/50 to-slate-900/90 p-6 backdrop-blur-xl transition-all hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/20"
        >
          {/* Subtle gradient line at top */}
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />

          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <div className="rounded-lg bg-emerald-500/20 p-1.5">
                  <Users className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase">
                  Activity
                </span>
              </div>
              <div className="mb-1 text-4xl font-black text-white">{recentUpdatesCount}</div>
              <p className="text-xs text-slate-500">
                Update{recentUpdatesCount !== 1 ? 's' : ''} this week
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-400 opacity-60" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
