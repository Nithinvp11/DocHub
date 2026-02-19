'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface RecentDocument {
  id: string;
  title: string;
  path: string;
  emoji?: string | null;
  status: string;
  viewedAt: Date;
  workspace: {
    id: string;
    name: string;
  };
}

interface RecentDocumentsProps {
  workspaceId?: string;
  limit?: number;
  className?: string;
}

export function RecentDocuments({
  workspaceId,
  limit = 10,
  className,
}: RecentDocumentsProps) {
  const [documents, setDocuments] = useState<RecentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentDocuments();
  }, [workspaceId, limit]);

  const fetchRecentDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (workspaceId) params.append('workspaceId', workspaceId);
      if (limit) params.append('limit', limit.toString());

      const response = await fetch(`/api/recent-documents?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent documents');
      }

      const data = await response.json();
      setDocuments(data.documents);
    } catch (err) {
      console.error('Error fetching recent documents:', err);
      setError('Failed to load recent documents');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-sm text-destructive py-4 px-2', className)}>
        {error}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground py-8 px-2 text-center', className)}>
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No recent documents</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {documents.map((doc) => (
        <Link
          key={doc.id}
          href={`/dashboard/${doc.workspace.id}/documents/${doc.id}`}
          className="block px-3 py-2 rounded-md hover:bg-accent transition-colors group"
        >
          <div className="flex items-start gap-2">
            <div className="mt-0.5 shrink-0">
              {doc.emoji ? (
                <span className="text-base">{doc.emoji}</span>
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate group-hover:text-primary">
                {doc.title}
              </div>
              
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span className="truncate">{doc.workspace.name}</span>
                <span>•</span>
                <span className="shrink-0">
                  {formatDistanceToNow(new Date(doc.viewedAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// Hook to track document views
export function useTrackDocumentView(documentId: string | undefined) {
  useEffect(() => {
    if (!documentId) return;

    const trackView = async () => {
      try {
        await fetch('/api/recent-documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId }),
        });
      } catch (error) {
        console.error('Failed to track document view:', error);
      }
    };

    // Track view after a short delay (user actually viewing, not just passing through)
    const timer = setTimeout(trackView, 2000);
    return () => clearTimeout(timer);
  }, [documentId]);
}
