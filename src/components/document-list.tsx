'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass-card';
import {
  DocumentFilters,
  DocumentFilters as IDocumentFilters,
} from '@/components/document-filters';
import { NoDocuments, NoSearchResults } from '@/components/EmptyStates';
import { DocumentLockIndicator } from '@/components/DocumentLockIndicator';
import { FileText, Clock, MessageSquare, GitBranch, ArrowRight, CheckCircle2 } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  path: string;
  phase: string;
  type: string;
  updatedAt: Date;
  githubPath?: string | null;
  githubSha?: string | null;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  syncInfo?: {
    syncStatus: string;
    lastSyncedAt: Date | null;
    autoSync: boolean;
  } | null;
  _count: {
    versions: number;
    comments: number;
  };
}

interface DocumentListProps {
  documents: Document[];
  workspaceId: string;
  canCreate: boolean;
}

export function DocumentList({ documents, workspaceId, canCreate }: DocumentListProps) {
  const [filters, setFilters] = useState<IDocumentFilters>({
    search: '',
    phase: 'ALL',
    type: 'ALL',
    author: 'ALL',
  });

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          doc.title.toLowerCase().includes(searchLower) ||
          doc.path.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Phase filter
      if (filters.phase !== 'ALL' && doc.phase !== filters.phase) {
        return false;
      }

      // Type filter
      if (filters.type !== 'ALL' && doc.type !== filters.type) {
        return false;
      }

      // Author filter
      if (filters.author !== 'ALL') {
        const authorMatch = doc.author.id === filters.author;
        if (!authorMatch) return false;
      }

      return true;
    });
  }, [documents, filters]);

  if (documents.length === 0) {
    return <NoDocuments onCreate={() => {}} />;
  }

  return (
    <div className="space-y-6">
      <DocumentFilters onFilterChange={setFilters} />

      {filteredDocuments.length === 0 ? (
        <NoSearchResults query={filters.search || ''} />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredDocuments.map((doc, index) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/dashboard/${workspaceId}/documents/${doc.id}`}>
                <GlassCard
                  hover
                  className="group h-full p-6 transition-all hover:border-purple-500/30"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                        <FileText className="h-6 w-6 text-purple-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="mb-1 line-clamp-1 font-bold text-white transition-colors group-hover:text-purple-400">
                          {doc.title}
                        </h3>
                        <p className="line-clamp-1 text-xs text-slate-500">{doc.path}</p>
                        {doc.githubPath && (
                          <div className="mt-1.5 space-y-1">
                            <div className="flex items-center gap-1.5 rounded bg-slate-800/50 px-2 py-1">
                              <GitBranch className="h-3 w-3 text-blue-400" />
                              <code className="truncate font-mono text-[10px] text-slate-400">
                                {doc.githubPath}
                              </code>
                            </div>
                            {doc.githubSha && (
                              <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                                <CheckCircle2 className="h-2.5 w-2.5 text-green-400" />
                                <span>Synced to GitHub</span>
                                <code className="text-slate-600">
                                  {doc.githubSha.substring(0, 7)}
                                </code>
                              </div>
                            )}
                          </div>
                        )}
                        {!doc.githubPath && (
                          <div className="mt-1.5">
                            <div className="flex items-center gap-1.5 text-[9px] text-slate-600">
                              <GitBranch className="h-2.5 w-2.5" />
                              <span>Not synced with GitHub</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <ArrowRight className="h-5 w-5 text-slate-600 transition-all group-hover:translate-x-1 group-hover:text-purple-400" />
                      <DocumentLockIndicator documentId={doc.id} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Phase and Type Badges */}
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                        {doc.phase.replace('_', ' ')}
                      </span>
                      <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400">
                        {doc.type.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                          <GitBranch className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{doc._count.versions}</p>
                          <p className="text-xs text-slate-500">Versions</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                          <MessageSquare className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{doc._count.comments}</p>
                          <p className="text-xs text-slate-500">Comments</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(doc.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <span className="max-w-[120px] truncate">
                        {doc.author.name || doc.author.email}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
