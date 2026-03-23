import { useState, useEffect, useRef, useCallback } from 'react';

export interface LockInfo {
  locked: boolean;
  isOwnLock?: boolean;
  lock?: {
    userId: string;
    userName: string | null;
    userEmail: string;
    acquiredAt: string;
    expiresAt: string;
  };
}

interface UseDocumentLockOptions {
  documentId: string;
  enabled?: boolean;
  onLockAcquired?: () => void;
  onLockLost?: () => void;
  onLockUnavailable?: (lockInfo: LockInfo) => void;
}

const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds
const LOCK_CHECK_INTERVAL = 15 * 1000; // 15 seconds
const TYPING_ACTIVITY_WINDOW_MS = 60 * 1000; // Extend lock only if user typed in last 60s

export function useDocumentLock({
  documentId,
  enabled = true,
  onLockAcquired,
  onLockLost,
  onLockUnavailable,
}: UseDocumentLockOptions) {
  const [hasLock, setHasLock] = useState(false);
  const [lockInfo, setLockInfo] = useState<LockInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const heartbeatIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lockCheckIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isAcquiringRef = useRef(false);
  const hasLockRef = useRef(false);
  const documentIdRef = useRef(documentId);
  const lastUnavailableUserIdRef = useRef<string | null>(null);
  const lastTypingActivityAtRef = useRef<number>(Date.now());

  const markLockActivity = useCallback(() => {
    lastTypingActivityAtRef.current = Date.now();
  }, []);

  // Start heartbeat to keep lock alive
  const startHeartbeat = useCallback(() => {
    // Clear any existing interval
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = undefined;
    }

    // Set new interval
    heartbeatIntervalRef.current = setInterval(async () => {
      // Only keep extending while user is actively typing/editing.
      // If idle, stop extending and let server-side timeout expire the lock.
      const recentlyActive =
        Date.now() - lastTypingActivityAtRef.current <= TYPING_ACTIVITY_WINDOW_MS;
      if (!recentlyActive) {
        return;
      }

      try {
        const response = await fetch(`/api/documents/${documentId}/lock`, {
          method: 'PATCH',
        });

        if (!response.ok) {
          // Losing a lock can be a normal race condition (tab hidden, lock expired,
          // user permissions changed, or another session reclaimed). Avoid noisy
          // console.error output that triggers the Next.js dev overlay.
          if (response.status !== 403 && response.status !== 404) {
            console.warn(`Failed to extend lock (status ${response.status})`);
          }
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = undefined;
          }
          setHasLock(false);
          onLockLost?.();
        }
      } catch (err) {
        console.warn('Heartbeat failed:', err instanceof Error ? err.message : String(err));
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = undefined;
        }
        setHasLock(false);
        onLockLost?.();
      }
    }, HEARTBEAT_INTERVAL);
  }, [documentId, onLockLost]);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    heartbeatIntervalRef.current = undefined;
  }, []);

  // Check lock status
  const checkLockStatus = useCallback(async () => {
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

      if (!response.ok) {
        console.warn(`Lock check failed with status ${response.status}`);
        return { locked: false };
      }

      const data = (await response.json()) as LockInfo;

      setLockInfo(data);

      if (data.locked && data.isOwnLock) {
        if (!hasLock) {
          markLockActivity();
          setHasLock(true);
          startHeartbeat();
        }
      } else if (hasLock) {
        stopHeartbeat();
        setHasLock(false);
      }

      if (data.locked && data.lock && !data.isOwnLock && !hasLock) {
        // Only notify once per distinct lock holder — suppress repeated polling toasts
        const lockerId = data.lock.userId;
        if (lastUnavailableUserIdRef.current !== lockerId) {
          lastUnavailableUserIdRef.current = lockerId;
          onLockUnavailable?.(data);
        }
      } else if (!data.locked || data.isOwnLock) {
        lastUnavailableUserIdRef.current = null;
      }

      return data;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('Lock check timeout');
      } else {
        console.warn(
          'Failed to check lock status:',
          err instanceof Error ? err.message : String(err)
        );
      }
      return { locked: false };
    }
  }, [documentId, hasLock, onLockUnavailable, startHeartbeat, stopHeartbeat]);

  // Acquire lock
  const acquireLock = useCallback(async () => {
    if (isAcquiringRef.current) return false;

    isAcquiringRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Now try to acquire the lock
      const response = await fetch(`/api/documents/${documentId}/lock`, {
        method: 'POST',
        signal: AbortSignal.timeout(5000),
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.status === 423) {
        // Document locked by another user
        setLockInfo({
          locked: true,
          lock: data.lockedBy
            ? {
                userId: data.lockedBy.id,
                userName: data.lockedBy.name,
                userEmail: data.lockedBy.email,
                acquiredAt: data.acquiredAt || new Date().toISOString(),
                expiresAt: data.expiresAt,
              }
            : undefined,
        });
        setError(data.error || 'Document is locked by another user');
        onLockUnavailable?.({ locked: true, lock: data.lockedBy });
        return false;
      }

      if (!response.ok) {
        setError(data.error || 'Failed to acquire lock');
        return false;
      }

      // Lock acquired successfully
      markLockActivity();
      setHasLock(true);
      setLockInfo({ locked: true, lock: data.lock });
      onLockAcquired?.();

      // Start heartbeat
      startHeartbeat();

      return true;
    } catch (err) {
      let message = 'Failed to acquire lock';
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          message = 'Lock acquisition timeout - please try again';
        } else {
          message = err.message;
        }
      }
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
      isAcquiringRef.current = false;
    }
  }, [documentId, markLockActivity, onLockAcquired, onLockUnavailable, startHeartbeat]);

  // Extend lock (heartbeat)
  const extendLock = useCallback(async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/lock`, {
        method: 'PATCH',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        // Lock lost
        console.warn('Failed to extend lock');
        stopHeartbeat();
        setHasLock(false);
        onLockLost?.();
        return false;
      }

      return true;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('Heartbeat timeout');
      } else {
        console.warn('Heartbeat failed:', err instanceof Error ? err.message : String(err));
      }
      stopHeartbeat();
      setHasLock(false);
      onLockLost?.();
      return false;
    }
  }, [documentId, onLockLost, stopHeartbeat]);

  // Release lock
  const releaseLock = useCallback(async () => {
    // Stop intervals first
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = undefined;
    }
    if (lockCheckIntervalRef.current) {
      clearInterval(lockCheckIntervalRef.current);
      lockCheckIntervalRef.current = undefined;
    }

    // Update state immediately
    setHasLock(false);
    setLockInfo({ locked: false });

    try {
      const response = await fetch(`/api/documents/${documentId}/lock`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        console.warn('Failed to release lock on server');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('Release lock timeout');
      } else {
        console.warn('Failed to release lock:', err instanceof Error ? err.message : String(err));
      }
      // Still update state even if request fails
    }
  }, [documentId]);

  // Start periodic lock status checks
  const startLockCheck = useCallback(() => {
    stopLockCheck();

    lockCheckIntervalRef.current = setInterval(() => {
      checkLockStatus();
    }, LOCK_CHECK_INTERVAL);
  }, [checkLockStatus]);

  // Stop lock status checks
  const stopLockCheck = useCallback(() => {
    if (lockCheckIntervalRef.current) {
      clearInterval(lockCheckIntervalRef.current);
    }
    lockCheckIntervalRef.current = undefined;
  }, []);

  useEffect(() => {
    hasLockRef.current = hasLock;
  }, [hasLock]);

  useEffect(() => {
    documentIdRef.current = documentId;
  }, [documentId]);

  // Initial lock status check
  useEffect(() => {
    if (!enabled || !documentId) {
      stopLockCheck();
      return;
    }

    // Only check once on mount or when documentId/enabled changes
    checkLockStatus();
    startLockCheck();

    return () => {
      stopLockCheck();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, documentId]); // Intentionally minimal dependencies to avoid infinite loop

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hasLockRef.current) {
        // Best effort release - use fetch with keepalive for cleanup during unmount
        fetch(`/api/documents/${documentIdRef.current}/lock`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true, // Similar to sendBeacon - allows request to complete even if page unloads
        }).catch(() => {
          // Silent failure is acceptable during unmount
        });
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (lockCheckIntervalRef.current) {
        clearInterval(lockCheckIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount/unmount

  // Handle page visibility changes (pause heartbeat when hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = undefined;
        }
      } else if (hasLock) {
        // Resume heartbeat and immediately extend lock
        extendLock();
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
        heartbeatIntervalRef.current = setInterval(() => {
          extendLock();
        }, HEARTBEAT_INTERVAL);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLock]); // Only depend on hasLock state

  return {
    hasLock,
    lockInfo,
    isLoading,
    error,
    markLockActivity,
    acquireLock,
    releaseLock,
    checkLockStatus,
  };
}
