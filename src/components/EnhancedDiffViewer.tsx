'use client';

import React, { useMemo, useCallback } from 'react';
import { diffWords } from 'diff';

interface EnhancedDiffViewerProps {
  oldContent: string;
  newContent: string;
  oldVersion?: string;
  newVersion?: string;
}

export function EnhancedDiffViewer({
  oldContent,
  newContent,
  oldVersion = 'Previous',
  newVersion = 'Current',
}: EnhancedDiffViewerProps) {
  
  // Helper function to extract plain text from HTML
  const extractText = useCallback((html: string): string => {
    if (typeof window === 'undefined') return html;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }, []);
  
  // Apply diff highlighting to HTML content while preserving structure
  const applyDiffToHtml = useCallback((html: string, isOldVersion: boolean): string => {
    if (typeof window === 'undefined') return html;
    
    // Get plain text from both versions
    const oldText = extractText(oldContent);
    const newText = extractText(newContent);
    
    // Calculate word-level diff
    const diff = diffWords(oldText, newText);
    
    // Build the content string for this version with inline highlighting
    let resultHtml = '';
    
    diff.forEach(part => {
      const text = part.value;
      
      if (part.added && !isOldVersion) {
        // Show added text in new version with green highlight
        resultHtml += `<mark class="bg-green-200 dark:bg-green-900/50 text-green-900 dark:text-green-200 px-0.5 rounded">${text}</mark>`;
      } else if (part.removed && isOldVersion) {
        // Show removed text in old version with red highlight
        resultHtml += `<mark class="bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-200 px-0.5 rounded">${text}</mark>`;
      } else if (!part.added && !part.removed) {
        // Show unchanged text in both versions
        resultHtml += text;
      }
      // Skip: added text in old version, removed text in new version
    });
    
    // Preserve basic HTML structure by wrapping in paragraph if needed
    if (resultHtml && !resultHtml.trim().startsWith('<')) {
      resultHtml = `<p>${resultHtml}</p>`;
    }
    
    return resultHtml || html;
  }, [oldContent, newContent, extractText]);

  const highlightedOld = useMemo(() => applyDiffToHtml(oldContent, true), [applyDiffToHtml, oldContent]);
  const highlightedNew = useMemo(() => applyDiffToHtml(newContent, false), [applyDiffToHtml, newContent]);

  return (
    <div className="flex h-full gap-2">
      {/* Old Version (Left) */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border-2 border-red-300 bg-red-50/30 dark:border-red-800 dark:bg-red-950/10">
        <div className="border-b-2 border-red-300 bg-red-100 px-4 py-3 font-semibold text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-100">
          {oldVersion}
        </div>
        <div className="flex-1 overflow-auto">
          <div
            className="prose prose-sm dark:prose-invert max-w-none p-6 [&_table]:border-collapse [&_table]:border [&_table]:border-gray-300 dark:[&_table]:border-gray-700 [&_td]:border [&_td]:border-gray-300 [&_td]:px-3 [&_td]:py-2 dark:[&_td]:border-gray-700 [&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-100 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold dark:[&_th]:border-gray-700 dark:[&_th]:bg-gray-800"
            dangerouslySetInnerHTML={{ __html: highlightedOld }}
          />
        </div>
      </div>

      {/* New Version (Right) */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border-2 border-green-300 bg-green-50/30 dark:border-green-800 dark:bg-green-950/10">
        <div className="border-b-2 border-green-300 bg-green-100 px-4 py-3 font-semibold text-green-900 dark:border-green-800 dark:bg-green-900/20 dark:text-green-100">
          {newVersion}
        </div>
        <div className="flex-1 overflow-auto">
          <div
            className="prose prose-sm dark:prose-invert max-w-none p-6 [&_table]:border-collapse [&_table]:border [&_table]:border-gray-300 dark:[&_table]:border-gray-700 [&_td]:border [&_td]:border-gray-300 [&_td]:px-3 [&_td]:py-2 dark:[&_td]:border-gray-700 [&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-100 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold dark:[&_th]:border-gray-700 dark:[&_th]:bg-gray-800"
            dangerouslySetInnerHTML={{ __html: highlightedNew }}
          />
        </div>
      </div>
    </div>
  );
}
