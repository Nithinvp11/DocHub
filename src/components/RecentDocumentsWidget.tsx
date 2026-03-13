'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, FileText, FolderOpen, ExternalLink, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

interface RecentDocument {
  id: string;
  accessedAt: string;
  document: {
    id: string;
    title: string;
    path: string;
    emoji: string | null;
    type: string;
    status: string;
    updatedAt: string;
    workspace: {
      id: string;
      name: string;
    };
    author: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
    tags: {
      tag: {
        id: string;
        name: string;
        color: string;
      };
    }[];
    _count: {
      comments: number;
      versions: number;
    };
  };
}

interface RecentDocumentsWidgetProps {
  limit?: number;
  workspaceId?: string;
  showHeader?: boolean;
  compact?: boolean;
}

export default function RecentDocumentsWidget({
  limit = 5,
  workspaceId,
  showHeader = true,
  compact = false,
}: RecentDocumentsWidgetProps) {
  const [documents, setDocuments] = useState<RecentDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentDocuments();
  }, [limit, workspaceId]);

  const fetchRecentDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(workspaceId && { workspaceId }),
      });

      const response = await fetch(`/api/recent?${params}`);

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error('Failed to fetch recent documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'IN_REVIEW':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {showHeader && (
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-9 w-24" />
          </div>
        )}
        {[...Array(limit)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <div className="bg-muted mb-4 inline-flex rounded-full p-4">
          <Clock className="text-muted-foreground h-8 w-8" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">No recent documents</h3>
        <p className="text-muted-foreground text-sm">Documents you access will appear here</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      {showHeader && (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Recent Documents</h2>
              <p className="text-muted-foreground text-sm">
                Quick access to your recently viewed docs
              </p>
            </div>
          </div>
          <Link href="/recent">
            <Button variant="ghost" size="sm" className="gap-2">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Documents List */}
      <div className={compact ? 'space-y-2' : 'space-y-3'}>
        {documents.map((recent, index) => (
          <motion.div
            key={recent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              href={`/workspace/${recent.document.workspace.id}/document/${recent.document.id}`}
            >
              <Card className="group hover:border-primary/50 transition-all duration-200 hover:shadow-md">
                <CardContent className={compact ? 'p-3' : 'p-4'}>
                  <div className="flex items-center gap-3">
                    {/* Icon/Emoji */}
                    <div
                      className={`${
                        compact ? 'h-10 w-10' : 'h-12 w-12'
                      } from-primary/10 to-primary/5 flex flex-shrink-0 items-center justify-center rounded-lg bg-linear-to-br`}
                    >
                      {recent.document.emoji ? (
                        <span className={compact ? 'text-xl' : 'text-2xl'}>
                          {recent.document.emoji}
                        </span>
                      ) : (
                        <FileText
                          className={`${compact ? 'h-5 w-5' : 'h-6 w-6'} text-muted-foreground`}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      {/* Title */}
                      <h3
                        className={`${
                          compact ? 'text-sm' : 'text-base'
                        } group-hover:text-primary mb-1 line-clamp-1 font-semibold transition-colors`}
                      >
                        {recent.document.title}
                      </h3>

                      {/* Metadata */}
                      <div className="text-muted-foreground flex items-center gap-3 text-xs">
                        {/* Workspace */}
                        <div className="flex items-center gap-1">
                          <FolderOpen className="h-3 w-3" />
                          <span className="max-w-[120px] truncate">
                            {recent.document.workspace.name}
                          </span>
                        </div>

                        {/* Time */}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(recent.accessedAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Tags & Status (non-compact) */}
                      {!compact && (
                        <div className="mt-2 flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={`${getStatusColor(recent.document.status)} text-xs`}
                          >
                            {recent.document.status.replace('_', ' ')}
                          </Badge>

                          {recent.document.tags.length > 0 && (
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: recent.document.tags[0].tag.color,
                                color: recent.document.tags[0].tag.color,
                              }}
                              className="text-xs"
                            >
                              {recent.document.tags[0].tag.name}
                            </Badge>
                          )}
                          {recent.document.tags.length > 1 && (
                            <span className="text-muted-foreground text-xs">
                              +{recent.document.tags.length - 1}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Icon */}
                    <div className="opacity-0 transition-opacity group-hover:opacity-100">
                      <ExternalLink className="text-muted-foreground h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
