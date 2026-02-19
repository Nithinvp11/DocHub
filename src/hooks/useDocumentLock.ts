import { useState, useEffect, useRef, useCallback } from 'react';

export interface LockInfo {
  locked: boolean;
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

const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes
const LOCK_CHECK_INTERVAL = 30 * 1000; // 30 seconds

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

  // Start heartbeat to keep lock alive
  const startHeartbeat = useCallback(() => {
    // Clear any existing interval
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = undefined;
    }

    // Set new interval
    heartbeatIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}/lock`, {
          method: 'PATCH',
        });

        if (!response.ok) {
          // Lock lost
          console.error('Failed to extend lock');
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = undefined;
          }
          setHasLock(false);
          onLockLost?.();
        }
      } catch (err) {
        console.error('Heartbeat failed:', err);
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

      const data: LockInfo = await response.json();

      setLockInfo(data);

      if (data.locked && data.lock) {
        // Document is locked by someone
        if (!hasLock) {
          // We don't have the lock, someone else does
          onLockUnavailable?.(data);
        }
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
  }, [documentId, hasLock, onLockUnavailable]);

  // Acquire lock
  const acquireLock = useCallback(async () => {
    if (isAcquiringRef.current) return false;

    isAcquiringRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // First check if we already have a lock (from previous session)
      const checkResponse = await fetch(`/api/documents/${documentId}/lock`, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!checkResponse.ok) {
        clearTimeout(timeoutId);
        setError('Failed to check lock status');
        return false;
      }

      const checkData = await checkResponse.json();
      clearTimeout(timeoutId);

      // If we have our own lock, force release it first for clean state
      if (checkData.locked && checkData.isOwnLock) {
        try {
          await fetch(`/api/documents/${documentId}/lock`, {
            method: 'DELETE',
            signal: AbortSignal.timeout(5000),
          });
        } catch (err) {
          console.warn('Failed to clean up previous lock:', err);
        }
      }

      // Now try to acquire the lock
      const response = await fetch(`/api/documents/${documentId}/lock`, {
        method: 'POST',
        signal: AbortSignal.timeout(5000),
      });

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
  }, [documentId, onLockAcquired, onLockUnavailable, startHeartbeat]);

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
      if (hasLock) {
        // Best effort release - use fetch with keepalive for cleanup during unmount
        fetch(`/api/documents/${documentId}/lock`, {
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
    acquireLock,
    releaseLock,
    checkLockStatus,
  };
}
