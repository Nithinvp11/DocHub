'use client';

import { LockIcon, Clock, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDistanceToNow } from 'date-fns';

interface LockStatusBannerProps {
  lockInfo: {
    userId: string;
    userName: string | null;
    userEmail: string;
    acquiredAt: string;
    expiresAt: string;
  };
  className?: string;
}

export function LockStatusBanner({ lockInfo, className = '' }: LockStatusBannerProps) {
  const displayName = lockInfo.userName || lockInfo.userEmail;
  const expiresIn = formatDistanceToNow(new Date(lockInfo.expiresAt), { addSuffix: true });

  return (
    <Alert className={`border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 ${className}`}>
      <LockIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5" />
            <span className="font-semibold">{displayName}</span>
            <span>is currently editing this document</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
            <Clock className="h-3.5 w-3.5" />
            <span>Lock expires {expiresIn}</span>
          </div>
          <p className="text-sm mt-1">
            You can view the document but cannot make changes until the lock is released.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
