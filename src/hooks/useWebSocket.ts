'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

export interface PresenceData {
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  documentId?: string;
  workspaceId?: string;
  cursor?: {
    x: number;
    y: number;
    selection?: { start: number; end: number };
  };
  lastSeen: Date;
}

export interface TypingIndicator {
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  documentId: string;
  isTyping: boolean;
}

export function useWebSocket() {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [presence, setPresence] = useState<Map<string, PresenceData>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    const socketInstance = io({
      path: '/api/socket',
      auth: {
        token: 'your-auth-token', // Replace with actual session token
        userId: session.user.id,
      },
    });

    socketInstance.on('connect', () => {
      console.log('[WebSocket] Connected');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
      setConnected(false);

      // Attempt reconnection after delay
      reconnectTimeoutRef.current = setTimeout(() => {
        socketInstance.connect();
      }, 3000);
    });

    socketInstance.on('presence:initial', (initialPresence: PresenceData[]) => {
      const presenceMap = new Map<string, PresenceData>();
      initialPresence.forEach((p) => presenceMap.set(p.userId, p));
      setPresence(presenceMap);
    });

    socketInstance.on('presence:update', (data: PresenceData) => {
      setPresence((prev) => new Map(prev).set(data.userId, data));
    });

    socketInstance.on('presence:offline', ({ userId }: { userId: string }) => {
      setPresence((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
    });

    // Set socket after all event handlers are registered
    setTimeout(() => setSocket(socketInstance), 0);

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socketInstance.disconnect();
    };
  }, [session?.user?.id]);

  return { socket, connected, presence };
}

export function useDocumentCollaboration(documentId: string) {
  const { socket, connected } = useWebSocket();
  const [subscribers, setSubscribers] = useState<PresenceData[]>([]);
  const [cursors, setCursors] = useState<Map<string, PresenceData['cursor']>>(new Map());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!socket || !connected || !documentId) return;

    // Join document
    socket.emit('document:join', documentId);

    // Listen for subscribers
    socket.on('document:subscribers', (subs: PresenceData[]) => {
      setSubscribers(subs);
    });

    // Listen for user join/leave
    socket.on('user:joined', ({ userId }: { userId: string }) => {
      console.log(`[Collaboration] User ${userId} joined document`);
    });

    socket.on('user:left', ({ userId }: { userId: string }) => {
      setCursors((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    // Listen for cursor updates
    socket.on('cursor:update', (data: { userId: string; cursor: PresenceData['cursor'] }) => {
      setCursors((prev) => new Map(prev).set(data.userId, data.cursor));
    });

    // Listen for typing indicators
    socket.on('typing:indicator', (data: TypingIndicator) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (data.isTyping) {
          next.add(data.userId);
        } else {
          next.delete(data.userId);
        }
        return next;
      });
    });

    // Listen for document updates
    socket.on('document:updated', (data: { documentId: string; content: string; delta?: unknown }) => {
      console.log('[Collaboration] Document updated by another user', data);
    });

    return () => {
      socket.emit('document:leave', documentId);
      socket.off('document:subscribers');
      socket.off('user:joined');
      socket.off('user:left');
      socket.off('cursor:update');
      socket.off('typing:indicator');
      socket.off('document:updated');
    };
  }, [socket, connected, documentId]);

  const updateCursor = useCallback(
    (cursor: PresenceData['cursor']) => {
      if (socket && connected) {
        socket.emit('cursor:move', { documentId, cursor });
      }
    },
    [socket, connected, documentId]
  );

  const startTyping = useCallback(() => {
    if (socket && connected) {
      socket.emit('typing:start', documentId);
    }
  }, [socket, connected, documentId]);

  const stopTyping = useCallback(() => {
    if (socket && connected) {
      socket.emit('typing:stop', documentId);
    }
  }, [socket, connected, documentId]);

  const broadcastUpdate = useCallback(
    (content: string, delta?: unknown) => {
      if (socket && connected) {
        socket.emit('document:update', { documentId, content, delta });
      }
    },
    [socket, connected, documentId]
  );

  return {
    subscribers,
    cursors,
    typingUsers,
    updateCursor,
    startTyping,
    stopTyping,
    broadcastUpdate,
  };
}

export function useWorkspacePresence(workspaceId: string) {
  const { socket, connected } = useWebSocket();
  const [members, setMembers] = useState<PresenceData[]>([]);

  useEffect(() => {
    if (!socket || !connected || !workspaceId) return;

    // Join workspace
    socket.emit('workspace:join', workspaceId);

    socket.on('workspace:subscribers', (subs: PresenceData[]) => {
      setMembers(subs);
    });

    socket.on('user:joined:workspace', ({ userId }: { userId: string }) => {
      console.log(`[Workspace] User ${userId} joined`);
    });

    socket.on('user:left:workspace', ({ userId }: { userId: string }) => {
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    });

    return () => {
      socket.emit('workspace:leave', workspaceId);
      socket.off('workspace:subscribers');
      socket.off('user:joined:workspace');
      socket.off('user:left:workspace');
    };
  }, [socket, connected, workspaceId]);

  return { members };
}
