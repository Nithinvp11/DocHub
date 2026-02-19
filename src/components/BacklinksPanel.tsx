'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface DocumentLink {
  id: string;
  document: {
    id: string;
    title: string;
    path: string;
    emoji?: string | null;
    status: string;
  };
  targetPath?: string;
  createdAt: Date;
}

interface BacklinksPanelProps {
  documentId: string;
  workspaceId: string;
  className?: string;
}

export function BacklinksPanel({
  documentId,
  workspaceId,
  className,
}: BacklinksPanelProps) {
  const [incomingLinks, setIncomingLinks] = useState<DocumentLink[]>([]);
  const [outgoingLinks, setOutgoingLinks] = useState<DocumentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLinks();
  }, [documentId]);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/documents/${documentId}/links`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch document links');
      }

      const data = await response.json();
      setIncomingLinks(data.incoming || []);
      setOutgoingLinks(data.outgoing || []);
    } catch (err) {
      console.error('Error fetching document links:', err);
      setError('Failed to load links');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive py-4">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalLinks = incomingLinks.length + outgoingLinks.length;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Links</span>
          <Badge variant="secondary" className="text-xs">
            {totalLinks}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Backlinks (Incoming) */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Backlinks ({incomingLinks.length})
            </h3>
          </div>

          {incomingLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No documents link to this page
            </p>
          ) : (
            <div className="space-y-2">
              {incomingLinks.map((link) => (
                <Link
                  key={link.id}
                  href={`/dashboard/${workspaceId}/documents/${link.document.id}`}
                  className="block p-2 rounded-md hover:bg-accent transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <div className="shrink-0">
                      {link.document.emoji ? (
                        <span className="text-base">{link.document.emoji}</span>
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate group-hover:text-primary">
                        {link.document.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {link.document.path}
                      </div>
                    </div>

                    <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Outgoing Links */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Linked Documents ({outgoingLinks.length})
            </h3>
          </div>

          {outgoingLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No outgoing links from this page
            </p>
          ) : (
            <div className="space-y-2">
              {outgoingLinks.map((link) => (
                <div key={link.id} className="p-2 rounded-md border border-border">
                  {link.document ? (
                    <Link
                      href={`/dashboard/${workspaceId}/documents/${link.document.id}`}
                      className="flex items-center gap-2 group"
                    >
                      <div className="shrink-0">
                        {link.document.emoji ? (
                          <span className="text-base">{link.document.emoji}</span>
                        ) : (
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate group-hover:text-primary">
                          {link.document.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {link.document.path}
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-muted-foreground truncate">
                          [[{link.targetPath}]]
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Document not found
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
