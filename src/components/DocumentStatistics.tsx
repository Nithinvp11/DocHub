'use client';

import React, { useMemo } from 'react';
import { FileText, Clock, Type, Hash } from 'lucide-react';
import { calculateDocumentStats, formatReadingTime, formatNumber } from '@/lib/document-stats';

interface DocumentStatisticsProps {
  content: string;
  className?: string;
}

export function DocumentStatistics({ content, className = '' }: DocumentStatisticsProps) {
  const stats = useMemo(() => calculateDocumentStats(content), [content]);
  
  return (
    <div className={`flex items-center gap-6 text-sm text-muted-foreground ${className}`}>
      <div className="flex items-center gap-1.5" title="Word count">
        <Type className="h-4 w-4" />
        <span>{formatNumber(stats.wordCount)} words</span>
      </div>
      
      <div className="flex items-center gap-1.5" title="Reading time">
        <Clock className="h-4 w-4" />
        <span>{formatReadingTime(stats.readingTime)}</span>
      </div>
      
      <div className="flex items-center gap-1.5" title="Characters">
        <Hash className="h-4 w-4" />
        <span>{formatNumber(stats.characterCount)} chars</span>
      </div>
      
      <div className="flex items-center gap-1.5" title="Paragraphs">
        <FileText className="h-4 w-4" />
        <span>{stats.paragraphCount} paragraphs</span>
      </div>
    </div>
  );
}

// Compact version for toolbar/status bar
export function CompactDocumentStatistics({ content }: DocumentStatisticsProps) {
  const stats = useMemo(() => calculateDocumentStats(content), [content]);
  
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span>{formatNumber(stats.wordCount)} words</span>
      <span>•</span>
      <span>{formatReadingTime(stats.readingTime)}</span>
    </div>
  );
}
