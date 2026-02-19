'use client';

import React from 'react';
import {
  FileEdit,
  Eye,
  CheckCircle2,
  Globe,
  Archive,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type DocumentStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';

interface StatusConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  description: string;
}

const STATUS_CONFIGS: Record<DocumentStatus, StatusConfig> = {
  DRAFT: {
    label: 'Draft',
    icon: FileEdit,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    description: 'Work in progress',
  },
  IN_REVIEW: {
    label: 'In Review',
    icon: Eye,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    description: 'Being reviewed',
  },
  APPROVED: {
    label: 'Approved',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
    description: 'Approved for publication',
  },
  PUBLISHED: {
    label: 'Published',
    icon: Globe,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
    description: 'Publicly available',
  },
  ARCHIVED: {
    label: 'Archived',
    icon: Archive,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900',
    description: 'No longer active',
  },
};

interface StatusSelectorProps {
  status: DocumentStatus;
  onStatusChange: (status: DocumentStatus) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusSelector({
  status,
  onStatusChange,
  disabled = false,
  size = 'md',
}: StatusSelectorProps) {
  const config = STATUS_CONFIGS[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'h-7 text-xs gap-1',
    md: 'h-9 text-sm gap-1.5',
    lg: 'h-10 text-base gap-2',
  };

  if (disabled) {
    return <StatusBadge status={status} size={size} />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn('justify-between', sizeClasses[size])}
          disabled={disabled}
        >
          <div className="flex items-center gap-1.5">
            <Icon className="h-4 w-4" />
            <span>{config.label}</span>
          </div>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {(Object.entries(STATUS_CONFIGS) as [DocumentStatus, StatusConfig][]).map(
          ([statusKey, statusConfig]) => {
            const StatusIcon = statusConfig.icon;
            const isSelected = statusKey === status;
            
            return (
              <DropdownMenuItem
                key={statusKey}
                onClick={() => onStatusChange(statusKey)}
                className="flex items-start gap-3 cursor-pointer"
              >
                <StatusIcon className={cn('h-4 w-4 mt-0.5', statusConfig.color)} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{statusConfig.label}</span>
                    {isSelected && (
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {statusConfig.description}
                  </span>
                </div>
              </DropdownMenuItem>
            );
          }
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simple badge display
interface StatusBadgeProps {
  status: DocumentStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIGS[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <Badge
      variant="secondary"
      className={cn(
        'inline-flex items-center gap-1.5',
        config.color,
        config.bgColor,
        sizeClasses[size]
      )}
    >
      <Icon className={iconSizes[size]} />
      <span>{config.label}</span>
    </Badge>
  );
}

// Hook for managing status changes with API
export function useDocumentStatus(documentId: string, initialStatus: DocumentStatus) {
  const [status, setStatus] = React.useState<DocumentStatus>(initialStatus);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const updateStatus = async (newStatus: DocumentStatus) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedDoc = await response.json();
        setStatus(updatedDoc.status);
        return true;
      } else {
        console.error('Failed to update status');
        return false;
      }
    } catch (error) {
      console.error('Error updating status:', error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return { status, updateStatus, isUpdating };
}
