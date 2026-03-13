import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from './prisma';

export interface SocketUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export interface PresenceData {
  userId: string;
  user: SocketUser;
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
  user: SocketUser;
  documentId: string;
  isTyping: boolean;
}

export class WebSocketManager {
  private io: SocketIOServer;
  private presence: Map<string, PresenceData> = new Map();
  private documentSubscriptions: Map<string, Set<string>> = new Map(); // documentId -> Set<socketId>
  private workspaceSubscriptions: Map<string, Set<string>> = new Map(); // workspaceId -> Set<socketId>
  private socketToUser: Map<string, string> = new Map(); // socketId -> userId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        credentials: true,
      },
      path: '/api/socket',
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', async (socket: Socket) => {
      console.log(`[WebSocket] Client connected: ${socket.id}`);

      // Authenticate user
      const session = await this.authenticateSocket(socket);
      if (!session) {
        socket.disconnect();
        return;
      }

      const userId = session.user.id;
      this.socketToUser.set(socket.id, userId);

      // Send initial presence data
      socket.emit('presence:initial', Array.from(this.presence.values()));

      // Handle presence updates
      socket.on('presence:update', (data: Partial<PresenceData>) => {
        this.handlePresenceUpdate(socket, userId, session.user, data);
      });

      // Handle document join/leave
      socket.on('document:join', (documentId: string) => {
        this.handleDocumentJoin(socket, documentId, userId);
      });

      socket.on('document:leave', (documentId: string) => {
        this.handleDocumentLeave(socket, documentId);
      });

      // Handle workspace join/leave
      socket.on('workspace:join', (workspaceId: string) => {
        this.handleWorkspaceJoin(socket, workspaceId, userId);
      });

      socket.on('workspace:leave', (workspaceId: string) => {
        this.handleWorkspaceLeave(socket, workspaceId);
      });

      // Handle cursor movement
      socket.on('cursor:move', (data: { documentId: string; cursor: PresenceData['cursor'] }) => {
        this.handleCursorMove(socket, userId, session.user, data);
      });

      // Handle typing indicators
      socket.on('typing:start', (documentId: string) => {
        this.handleTypingIndicator(socket, userId, session.user, documentId, true);
      });

      socket.on('typing:stop', (documentId: string) => {
        this.handleTypingIndicator(socket, userId, session.user, documentId, false);
      });

      // Handle document updates
      socket.on('document:update', async (data: { documentId: string; content: string; delta?: unknown }) => {
        await this.handleDocumentUpdate(socket, userId, data);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket, userId);
      });
    });
  }

  private async authenticateSocket(socket: Socket): Promise<{ user: SocketUser } | null> {
    try {
      // In a real implementation, you'd pass the session token via handshake
      // For now, we'll use a simplified approach
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      
      if (!token) {
        console.log('[WebSocket] No authentication token provided');
        return null;
      }

      // You'd verify the token here and extract user info
      // For now, returning a mock response - implement proper JWT verification
      const userId = socket.handshake.auth.userId;
      
      if (!userId) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      });

      if (!user) {
        return null;
      }

      return { user };
    } catch (error) {
      console.error('[WebSocket] Authentication error:', error);
      return null;
    }
  }

  private handlePresenceUpdate(
    socket: Socket,
    userId: string,
    user: SocketUser,
    data: Partial<PresenceData>
  ) {
    const presenceData: PresenceData = {
      userId,
      user,
      documentId: data.documentId,
      workspaceId: data.workspaceId,
      cursor: data.cursor,
      lastSeen: new Date(),
    };

    this.presence.set(userId, presenceData);

    // Broadcast to relevant subscribers
    if (data.documentId) {
      this.broadcastToDocument(data.documentId, 'presence:update', presenceData, socket.id);
    } else if (data.workspaceId) {
      this.broadcastToWorkspace(data.workspaceId, 'presence:update', presenceData, socket.id);
    } else {
      // Broadcast to all
      socket.broadcast.emit('presence:update', presenceData);
    }
  }

  private handleDocumentJoin(socket: Socket, documentId: string, userId: string) {
    // Add to document subscriptions
    if (!this.documentSubscriptions.has(documentId)) {
      this.documentSubscriptions.set(documentId, new Set());
    }
    this.documentSubscriptions.get(documentId)!.add(socket.id);

    // Join socket room
    socket.join(`document:${documentId}`);

    // Send current document subscribers
    const subscribers = this.getDocumentPresence(documentId);
    socket.emit('document:subscribers', subscribers);

    // Notify others
    socket.to(`document:${documentId}`).emit('user:joined', { userId, documentId });

    console.log(`[WebSocket] User ${userId} joined document ${documentId}`);
  }

  private handleDocumentLeave(socket: Socket, documentId: string) {
    const userId = this.socketToUser.get(socket.id);
    
    if (this.documentSubscriptions.has(documentId)) {
      this.documentSubscriptions.get(documentId)!.delete(socket.id);
    }

    socket.leave(`document:${documentId}`);

    if (userId) {
      socket.to(`document:${documentId}`).emit('user:left', { userId, documentId });
    }

    console.log(`[WebSocket] User ${userId} left document ${documentId}`);
  }

  private handleWorkspaceJoin(socket: Socket, workspaceId: string, userId: string) {
    if (!this.workspaceSubscriptions.has(workspaceId)) {
      this.workspaceSubscriptions.set(workspaceId, new Set());
    }
    this.workspaceSubscriptions.get(workspaceId)!.add(socket.id);

    socket.join(`workspace:${workspaceId}`);

    const subscribers = this.getWorkspacePresence(workspaceId);
    socket.emit('workspace:subscribers', subscribers);

    socket.to(`workspace:${workspaceId}`).emit('user:joined:workspace', { userId, workspaceId });

    console.log(`[WebSocket] User ${userId} joined workspace ${workspaceId}`);
  }

  private handleWorkspaceLeave(socket: Socket, workspaceId: string) {
    const userId = this.socketToUser.get(socket.id);
    
    if (this.workspaceSubscriptions.has(workspaceId)) {
      this.workspaceSubscriptions.get(workspaceId)!.delete(socket.id);
    }

    socket.leave(`workspace:${workspaceId}`);

    if (userId) {
      socket.to(`workspace:${workspaceId}`).emit('user:left:workspace', { userId, workspaceId });
    }

    console.log(`[WebSocket] User ${userId} left workspace ${workspaceId}`);
  }

  private handleCursorMove(
    socket: Socket,
    userId: string,
    user: SocketUser,
    data: { documentId: string; cursor: PresenceData['cursor'] }
  ) {
    const cursorData = {
      userId,
      user,
      documentId: data.documentId,
      cursor: data.cursor,
    };

    // Broadcast to document subscribers only
    socket.to(`document:${data.documentId}`).emit('cursor:update', cursorData);
  }

  private handleTypingIndicator(
    socket: Socket,
    userId: string,
    user: SocketUser,
    documentId: string,
    isTyping: boolean
  ) {
    const typingData: TypingIndicator = {
      userId,
      user,
      documentId,
      isTyping,
    };

    socket.to(`document:${documentId}`).emit('typing:indicator', typingData);
  }

  private async handleDocumentUpdate(
    socket: Socket,
    userId: string,
    data: { documentId: string; content: string; delta?: unknown }
  ) {
    try {
      // Verify user has access to document
      const document = await prisma.document.findFirst({
        where: {
          id: data.documentId,
          workspace: {
            members: {
              some: {
                userId,
              },
            },
          },
        },
      });

      if (!document) {
        socket.emit('error', { message: 'Access denied to document' });
        return;
      }

      // LOCK-AWARE: Don't broadcast content updates
      // With exclusive locks, only the lock holder can edit
      // Broadcasting content changes would confuse viewers who can't edit
      // Instead, notify that document is being actively edited
      socket.to(`document:${data.documentId}`).emit('document:editing', {
        documentId: data.documentId,
        userId,
        timestamp: new Date(),
      });

      console.log(`[WebSocket] Document ${data.documentId} being edited by user ${userId}`);
    } catch (error) {
      console.error('[WebSocket] Error handling document update:', error);
      socket.emit('error', { message: 'Failed to process document update' });
    }
  }

  private handleDisconnect(socket: Socket, userId: string) {
    console.log(`[WebSocket] Client disconnected: ${socket.id}`);

    // Remove from presence
    this.presence.delete(userId);

    // Remove from all subscriptions
    this.documentSubscriptions.forEach((sockets) => sockets.delete(socket.id));
    this.workspaceSubscriptions.forEach((sockets) => sockets.delete(socket.id));

    // Remove socket-user mapping
    this.socketToUser.delete(socket.id);

    // Broadcast user offline status
    this.io.emit('presence:offline', { userId });
  }

  private getDocumentPresence(documentId: string): PresenceData[] {
    const socketIds = this.documentSubscriptions.get(documentId) || new Set();
    const presence: PresenceData[] = [];

    socketIds.forEach((socketId) => {
      const userId = this.socketToUser.get(socketId);
      if (userId) {
        const data = this.presence.get(userId);
        if (data) {
          presence.push(data);
        }
      }
    });

    return presence;
  }

  private getWorkspacePresence(workspaceId: string): PresenceData[] {
    const socketIds = this.workspaceSubscriptions.get(workspaceId) || new Set();
    const presence: PresenceData[] = [];

    socketIds.forEach((socketId) => {
      const userId = this.socketToUser.get(socketId);
      if (userId) {
        const data = this.presence.get(userId);
        if (data) {
          presence.push(data);
        }
      }
    });

    return presence;
  }

  private broadcastToDocument(documentId: string, event: string, data: unknown, excludeSocketId?: string) {
    const room = `document:${documentId}`;
    if (excludeSocketId) {
      this.io.to(room).except(excludeSocketId).emit(event, data);
    } else {
      this.io.to(room).emit(event, data);
    }
  }

  private broadcastToWorkspace(workspaceId: string, event: string, data: unknown, excludeSocketId?: string) {
    const room = `workspace:${workspaceId}`;
    if (excludeSocketId) {
      this.io.to(room).except(excludeSocketId).emit(event, data);
    } else {
      this.io.to(room).emit(event, data);
    }
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

let wsManager: WebSocketManager | null = null;

export function initializeWebSocket(server: HTTPServer): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager(server);
    console.log('[WebSocket] Server initialized');
  }
  return wsManager;
}

export function getWebSocketManager(): WebSocketManager | null {
  return wsManager;
}
