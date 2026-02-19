'use client';

import React from 'react';
import { Check, Loader2, AlertCircle, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SaveStatus = 'saved' | 'saving' | 'error' | 'unsaved';

interface AutoSaveIndicatorProps {
  status: SaveStatus;
  lastSavedAt?: Date;
  className?: string;
}

export function AutoSaveIndicator({ status, lastSavedAt, className }: AutoSaveIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Loader2,
          text: 'Saving...',
          className: 'text-blue-600 dark:text-blue-400',
          iconClassName: 'animate-spin',
        };
      case 'saved':
        return {
          icon: Check,
          text: lastSavedAt 
            ? `Saved ${getTimeAgo(lastSavedAt)}` 
            : 'All changes saved',
          className: 'text-green-600 dark:text-green-400',
          iconClassName: '',
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Failed to save',
          className: 'text-red-600 dark:text-red-400',
          iconClassName: '',
        };
      case 'unsaved':
        return {
          icon: Cloud,
          text: 'Unsaved changes',
          className: 'text-orange-600 dark:text-orange-400',
          iconClassName: '',
        };
    }
  };
  
  const config = getStatusConfig();
  const Icon = config.icon;
  
  return (
    <div className={cn('flex items-center gap-1.5 text-sm', config.className, className)}>
      <Icon className={cn('h-4 w-4', config.iconClassName)} />
      <span>{config.text}</span>
    </div>
  );
}

// Compact version for minimal space
export function CompactAutoSaveIndicator({ status }: { status: SaveStatus }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Loader2,
          className: 'text-blue-600 dark:text-blue-400',
          iconClassName: 'animate-spin',
        };
      case 'saved':
        return {
          icon: Check,
          className: 'text-green-600 dark:text-green-400',
          iconClassName: '',
        };
      case 'error':
        return {
          icon: AlertCircle,
          className: 'text-red-600 dark:text-red-400',
          iconClassName: '',
        };
      case 'unsaved':
        return {
          icon: Cloud,
          className: 'text-orange-600 dark:text-orange-400',
          iconClassName: '',
        };
    }
  };
  
  const config = getStatusConfig();
  const Icon = config.icon;
  
  return (
    <Icon className={cn('h-4 w-4', config.className, config.iconClassName)} />
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
