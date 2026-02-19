'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, MoreVertical, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=10');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/notifications/count');
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    intervalRef.current = setInterval(() => {
      fetchUnreadCount();
      // Also refresh full list if dropdown is open
      if (open) {
        fetchNotifications();
      }
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [open]);

  // Refetch when dropdown opens
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  const markAsUnread = async (notificationId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId], markAsRead: false }),
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
      toast.success('Marked as unread');
    } catch (error) {
      toast.error('Failed to mark as unread');
    }
  };
  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate to the link (handles all notification types including invite pages)
    if (notification.link) {
      let targetLink = notification.link;

      // Fix old invite notification links that point to settings
      if (
        (notification.type === 'WORKSPACE_INVITE_ACCEPTED' ||
          notification.type === 'WORKSPACE_INVITE_REJECTED') &&
        targetLink.includes('/settings')
      ) {
        // Extract workspace ID from the link and redirect to workspace page
        const workspaceIdMatch = targetLink.match(/\/dashboard\/([^\/]+)/);
        if (workspaceIdMatch && workspaceIdMatch[1]) {
          targetLink = `/dashboard/${workspaceIdMatch[1]}`;
        }
      }

      router.push(targetLink);
      setOpen(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      CONNECTION_REQUEST: '🤝',
      CONNECTION_ACCEPTED: '✅',
      WORKSPACE_INVITE: '�',
      WORKSPACE_INVITE_RECEIVED: '📨',
      WORKSPACE_INVITE_ACCEPTED: '✅',
      WORKSPACE_INVITE_REJECTED: '❌',
      WORKSPACE_INVITE_CANCELLED: '🚫',
      FEEDBACK_RECEIVED: '📝',
      DOCUMENT_SHARED: '📄',
      COMMENT_MENTION: '💬',
      VERSION_CONFLICT: '⚠️',
      GITHUB_PR_REVIEW: '🔄',
      GITHUB_ISSUE_ASSIGNED: '📋',
    };
    return icons[type] || '🔔';
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Open notifications"
            className="relative rounded-xl border border-white/10 bg-slate-800/50 p-2.5 shadow-sm backdrop-blur-xl transition-all hover:border-white/20 hover:bg-slate-800/70 hover:shadow-lg hover:shadow-purple-500/10"
          >
            <Bell className="h-5 w-5 text-slate-300 transition-colors hover:text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-rose-600 text-xs font-bold text-white shadow-lg ring-2 shadow-red-500/50 ring-slate-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-96 overflow-hidden rounded-xl border-white/10 bg-slate-900/95 p-0 shadow-2xl shadow-purple-500/20 backdrop-blur-2xl"
        >
          <div className="border-b border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="h-auto rounded-lg px-3 py-1.5 text-xs text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
                >
                  Mark all read
                </Button>
              )}
            </div>
            {unreadCount > 0 && (
              <p className="mt-1 text-xs text-slate-400">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/50">
                <Bell className="h-6 w-6 text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-400">No notifications</p>
              <p className="mt-1 text-xs text-slate-500">You&apos;re all caught up!</p>
            </div>
          ) : (
            <div className="scrollbar-thin scrollbar-track-slate-900/20 scrollbar-thumb-slate-700/50 hover:scrollbar-thumb-slate-600/50 max-h-[500px] overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group relative flex w-full items-start gap-3 border-b border-white/5 p-4 transition-all last:border-0 hover:bg-white/5 ${
                    !notification.read ? 'bg-purple-500/5' : ''
                  }`}
                >
                  <button
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800/50 text-base">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white group-hover:text-purple-300">
                          {notification.title}
                        </p>
                        {(notification.type === 'WORKSPACE_INVITE' ||
                          notification.type === 'WORKSPACE_INVITE_RECEIVED' ||
                          notification.type === 'WORKSPACE_INVITE_CANCELLED') && (
                          <Badge
                            variant="secondary"
                            className="h-5 bg-purple-500/20 text-xs text-purple-400"
                          >
                            Invite
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
                    )}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        aria-label="Notification actions"
                        className="rounded-lg p-1 opacity-0 transition-all group-hover:opacity-100 hover:bg-white/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4 text-slate-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {notification.read ? (
                        <DropdownMenuItem onClick={(e) => markAsUnread(notification.id, e)}>
                          Mark as unread
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          Mark as read
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
