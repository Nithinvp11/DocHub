'use client';

import { useEffect, useState } from 'react';
import { LockIcon } from 'lucide-react';

interface DocumentLockIndicatorProps {
  documentId: string;
  className?: string;
}

interface LockInfo {
  locked: boolean;
  lock?: {
    userName: string | null;
    userEmail: string;
    expiresAt: string;
  };
}

export function DocumentLockIndicator({ documentId, className = '' }: DocumentLockIndicatorProps) {
  const [lockInfo, setLockInfo] = useState<LockInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkLock() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`/api/documents/${documentId}/lock`, {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        clearTimeout(timeoutId);

        if (!mounted) return;

        if (!response.ok) {
          console.warn(`Lock check failed with status ${response.status}`);
          setLockInfo({ locked: false });
          return;
        }

        const data: LockInfo = await response.json();
        if (mounted) {
          setLockInfo(data);
        }
      } catch (error) {
        if (!mounted) return;

        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('Lock check timeout');
        } else {
          console.warn(
            'Failed to check lock:',
            error instanceof Error ? error.message : String(error)
          );
        }
        // Don't set lock info on error - just default to unlocked
        setLockInfo({ locked: false });
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    checkLock();

    // Refresh lock status every 30 seconds
    const interval = setInterval(checkLock, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [documentId]);

  if (isLoading || !lockInfo?.locked || !lockInfo.lock) {
    return null;
  }

  const displayName = lockInfo.lock.userName || lockInfo.lock.userEmail;

  return (
    <div
      className={`flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-xs text-amber-600 dark:bg-amber-900/20 ${className}`}
      title={`Being edited by ${displayName}`}
    >
      <LockIcon className="h-3 w-3" />
      <span>Locked</span>
    </div>
  );
}
