'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  FileText,
  MessageSquare,
  GitPullRequest,
  AlertCircle,
  Users,
  GitMerge,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Trash2,
  Upload,
  Download,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Activity {
  id: string;
  type: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
  actorName?: string | null;
  actorEmail?: string | null;
  actorImage?: string | null;
  workspaceName?: string | null;
  actor: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
}

interface ActivityFeedProps {
  workspaceId: string;
  limit?: number;
  className?: string;
  showFilters?: boolean;
  showSearch?: boolean;
}

type ActivityFilter = 'all' | 'documents' | 'members' | 'github' | 'comments';

export function ActivityFeed({
  workspaceId,
  limit = 50,
  className = '',
  showFilters = true,
  showSearch = true,
}: ActivityFeedProps) {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchActivities = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/activity?workspaceId=${workspaceId}&limit=${limit}&page=${pageNum}`
        );
        if (!response.ok) throw new Error('Failed to fetch activities');
        const data = await response.json();

        if (append) {
          setActivities((prev) => [...prev, ...data.activities]);
        } else {
          setActivities(data.activities);
        }

        setHasMore(data.activities.length === limit);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load activities');
      } finally {
        setLoading(false);
      }
    },
    [workspaceId, limit]
  );

  // Setup infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setPage((prev) => prev + 1);
      }
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, loading]);

  // Fetch more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchActivities(page, true);
    }
  }, [page, fetchActivities]);

  // Initial fetch and reset on filter change
  useEffect(() => {
    setPage(1);
    fetchActivities(1, false);
  }, [fetchActivities, filter]);

  // Filter activities by type
  const filterActivities = (activities: Activity[]): Activity[] => {
    let filtered = activities;

    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter((activity) => {
        if (filter === 'documents') {
          return [
            'DOCUMENT_CREATED',
            'DOCUMENT_UPDATED',
            'DOCUMENT_DELETED',
            'VERSION_CREATED',
          ].includes(activity.type);
        }
        if (filter === 'members') {
          return ['MEMBER_ADDED', 'MEMBER_REMOVED'].includes(activity.type);
        }
        if (filter === 'github') {
          return activity.type.startsWith('GITHUB_');
        }
        if (filter === 'comments') {
          return ['COMMENT_ADDED', 'COMMENT_RESOLVED'].includes(activity.type);
        }
        return true;
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((activity) => {
        const actorName = (
          activity.actor?.name ||
          activity.actor?.email ||
          activity.actorName ||
          activity.actorEmail ||
          ''
        ).toLowerCase();
        const message = getActivitySearchText(activity).toLowerCase();
        return actorName.includes(query) || message.includes(query);
      });
    }

    return filtered;
  };

  const getActivitySearchText = (activity: Activity): string => {
    const metadata = activity.metadata || {};
    return [
      activity.type,
      metadata.title || '',
      metadata.message || '',
      metadata.repoName || '',
    ].join(' ');
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'DOCUMENT_CREATED':
      case 'DOCUMENT_UPDATED':
        return <FileText className="text-blue-500" size={20} />;
      case 'DOCUMENT_DELETED':
        return <Trash2 className="text-red-500" size={20} />;
      case 'VERSION_CREATED':
        return <Clock className="text-purple-500" size={20} />;
      case 'COMMENT_ADDED':
      case 'COMMENT_RESOLVED':
        return <MessageSquare className="text-green-500" size={20} />;
      case 'GITHUB_PR_OPENED':
      case 'GITHUB_PR_CLOSED':
        return <GitPullRequest className="text-orange-500" size={20} />;
      case 'GITHUB_PR_MERGED':
        return <GitMerge className="text-purple-600" size={20} />;
      case 'GITHUB_ISSUE_OPENED':
        return <AlertCircle className="text-red-500" size={20} />;
      case 'GITHUB_ISSUE_CLOSED':
        return <CheckCircle2 className="text-green-600" size={20} />;
      case 'GITHUB_IMPORT':
        return <Download className="text-indigo-500" size={20} />;
      case 'GITHUB_EXPORT':
        return <Upload className="text-indigo-500" size={20} />;
      case 'MEMBER_ADDED':
      case 'MEMBER_REMOVED':
        return <Users className="text-indigo-500" size={20} />;
      default:
        return <FileText className="text-gray-500" size={20} />;
    }
  };

  const getActivityMessage = (activity: Activity) => {
    const actorName =
      activity.actor?.name ||
      activity.actor?.email ||
      activity.actorName ||
      activity.actorEmail ||
      'A user';
    const metadata = activity.metadata || {};

    switch (activity.type) {
      case 'DOCUMENT_CREATED':
        return (
          <>
            <strong>{actorName}</strong> created document{' '}
            <span className="font-medium text-blue-600">{String(metadata.title || '')}</span>
          </>
        );
      case 'DOCUMENT_UPDATED':
        return (
          <>
            <strong>{actorName}</strong> updated document{' '}
            <span className="font-medium text-blue-600">{String(metadata.title || '')}</span>
          </>
        );
      case 'VERSION_CREATED':
        return (
          <>
            <strong>{actorName}</strong> created a new version:{' '}
            <span className="italic">{String(metadata.message || '')}</span>
          </>
        );
      case 'COMMENT_ADDED':
        return (
          <>
            <strong>{actorName}</strong> added a comment
          </>
        );
      case 'COMMENT_RESOLVED':
        return (
          <>
            <strong>{actorName}</strong> resolved a comment
          </>
        );
      case 'GITHUB_PR_OPENED':
        return (
          <>
            <strong>{actorName}</strong> opened PR #{String(metadata.prNumber || '')}:{' '}
            <span className="font-medium">{String(metadata.title || '')}</span> in{' '}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
              {String(metadata.repoName || '')}
            </code>
          </>
        );
      case 'GITHUB_PR_MERGED':
        return (
          <>
            <strong>{actorName}</strong> merged PR #{String(metadata.prNumber || '')}:{' '}
            <span className="font-medium">{String(metadata.title || '')}</span> in{' '}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
              {String(metadata.repoName || '')}
            </code>
          </>
        );
      case 'GITHUB_PR_CLOSED':
        return (
          <>
            <strong>{actorName}</strong> closed PR #{String(metadata.prNumber || '')} in{' '}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
              {String(metadata.repoName || '')}
            </code>
          </>
        );
      case 'GITHUB_ISSUE_OPENED':
        return (
          <>
            <strong>{actorName}</strong> opened issue #{String(metadata.issueNumber || '')}:{' '}
            <span className="font-medium">{String(metadata.title || '')}</span> in{' '}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
              {String(metadata.repoName || '')}
            </code>
          </>
        );
      case 'GITHUB_ISSUE_CLOSED':
        return (
          <>
            <strong>{actorName}</strong> closed issue #{String(metadata.issueNumber || '')} in{' '}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
              {String(metadata.repoName || '')}
            </code>
          </>
        );
      case 'GITHUB_REPO_SYNCED':
        return (
          <>
            <strong>{actorName}</strong> synced{' '}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
              {String(metadata.repoName || '')}
            </code>{' '}
            ({String(metadata.syncedCount || 0)} items, {String(metadata.newPRs || 0)} new)
          </>
        );
      case 'DOCUMENT_DELETED':
        return (
          <>
            <strong>{actorName}</strong> deleted document{' '}
            <span className="font-medium text-red-600">{String(metadata.title || '')}</span>
          </>
        );
      case 'GITHUB_IMPORT':
        return (
          <>
            <strong>{actorName}</strong> imported{' '}
            <span className="font-medium">{String(metadata.filesImported || 0)} file(s)</span> from{' '}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
              {String(metadata.repoName || metadata.repository || '')}
            </code>
          </>
        );
      case 'GITHUB_EXPORT':
        return (
          <>
            <strong>{actorName}</strong> exported{' '}
            <span className="font-medium">{String(metadata.filesExported || 0)} file(s)</span> to{' '}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
              {String(metadata.repoName || metadata.repository || '')}
            </code>
          </>
        );
      case 'MEMBER_ADDED':
        return (
          <>
            <strong>{actorName}</strong> added{' '}
            <span className="font-medium">
              {String(
                metadata.userName || metadata.userEmail || metadata.memberUserName || 'a member'
              )}
            </span>
          </>
        );
      case 'MEMBER_REMOVED':
        return (
          <>
            <strong>{actorName}</strong> removed from workspace{' '}
            <span className="font-medium text-red-600">
              {String(metadata.removedUserName || metadata.removedUserEmail || 'a member')}
            </span>
          </>
        );
      default:
        return (
          <>
            <strong>{actorName}</strong> performed an action
          </>
        );
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getActivityNavigationPath = (activity: Activity): string | null => {
    const metadata = activity.metadata || {};

    if (
      ['DOCUMENT_CREATED', 'DOCUMENT_UPDATED', 'DOCUMENT_DELETED'].includes(activity.type) &&
      activity.entityId
    ) {
      return `/dashboard/${workspaceId}/documents/${activity.entityId}`;
    }

    if (['VERSION_CREATED', 'COMMENT_ADDED', 'COMMENT_RESOLVED'].includes(activity.type)) {
      const documentId = String(metadata.documentId || '');
      if (documentId) {
        return `/dashboard/${workspaceId}/documents/${documentId}`;
      }
    }

    if (activity.type.startsWith('GITHUB_')) {
      return `/dashboard/${workspaceId}/settings/github`;
    }

    if (['MEMBER_ADDED', 'MEMBER_REMOVED'].includes(activity.type)) {
      return `/dashboard/${workspaceId}`;
    }

    return null;
  };

  const handleActivityClick = (activity: Activity) => {
    const path = getActivityNavigationPath(activity);
    if (!path) {
      toast.info('No detail page available for this activity yet.');
      return;
    }

    router.push(path);
  };

  const filteredActivities = filterActivities(activities);

  if (loading && page === 1) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex animate-pulse gap-3 rounded-lg border border-gray-100 p-4">
            <div className="h-10 w-10 rounded-full bg-gray-200" />
            <div className="flex-1">
              <div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`py-12 text-center ${className}`}>
        <AlertCircle className="mx-auto mb-3 text-red-500" size={40} />
        <p className="text-base font-medium text-red-600">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchActivities(1, false)}
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {showSearch && (
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search activity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          )}

          {showFilters && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {filter === 'all'
                    ? 'All Activity'
                    : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilter('all')}>
                  All Activity
                  {filter === 'all' && <CheckCircle2 className="ml-auto h-4 w-4 text-green-600" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('documents')}>
                  <FileText className="mr-2 h-4 w-4 text-blue-500" />
                  Documents
                  {filter === 'documents' && (
                    <CheckCircle2 className="ml-auto h-4 w-4 text-green-600" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('members')}>
                  <Users className="mr-2 h-4 w-4 text-indigo-500" />
                  Members
                  {filter === 'members' && (
                    <CheckCircle2 className="ml-auto h-4 w-4 text-green-600" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('github')}>
                  <GitPullRequest className="mr-2 h-4 w-4 text-orange-500" />
                  GitHub
                  {filter === 'github' && (
                    <CheckCircle2 className="ml-auto h-4 w-4 text-green-600" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('comments')}>
                  <MessageSquare className="mr-2 h-4 w-4 text-green-500" />
                  Comments
                  {filter === 'comments' && (
                    <CheckCircle2 className="ml-auto h-4 w-4 text-green-600" />
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {/* Activity List */}
      {filteredActivities.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <FileText className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="text-base font-medium text-gray-600">No activity found</p>
          <p className="mt-1 text-sm text-gray-400">
            {searchQuery
              ? 'Try adjusting your search or filters'
              : filter !== 'all'
                ? 'No activity for this filter'
                : "You're all caught up!"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              role="button"
              tabIndex={0}
              onClick={() => handleActivityClick(activity)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleActivityClick(activity);
                }
              }}
              className="group flex cursor-pointer items-start gap-3 rounded-lg border border-gray-100 p-4 transition-all hover:border-gray-200 hover:bg-gray-50/50 hover:shadow-sm"
            >
              {/* Actor Avatar */}
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage
                  src={activity.actor?.image || activity.actorImage || undefined}
                  alt={activity.actor?.name || activity.actorName || ''}
                />
                <AvatarFallback className="bg-linear-to-br from-blue-500 to-purple-600 text-xs font-semibold text-white">
                  {(
                    activity.actor?.name ||
                    activity.actor?.email ||
                    activity.actorName ||
                    activity.actorEmail ||
                    'A user'
                  )
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              {/* Activity Content */}
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed text-gray-900">
                  {getActivityMessage(activity)}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(activity.createdAt)}
                  </span>
                  <Badge variant="outline" className="gap-1 text-xs">
                    {getActivityIcon(activity.type)}
                    <span className="capitalize">
                      {activity.type.toLowerCase().replace(/_/g, ' ')}
                    </span>
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="py-4 text-center">
          {loading && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
              <span>Loading more...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
