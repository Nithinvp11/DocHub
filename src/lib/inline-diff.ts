/**
 * Inline diff engine for text content and formatting marks
 * Provides word-level and mark-level diffing
 */

import type { ProseMirrorNode, ProseMirrorMark } from '@/types/prosemirror';

export interface InlineDiffSegment {
  text: string;
  status: 'added' | 'removed' | 'unchanged';
  marks?: ProseMirrorMark[];
  markChanges?: {
    added: ProseMirrorMark[];
    removed: ProseMirrorMark[];
  };
}

/**
 * Split text into words while preserving whitespace
 */
function tokenizeText(text: string): string[] {
  return text.split(/(\s+)/);
}

/**
 * Generate word-level diff using Myers algorithm
 */
function diffWords(oldWords: string[], newWords: string[]): InlineDiffSegment[] {
  const dp: number[][] = [];
  for (let i = 0; i <= oldWords.length; i++) {
    dp[i] = [];
    for (let j = 0; j <= newWords.length; j++) {
      if (i === 0) {
        dp[i][j] = j;
      } else if (j === 0) {
        dp[i][j] = i;
      } else if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  // Backtrack to find the diff
  let i = oldWords.length;
  let j = newWords.length;

  const result: Array<{ word: string; status: 'added' | 'removed' | 'unchanged' }> = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      // Words are identical - mark as unchanged
      result.unshift({ word: oldWords[i - 1], status: 'unchanged' });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] <= dp[i - 1][j])) {
      result.unshift({ word: newWords[j - 1], status: 'added' });
      j--;
    } else if (i > 0) {
      result.unshift({ word: oldWords[i - 1], status: 'removed' });
      i--;
    }
  }

  // Convert to segments - deduplicate identical removed+added pairs
  const segments: InlineDiffSegment[] = [];
  for (let k = 0; k < result.length; k++) {
    const item = result[k];

    // Check if this removed word is followed by identical added word
    if (
      item.status === 'removed' &&
      k + 1 < result.length &&
      result[k + 1].status === 'added' &&
      item.word === result[k + 1].word
    ) {
      // Skip both - treat as unchanged to prevent duplication
      segments.push({ text: item.word, status: 'unchanged' });
      k++; // Skip the next item too
      continue;
    }

    segments.push({ text: item.word, status: item.status });
  }

  return segments;
}

/**
 * Extract text content from ProseMirror node with marks
 */
interface TextWithMarks {
  text: string;
  marks: ProseMirrorMark[];
}

function extractTextWithMarks(node: ProseMirrorNode): TextWithMarks[] {
  const result: TextWithMarks[] = [];

  if (node.type === 'text') {
    result.push({
      text: node.text || '',
      marks: node.marks || [],
    });
  }

  if (node.content && Array.isArray(node.content)) {
    for (const child of node.content) {
      result.push(...extractTextWithMarks(child));
    }
  }

  return result;
}

/**
 * Compare marks between two text segments
 */
function compareMarks(oldMarks: ProseMirrorMark[] = [], newMarks: ProseMirrorMark[] = []) {
  const added: ProseMirrorMark[] = [];
  const removed: ProseMirrorMark[] = [];

  const oldMarkTypes = new Set(oldMarks.map((m) => m.type));
  const newMarkTypes = new Set(newMarks.map((m) => m.type));

  for (const mark of newMarks) {
    if (!oldMarkTypes.has(mark.type)) {
      added.push(mark);
    } else {
      // Check if attributes changed
      const oldMark = oldMarks.find((m) => m.type === mark.type);
      if (oldMark && JSON.stringify(oldMark.attrs) !== JSON.stringify(mark.attrs)) {
        added.push(mark);
        removed.push(oldMark);
      }
    }
  }

  for (const mark of oldMarks) {
    if (!newMarkTypes.has(mark.type)) {
      removed.push(mark);
    }
  }

  return { added, removed };
}

/**
 * Generate inline diff for two ProseMirror nodes
 */
export function generateInlineDiff(
  oldNode: ProseMirrorNode,
  newNode: ProseMirrorNode
): InlineDiffSegment[] {
  const oldTextSegments = extractTextWithMarks(oldNode);
  const newTextSegments = extractTextWithMarks(newNode);

  const oldText = oldTextSegments.map((s) => s.text).join('');
  const newText = newTextSegments.map((s) => s.text).join('');

  // Tokenize into words
  const oldWords = tokenizeText(oldText);
  const newWords = tokenizeText(newText);

  // Generate word diff
  const wordDiff = diffWords(oldWords, newWords);

  // Enhance with mark information
  const result: InlineDiffSegment[] = [];
  let oldCharIndex = 0;
  let newCharIndex = 0;

  for (const segment of wordDiff) {
    const segmentLength = segment.text.length;

    if (segment.status === 'unchanged') {
      // Find marks for this text range
      const oldMarks = findMarksForRange(oldTextSegments, oldCharIndex);
      const newMarks = findMarksForRange(newTextSegments, newCharIndex);

      const markChanges = compareMarks(oldMarks, newMarks);

      result.push({
        text: segment.text,
        status: 'unchanged',
        marks: newMarks,
        markChanges:
          markChanges.added.length > 0 || markChanges.removed.length > 0 ? markChanges : undefined,
      });

      oldCharIndex += segmentLength;
      newCharIndex += segmentLength;
    } else if (segment.status === 'removed') {
      const oldMarks = findMarksForRange(oldTextSegments, oldCharIndex);
      result.push({
        text: segment.text,
        status: 'removed',
        marks: oldMarks,
      });
      oldCharIndex += segmentLength;
    } else {
      // added
      const newMarks = findMarksForRange(newTextSegments, newCharIndex);
      result.push({
        text: segment.text,
        status: 'added',
        marks: newMarks,
      });
      newCharIndex += segmentLength;
    }
  }

  return result;
}

/**
 * Find marks for a specific character range
 * @param segments - Text segments with marks
 * @param startIndex - Starting character index
 * @returns Marks for the character at startIndex
 */
function findMarksForRange(segments: TextWithMarks[], startIndex: number): ProseMirrorMark[] {
  let currentIndex = 0;

  for (const segment of segments) {
    const segmentEnd = currentIndex + segment.text.length;

    if (startIndex >= currentIndex && startIndex < segmentEnd) {
      return segment.marks;
    }

    currentIndex = segmentEnd;
  }

  return [];
}

/**
 * Merge consecutive segments with same status for cleaner rendering
 * Also removes duplicate removed+added pairs with same text
 */
export function mergeInlineSegments(segments: InlineDiffSegment[]): InlineDiffSegment[] {
  if (segments.length === 0) return [];

  // First pass: merge consecutive segments with same status
  const merged: InlineDiffSegment[] = [];
  let current = { ...segments[0] };

  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];

    if (
      segment.status === current.status &&
      JSON.stringify(segment.marks) === JSON.stringify(current.marks) &&
      !segment.markChanges &&
      !current.markChanges
    ) {
      // Merge
      current.text += segment.text;
    } else {
      merged.push(current);
      current = { ...segment };
    }
  }

  merged.push(current);

  // Second pass: remove duplicate removed+added pairs with same text
  const deduplicated: InlineDiffSegment[] = [];
  let i = 0;

  while (i < merged.length) {
    const segment = merged[i];

    // Check if this is a removed segment followed by added with same text
    if (i < merged.length - 1 && segment.status === 'removed' && merged[i + 1].status === 'added') {
      const text1 = segment.text;
      const text2 = merged[i + 1].text;

      // Compare exact text OR normalized text (ignore whitespace for non-whitespace tokens)
      const isWhitespace = /^\s+$/.test(text1);
      const areIdentical =
        text1 === text2 || (!isWhitespace && text1.trim() === text2.trim() && text1.trim() !== '');

      if (areIdentical) {
        // Convert to unchanged to prevent duplication in rendering
        deduplicated.push({
          text: text2, // Use the "new" version
          status: 'unchanged',
          marks: merged[i + 1].marks || segment.marks,
        });
        i += 2;
        continue;
      }
    }

    // Check if this is an added segment followed by removed with same text
    if (i < merged.length - 1 && segment.status === 'added' && merged[i + 1].status === 'removed') {
      const text1 = segment.text;
      const text2 = merged[i + 1].text;

      const isWhitespace = /^\s+$/.test(text1);
      const areIdentical =
        text1 === text2 || (!isWhitespace && text1.trim() === text2.trim() && text1.trim() !== '');

      if (areIdentical) {
        // Convert to unchanged
        deduplicated.push({
          text: text1,
          status: 'unchanged',
          marks: segment.marks || merged[i + 1].marks,
        });
        i += 2;
        continue;
      }
    }

    deduplicated.push(segment);
    i++;
  }

  return deduplicated;
}
