'use client';

import { SearchComponent } from '@/components/SearchComponent';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { GlassCard } from '@/components/ui/glass-card';
import { Search as SearchIcon, Sparkles, Zap } from 'lucide-react';

export default function SearchPage() {
  return (
    <AuroraBackground showGrids showGlowOrbs>
      <div className="min-h-screen">
        <div className="container mx-auto max-w-5xl px-4 py-12">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="mb-6 flex items-center justify-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-purple-500 to-fuchsia-600 shadow-lg shadow-purple-500/30">
                <SearchIcon className="h-8 w-8 text-white" />
              </div>
              <h1 className="bg-linear-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-5xl font-bold text-transparent">
                Search
              </h1>
            </div>
            <p className="text-lg text-slate-300">
              Find documents, workspaces, and content across your entire knowledge base
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-12">
            <SearchComponent autoFocus />
          </div>

          {/* Features */}
          <div className="mb-12 grid gap-6 md:grid-cols-3">
            <GlassCard className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
                  <Zap className="h-5 w-5 text-yellow-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Instant Results</h3>
              </div>
              <p className="text-sm text-slate-400">
                Get real-time search results as you type, with smart relevance ranking
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Smart Highlighting</h3>
              </div>
              <p className="text-sm text-slate-400">
                See exactly where your search terms appear in titles, content, and paths
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                  <SearchIcon className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Comprehensive</h3>
              </div>
              <p className="text-sm text-slate-400">
                Search across documents, workspaces, tags, and metadata in one place
              </p>
            </GlassCard>
          </div>

          {/* Search Tips */}
          <GlassCard className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Search Tips</h2>
              <p className="text-sm text-slate-400">Get the most out of your search</p>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 font-semibold text-white">Basic Search</h3>
                <p className="text-sm text-slate-400">
                  Simply type keywords to find matching documents. The search looks through titles,
                  content, and file paths.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-white">Keyboard Shortcuts</h3>
                <ul className="list-inside list-disc space-y-2 text-sm text-slate-400">
                  <li>
                    <kbd className="rounded border border-white/20 bg-white/5 px-2 py-1 text-xs text-white">
                      Ctrl+K
                    </kbd>{' '}
                    or{' '}
                    <kbd className="rounded border border-white/20 bg-white/5 px-2 py-1 text-xs text-white">
                      ⌘+K
                    </kbd>{' '}
                    - Focus search bar
                  </li>
                  <li>
                    <kbd className="rounded border border-white/20 bg-white/5 px-2 py-1 text-xs text-white">
                      Esc
                    </kbd>{' '}
                    - Close search results
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-white">Relevance Ranking</h3>
                <p className="text-sm text-slate-400">
                  Results are ranked by relevance: title matches score highest, followed by path
                  matches, then content matches.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-white">Workspace Filtering</h3>
                <p className="text-sm text-slate-400">
                  You can filter search results to a specific workspace by using the search
                  component within a workspace view.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </AuroraBackground>
  );
}
