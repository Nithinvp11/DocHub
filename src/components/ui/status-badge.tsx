'use client';

import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  AlertTriangle,
  GitBranch,
  Crown,
  Shield,
  Users,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type StatusType =
  | 'synced'
  | 'syncing'
  | 'failed'
  | 'queued'
  | 'conflict'
  | 'current'
  | 'draft'
  | 'owner'
  | 'admin'
  | 'member'
  | 'connected'
  | 'not-connected'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  synced: {
    icon: CheckCircle2,
    label: 'Synced',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  syncing: {
    icon: Loader2,
    label: 'Syncing',
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  failed: {
    icon: AlertCircle,
    label: 'Failed',
    className: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  queued: {
    icon: Clock,
    label: 'Queued',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  conflict: {
    icon: AlertTriangle,
    label: 'Conflict',
    className: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  },
  current: {
    icon: GitBranch,
    label: 'Current',
    className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  draft: {
    icon: GitBranch,
    label: 'Draft',
    className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  },
  owner: {
    icon: Crown,
    label: 'Owner',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  admin: {
    icon: Shield,
    label: 'Admin',
    className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  member: {
    icon: Users,
    label: 'Member',
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  // GitHub connection states
  connected: {
    icon: GitBranch,
    label: 'Connected',
    className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  },
  'not-connected': {
    icon: GitBranch,
    label: 'Not connected',
    className: 'bg-slate-700/10 text-slate-500 border-slate-700/20',
  },
  success: {
    icon: CheckCircle2,
    label: 'Success',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Warning',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  error: {
    icon: AlertCircle,
    label: 'Error',
    className: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  info: { icon: Info, label: 'Info', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export function StatusBadge({
  status,
  size = 'md',
  animate = false,
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.className,
        sizeStyles[size],
        animate && 'transition-all',
        className
      )}
    >
      {showIcon && <Icon className={cn('h-3 w-3', status === 'syncing' && 'animate-spin')} />}
      {config.label}
    </span>
  );
}
