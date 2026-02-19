'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GitCommit, Clock, User, FileText, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Commit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    avatar?: string;
    date: string;
  };
  url: string;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
}

interface GitHubCommitHistoryProps {
  documentId: string;
  workspaceId: string;
  maxCommits?: number;
  showRestoreButton?: boolean;
  onRestore?: (commitSha: string) => Promise<void>;
}

export function GitHubCommitHistory({
  documentId,
  workspaceId,
  maxCommits = 20,
  showRestoreButton = true,
  onRestore,
}: GitHubCommitHistoryProps) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoringCommit, setRestoringCommit] = useState<string | null>(null);

  useEffect(() => {
    fetchCommits();
  }, [documentId]);

  const fetchCommits = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/github/commits?documentId=${documentId}&workspaceId=${workspaceId}&limit=${maxCommits}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch commits');
      }

      const data = await response.json();
      setCommits(data.commits || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load commits');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (commitSha: string) => {
    if (!onRestore) return;

    try {
      setRestoringCommit(commitSha);
      await onRestore(commitSha);
      // Refresh commits after restore
      await fetchCommits();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore commit');
    } finally {
      setRestoringCommit(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading commit history...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchCommits} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (commits.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <GitCommit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">No commit history available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCommit className="h-5 w-5" />
          GitHub Commit History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {commits.map((commit, index) => (
            <div
              key={commit.sha}
              className="flex gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
            >
              {/* Timeline Line */}
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary" />
                {index < commits.length - 1 && (
                  <div className="w-0.5 h-full bg-border mt-1" />
                )}
              </div>

              {/* Commit Info */}
              <div className="flex-1 space-y-2">
                {/* Author & Time */}
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={commit.author.avatar} />
                    <AvatarFallback>
                      {commit.author.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{commit.author.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(commit.author.date), { addSuffix: true })}
                  </span>
                </div>

                {/* Commit Message */}
                <p className="text-sm">{commit.message}</p>

                {/* Commit SHA & Stats */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Badge variant="outline" className="font-mono">
                    {commit.sha.substring(0, 7)}
                  </Badge>
                  
                  {commit.stats && (
                    <>
                      <span className="text-green-600">
                        +{commit.stats.additions}
                      </span>
                      <span className="text-red-600">
                        -{commit.stats.deletions}
                      </span>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(commit.url, '_blank')}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    View on GitHub
                  </Button>
                  
                  {showRestoreButton && onRestore && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(commit.sha)}
                      disabled={!!restoringCommit}
                    >
                      {restoringCommit === commit.sha ? (
                        <>
                          <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full mr-1" />
                          Restoring...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Restore
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
