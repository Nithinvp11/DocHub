'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Users, Eye, Edit3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface PresenceUser {
  userId: string;
  userName: string | null;
  userEmail: string;
  userImage: string | null;
  isEditing: boolean;
  lastSeen: Date;
  cursorPosition?: { x: number; y: number };
}

interface UserPresenceAvatarsProps {
  documentId: string;
  workspaceId: string;
  currentUserId: string;
  maxVisible?: number;
  showCursors?: boolean;
  className?: string;
}

export function UserPresenceAvatars({
  documentId,
  workspaceId,
  currentUserId,
  maxVisible = 5,
  showCursors = false,
  className = '',
}: UserPresenceAvatarsProps) {
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Colors for user cursors/indicators
  const userColors = [
    'rgb(239, 68, 68)', // red
    'rgb(59, 130, 246)', // blue
    'rgb(16, 185, 129)', // green
    'rgb(245, 158, 11)', // amber
    'rgb(139, 92, 246)', // purple
    'rgb(236, 72, 153)', // pink
    'rgb(20, 184, 166)', // teal
    'rgb(251, 146, 60)', // orange
  ];

  const getUserColor = (userId: string) => {
    const index =
      Math.abs(userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) %
      userColors.length;
    return userColors[index];
  };

  // Fetch presence data
  useEffect(() => {
    const fetchPresence = async () => {
      try {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/documents/${documentId}/presence`
        );
        if (response.ok) {
          const data = await response.json();
          setPresenceUsers(data.users.filter((u: PresenceUser) => u.userId !== currentUserId));
        }
      } catch (error) {
        console.error('Failed to fetch presence:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPresence();

    // Poll for presence updates every 10 seconds
    const interval = setInterval(fetchPresence, 10000);

    return () => clearInterval(interval);
  }, [documentId, workspaceId, currentUserId]);

  // Get user initials
  const getInitials = (user: PresenceUser) => {
    const name = user.userName || user.userEmail.split('@')[0];
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get display name
  const getDisplayName = (user: PresenceUser) => {
    return user.userName || user.userEmail.split('@')[0];
  };

  // Check if user is recently active (within last 2 minutes)
  const isRecentlyActive = (lastSeen: Date) => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    return new Date(lastSeen) > twoMinutesAgo;
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-8 w-8 animate-pulse rounded-full border-2 border-white bg-gray-200 dark:border-gray-900 dark:bg-gray-700"
            />
          ))}
        </div>
      </div>
    );
  }

  if (presenceUsers.length === 0) {
    return null;
  }

  const visibleUsers = presenceUsers.slice(0, maxVisible);
  const hiddenCount = presenceUsers.length - maxVisible;
  const editingUsers = presenceUsers.filter((u) => u.isEditing);
  const viewingUsers = presenceUsers.filter((u) => !u.isEditing);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <TooltipProvider>
        {/* Presence Avatars */}
        <div className="flex items-center">
          <AnimatePresence mode="popLayout">
            <div className="flex -space-x-2">
              {visibleUsers.map((user, index) => (
                <motion.div
                  key={user.userId}
                  initial={{ opacity: 0, scale: 0, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0, x: 20 }}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                    delay: index * 0.05,
                  }}
                  style={{ zIndex: visibleUsers.length - index }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative">
                        <Avatar
                          className="h-8 w-8 cursor-pointer border-2 border-white ring-2 transition-transform hover:z-50 hover:scale-110 dark:border-gray-900"
                          style={
                            {
                              '--tw-ring-color': getUserColor(user.userId),
                            } as React.CSSProperties
                          }
                        >
                          <AvatarImage src={user.userImage || undefined} />
                          <AvatarFallback
                            className="text-xs font-semibold"
                            style={{
                              backgroundColor: getUserColor(user.userId) + '20',
                              color: getUserColor(user.userId),
                            }}
                          >
                            {getInitials(user)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Status Indicator */}
                        <span
                          className={`absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-gray-900 ${
                            isRecentlyActive(user.lastSeen) ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        >
                          {isRecentlyActive(user.lastSeen) && (
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                          )}
                        </span>

                        {/* Editing Indicator */}
                        {user.isEditing && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-amber-500 dark:border-gray-900">
                            <Edit3 className="h-2.5 w-2.5 text-white" />
                          </span>
                        )}
                      </div>
                    </TooltipTrigger>

                    <TooltipContent
                      side="bottom"
                      className="space-y-2 p-3"
                      style={{
                        borderLeft: `3px solid ${getUserColor(user.userId)}`,
                      }}
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{getDisplayName(user)}</p>
                        <p className="text-muted-foreground text-xs">{user.userEmail}</p>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        {user.isEditing ? (
                          <>
                            <Edit3 className="h-3 w-3 text-amber-500" />
                            <span className="font-medium text-amber-600 dark:text-amber-400">
                              Currently editing
                            </span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 text-blue-500" />
                            <span className="text-blue-600 dark:text-blue-400">Viewing</span>
                          </>
                        )}
                      </div>

                      <p className="text-muted-foreground text-xs">
                        Last seen{' '}
                        {formatDistanceToNow(new Date(user.lastSeen), {
                          addSuffix: true,
                        })}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              ))}

              {/* Overflow indicator */}
              {hiddenCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Avatar className="h-8 w-8 cursor-pointer border-2 border-white bg-gray-100 transition-transform hover:scale-110 dark:border-gray-900 dark:bg-gray-800">
                        <AvatarFallback className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                          +{hiddenCount}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">
                      {hiddenCount} more {hiddenCount === 1 ? 'user' : 'users'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </AnimatePresence>
        </div>

        {/* Summary Badge */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="cursor-pointer gap-1.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Users className="h-3 w-3" />
              <span className="text-xs font-medium">{presenceUsers.length}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="space-y-2">
            {editingUsers.length > 0 && (
              <div className="space-y-1">
                <p className="flex items-center gap-1 text-xs font-semibold">
                  <Edit3 className="h-3 w-3 text-amber-500" />
                  Editing ({editingUsers.length})
                </p>
                <ul className="text-muted-foreground space-y-0.5 text-xs">
                  {editingUsers.map((user) => (
                    <li key={user.userId}>• {getDisplayName(user)}</li>
                  ))}
                </ul>
              </div>
            )}
            {viewingUsers.length > 0 && (
              <div className="space-y-1">
                <p className="flex items-center gap-1 text-xs font-semibold">
                  <Eye className="h-3 w-3 text-blue-500" />
                  Viewing ({viewingUsers.length})
                </p>
                <ul className="text-muted-foreground space-y-0.5 text-xs">
                  {viewingUsers.map((user) => (
                    <li key={user.userId}>• {getDisplayName(user)}</li>
                  ))}
                </ul>
              </div>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* User Cursors (if enabled) */}
      {showCursors &&
        presenceUsers
          .filter((u) => u.cursorPosition)
          .map((user) => (
            <div
              key={`cursor-${user.userId}`}
              className="pointer-events-none fixed z-50"
              style={{
                left: user.cursorPosition!.x,
                top: user.cursorPosition!.y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <div
                  className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-white shadow-lg"
                  style={{
                    backgroundColor: getUserColor(user.userId),
                  }}
                >
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={user.userImage || undefined} />
                    <AvatarFallback className="text-[8px]">{getInitials(user)}</AvatarFallback>
                  </Avatar>
                  <span>{getDisplayName(user)}</span>
                </div>
              </motion.div>
            </div>
          ))}
    </div>
  );
}
