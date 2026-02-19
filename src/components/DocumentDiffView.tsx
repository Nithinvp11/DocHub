/**
 * Side-by-Side Document Diff View
 * Main component for comparing two document versions
 */

'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { generateDocumentDiff, getDiffStats, type DiffBlock } from '@/lib/diff-engine';
import type { ProseMirrorDocument } from '@/types/prosemirror';
import { DiffBlockRenderer } from '@/components/DiffBlockRenderer';
import { Button } from '@/components/ui/button';
import { PremiumCard, PremiumCardContent, PremiumCardHeader } from '@/components/ui/card-premium';
import { ChevronDown, ChevronUp, Filter, SkipForward, SkipBack, RotateCcw, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface DocumentDiffViewProps {
  oldVersion: ProseMirrorDocument;
  newVersion: ProseMirrorDocument;
  oldVersionLabel?: string;
  newVersionLabel?: string;
  onRestore?: () => void;
  onClose?: () => void;
}

type FilterMode = 'all' | 'changes' | 'moved' | 'unchanged';

export function DocumentDiffView({
  oldVersion,
  newVersion,
  oldVersionLabel = 'Old Version',
  newVersionLabel = 'New Version',
  onRestore,
  onClose,
}: DocumentDiffViewProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0);

  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Generate diff
  const diffBlocks = useMemo(() => {
    return generateDocumentDiff(oldVersion, newVersion);
  }, [oldVersion, newVersion]);

  const stats = useMemo(() => getDiffStats(diffBlocks), [diffBlocks]);

  // Filter blocks
  const filteredBlocks = useMemo(() => {
    if (filterMode === 'all') return diffBlocks;
    if (filterMode === 'changes')
      return diffBlocks.filter(
        (b) => b.status === 'added' || b.status === 'removed' || b.status === 'modified'
      );
    if (filterMode === 'moved') return diffBlocks.filter((b) => b.status === 'moved');
    if (filterMode === 'unchanged') return diffBlocks.filter((b) => b.status === 'unchanged');
    return diffBlocks;
  }, [diffBlocks, filterMode]);

  // Get change blocks (not unchanged)
  const changeBlocks = useMemo(
    () => diffBlocks.filter((b) => b.status !== 'unchanged'),
    [diffBlocks]
  );

  // Sync scroll between panels
  useEffect(() => {
    const handleScroll = (source: HTMLDivElement, target: HTMLDivElement) => {
      target.scrollTop = source.scrollTop;
    };

    const leftPanel = leftPanelRef.current;
    const rightPanel = rightPanelRef.current;

    if (!leftPanel || !rightPanel) return;

    const leftScrollHandler = () => handleScroll(leftPanel, rightPanel);
    const rightScrollHandler = () => handleScroll(rightPanel, leftPanel);

    leftPanel.addEventListener('scroll', leftScrollHandler);
    rightPanel.addEventListener('scroll', rightScrollHandler);

    return () => {
      leftPanel.removeEventListener('scroll', leftScrollHandler);
      rightPanel.removeEventListener('scroll', rightScrollHandler);
    };
  }, []);

  // Navigate to next/prev change
  const navigateToChange = (direction: 'next' | 'prev') => {
    if (changeBlocks.length === 0) return;

    let newIndex = currentChangeIndex;
    if (direction === 'next') {
      newIndex = (currentChangeIndex + 1) % changeBlocks.length;
    } else {
      newIndex = (currentChangeIndex - 1 + changeBlocks.length) % changeBlocks.length;
    }

    setCurrentChangeIndex(newIndex);

    // Scroll to the change block
    const targetBlock = changeBlocks[newIndex];
    const blockIndex = diffBlocks.findIndex((b) => b.id === targetBlock.id);

    // Simple scroll - in production you'd want smooth scrolling to specific block
    if (leftPanelRef.current) {
      leftPanelRef.current.scrollTop = blockIndex * 100; // Approximate
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="shrink-0 border-b bg-gradient-to-r from-slate-50 to-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">Document Comparison</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-md bg-blue-100 px-2 py-0.5 font-medium text-blue-700">
                {oldVersionLabel}
              </span>
              <span className="text-slate-400">→</span>
              <span className="rounded-md bg-green-100 px-2 py-0.5 font-medium text-green-700">
                {newVersionLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRestore && (
              <Button onClick={onRestore} variant="secondary" size="sm">
                <RotateCcw className="mr-2 h-4 w-4" />
                Restore This Version
              </Button>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-4 flex flex-wrap gap-3 rounded-lg bg-slate-50 p-3">
          <div className="flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 shadow-sm">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
            <span className="text-xs font-medium text-slate-700">
              <span className="text-green-600">{stats.added}</span> Added
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 shadow-sm">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500"></div>
            <span className="text-xs font-medium text-slate-700">
              <span className="text-red-600">{stats.removed}</span> Removed
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 shadow-sm">
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500"></div>
            <span className="text-xs font-medium text-slate-700">
              <span className="text-yellow-600">{stats.modified}</span> Modified
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 shadow-sm">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500"></div>
            <span className="text-xs font-medium text-slate-700">
              <span className="text-blue-600">{stats.moved}</span> Moved
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 shadow-sm">
            <div className="h-2.5 w-2.5 rounded-full bg-slate-400"></div>
            <span className="text-xs font-medium text-slate-700">
              <span className="text-slate-600">{stats.unchanged}</span> Unchanged
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b bg-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter: {filterMode}
                <ChevronDown className="ml-2 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Show</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterMode('all')}>
                All Blocks ({diffBlocks.length})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterMode('changes')}>
                Only Changes ({stats.added + stats.removed + stats.modified})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterMode('moved')}>
                Only Moved ({stats.moved})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterMode('unchanged')}>
                Only Unchanged ({stats.unchanged})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">
            Change {currentChangeIndex + 1} of {changeBlocks.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateToChange('prev')}
            disabled={changeBlocks.length === 0}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateToChange('next')}
            disabled={changeBlocks.length === 0}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Side-by-Side Panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <div className="flex-1 border-r bg-white">
          <div className="sticky top-0 z-10 border-b bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-900">
            📄 {oldVersionLabel}
          </div>
          <div ref={leftPanelRef} className="h-[calc(100%-2.75rem)] overflow-y-auto p-4">
            {filteredBlocks.map((block) => (
              <DiffBlockRenderer
                key={block.id}
                diffBlock={block}
                side="left"
                showUnchanged={filterMode !== 'changes'}
              />
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 bg-white">
          <div className="sticky top-0 z-10 border-b bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-900">
            📄 {newVersionLabel}
          </div>
          <div ref={rightPanelRef} className="h-[calc(100%-2.75rem)] overflow-y-auto p-4">
            {filteredBlocks.map((block) => (
              <DiffBlockRenderer
                key={block.id}
                diffBlock={block}
                side="right"
                showUnchanged={filterMode !== 'changes'}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
