/**
 * High-Level Document Diff Engine for ProseMirror JSON
 * Implements block-level and inline-level diffing with move detection
 */

import type { ProseMirrorDocument, ProseMirrorNode, ProseMirrorMark } from '@/types/prosemirror';

export type DiffStatus = 'added' | 'removed' | 'modified' | 'unchanged' | 'moved';

export interface DiffBlock {
  id: string;
  type: string;
  status: DiffStatus;
  oldNode?: ProseMirrorNode;
  newNode?: ProseMirrorNode;
  oldIndex?: number;
  newIndex?: number;
  inlineChanges?: InlineChange[];
  metadata?: {
    headingLevelChange?: { from: number; to: number };
    checkboxStateChange?: { from: boolean; to: boolean };
    linkHrefChange?: { from: string; to: string };
    imageSrcChange?: { from: string; to: string };
  };
}

export interface InlineChange {
  type: 'text' | 'mark';
  status: 'added' | 'removed' | 'modified';
  text?: string;
  marks?: ProseMirrorMark[];
  oldMarks?: ProseMirrorMark[];
  newMarks?: ProseMirrorMark[];
}

interface BlockWithId {
  node: ProseMirrorNode;
  index: number;
  id: string;
}

/**
 * Generate a stable ID for a block node
 * Prioritizes attrs.id for stability across edits
 */
function getBlockId(node: ProseMirrorNode, index: number): string {
  // CRITICAL: Use existing id attribute if available for stable matching
  if (node.attrs?.id && typeof node.attrs.id === 'string' && node.attrs.id.trim() !== '') {
    return node.attrs.id;
  }

  // Generate fallback ID based on content hash and position
  const type = node.type || 'unknown';
  const textContent = extractTextContent(node);
  const contentHash = simpleHash(textContent);

  return `${type}-${index}-${contentHash}`;
}

/**
 * Extract plain text from a ProseMirror node
 */
function extractTextContent(node: ProseMirrorNode): string {
  if (node.text) {
    return node.text;
  }

  if (node.content && Array.isArray(node.content)) {
    return node.content.map((child) => extractTextContent(child)).join('');
  }

  return '';
}

/**
 * Check if node is a list type
 */
function isListNode(node: ProseMirrorNode): boolean {
  return node.type === 'bulletList' || node.type === 'orderedList' || node.type === 'taskList';
}

/**
 * Compare list contents for similarity (for better list matching)
 */
function compareListContents(node1: ProseMirrorNode, node2: ProseMirrorNode): number {
  if (!isListNode(node1) || !isListNode(node2)) return 0;
  if (node1.type !== node2.type) return 0;

  const items1 = node1.content || [];
  const items2 = node2.content || [];

  if (items1.length === 0 && items2.length === 0) return 1;
  if (items1.length === 0 || items2.length === 0) return 0;

  // Calculate overlap of list items
  const texts1 = items1.map(extractTextContent);
  const texts2 = items2.map(extractTextContent);

  let matches = 0;
  const maxLen = Math.max(texts1.length, texts2.length);

  for (let i = 0; i < Math.min(texts1.length, texts2.length); i++) {
    if (texts1[i] === texts2[i]) matches++;
  }

  return matches / maxLen;
}

/**
 * Simple hash function for content
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Normalize text for comparison (remove punctuation, extra whitespace)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Calculate similarity score between two blocks (0-1)
 */
function calculateSimilarity(node1: ProseMirrorNode, node2: ProseMirrorNode): number {
  // Type must match
  if (node1.type !== node2.type) {
    return 0;
  }

  // Special handling for lists
  if (isListNode(node1) && isListNode(node2)) {
    return compareListContents(node1, node2);
  }

  const text1 = extractTextContent(node1);
  const text2 = extractTextContent(node2);

  if (!text1 && !text2) {
    return 1; // Both empty
  }

  if (!text1 || !text2) {
    return 0;
  }

  // Normalize texts for better comparison
  const normalized1 = normalizeText(text1);
  const normalized2 = normalizeText(text2);

  if (normalized1 === normalized2) {
    return 1; // Identical after normalization
  }

  // Use Levenshtein distance for similarity
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  return 1 - distance / maxLength;
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Match blocks between old and new versions
 * Returns matches in NEW document order for proper alignment
 */
function matchBlocks(
  oldBlocks: BlockWithId[],
  newBlocks: BlockWithId[]
): Array<{ old: BlockWithId | null; new: BlockWithId | null; matchId: string; position: number }> {
  const results: Array<{
    old: BlockWithId | null;
    new: BlockWithId | null;
    matchId: string;
    position: number;
  }> = [];

  const unmatchedOld = new Set(oldBlocks.map((_, i) => i));
  const unmatchedNew = new Set(newBlocks.map((_, i) => i));
  const similarityThreshold = 0.65;

  // Pass 1: Match by exact ID (highest priority)
  for (let j = 0; j < newBlocks.length; j++) {
    if (!unmatchedNew.has(j)) continue;

    for (let i = 0; i < oldBlocks.length; i++) {
      if (!unmatchedOld.has(i)) continue;

      if (oldBlocks[i].id === newBlocks[j].id) {
        results.push({
          old: oldBlocks[i],
          new: newBlocks[j],
          matchId: oldBlocks[i].id,
          position: j, // Use new position for ordering
        });
        unmatchedOld.delete(i);
        unmatchedNew.delete(j);
        break; // Each new block matches at most one old block
      }
    }
  }

  // Pass 2: Match remaining blocks by similarity (in NEW document order)
  for (let j = 0; j < newBlocks.length; j++) {
    if (!unmatchedNew.has(j)) continue;

    let bestOldIndex = -1;
    let bestScore = 0;

    for (const i of unmatchedOld) {
      const score = calculateSimilarity(oldBlocks[i].node, newBlocks[j].node);
      if (score > bestScore && score >= similarityThreshold) {
        bestScore = score;
        bestOldIndex = i;
      }
    }

    if (bestOldIndex >= 0) {
      results.push({
        old: oldBlocks[bestOldIndex],
        new: newBlocks[j],
        matchId: `match-${bestOldIndex}-${j}`,
        position: j,
      });
      unmatchedOld.delete(bestOldIndex);
      unmatchedNew.delete(j);
    }
  }

  // Pass 3: Add matched new blocks (already in results)
  // Pass 4: Insert unmatched new blocks (added) at their positions
  for (const j of unmatchedNew) {
    results.push({
      old: null,
      new: newBlocks[j],
      matchId: `added-${j}`,
      position: j,
    });
  }

  // Pass 5: Insert unmatched old blocks (removed) near their closest match
  for (const i of unmatchedOld) {
    // Find position to insert removed block (after closest matched position)
    let insertPosition = oldBlocks[i].index;

    // Try to find a nearby matched block for better positioning
    for (const result of results) {
      if (result.old && Math.abs(result.old.index - oldBlocks[i].index) < 2) {
        insertPosition = result.position;
        break;
      }
    }

    results.push({
      old: oldBlocks[i],
      new: null,
      matchId: `removed-${i}`,
      position: insertPosition,
    });
  }

  // Sort by position to maintain NEW document order
  results.sort((a, b) => a.position - b.position);

  return results;
}

/**
 * Detect if nodes are equal
 */
function areNodesEqual(node1: ProseMirrorNode, node2: ProseMirrorNode): boolean {
  return JSON.stringify(node1) === JSON.stringify(node2);
}

/**
 * Detect metadata changes
 */
function detectMetadataChanges(
  oldNode: ProseMirrorNode,
  newNode: ProseMirrorNode
): DiffBlock['metadata'] {
  const metadata: DiffBlock['metadata'] = {};

  // Heading level change
  if (oldNode.type === 'heading' && newNode.type === 'heading') {
    const oldLevel = (oldNode.attrs?.level as number) || 1;
    const newLevel = (newNode.attrs?.level as number) || 1;
    if (oldLevel !== newLevel) {
      metadata.headingLevelChange = { from: oldLevel, to: newLevel };
    }
  }

  // Task list checkbox change
  if (oldNode.type === 'taskItem' && newNode.type === 'taskItem') {
    const oldChecked = (oldNode.attrs?.checked as boolean) || false;
    const newChecked = (newNode.attrs?.checked as boolean) || false;
    if (oldChecked !== newChecked) {
      metadata.checkboxStateChange = { from: oldChecked, to: newChecked };
    }
  }

  // Link href change
  if (oldNode.type === 'text' && newNode.type === 'text') {
    const oldLink = oldNode.marks?.find((m) => m.type === 'link');
    const newLink = newNode.marks?.find((m) => m.type === 'link');
    if (oldLink?.attrs && newLink?.attrs && oldLink.attrs.href !== newLink.attrs.href) {
      metadata.linkHrefChange = {
        from: (oldLink.attrs.href as string) || '',
        to: (newLink.attrs.href as string) || '',
      };
    }
  }

  // Image src change
  if (oldNode.type === 'image' && newNode.type === 'image') {
    const oldSrc = (oldNode.attrs?.src as string) || '';
    const newSrc = (newNode.attrs?.src as string) || '';
    if (oldSrc !== newSrc) {
      metadata.imageSrcChange = { from: oldSrc, to: newSrc };
    }
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

/**
 * Main diff generation function - generates row-based diff blocks
 */
export function generateDocumentDiff(
  oldDoc: ProseMirrorDocument,
  newDoc: ProseMirrorDocument
): DiffBlock[] {
  const oldContent = oldDoc.content || [];
  const newContent = newDoc.content || [];

  // Create blocks with IDs
  const oldBlocks: BlockWithId[] = oldContent.map((node, index: number) => ({
    node,
    index,
    id: getBlockId(node, index),
  }));

  const newBlocks: BlockWithId[] = newContent.map((node, index: number) => ({
    node,
    index,
    id: getBlockId(node, index),
  }));

  // Match blocks (returns in NEW document order)
  const matches = matchBlocks(oldBlocks, newBlocks);

  // Generate diff blocks from matches
  const diffBlocks: DiffBlock[] = [];

  for (const match of matches) {
    const { old, new: newBlock, matchId } = match;

    // Skip if neither node exists (shouldn't happen, but safeguard)
    if (!old && !newBlock) continue;

    if (old && newBlock) {
      // Both exist - determine status
      const isEqual = areNodesEqual(old.node, newBlock.node);
      const isMoved = old.index !== newBlock.index;

      if (isEqual && !isMoved) {
        // Truly unchanged
        diffBlocks.push({
          id: matchId,
          type: old.node.type,
          status: 'unchanged' as DiffStatus,
          oldNode: old.node,
          newNode: newBlock.node,
          oldIndex: old.index,
          newIndex: newBlock.index,
        });
      } else if (isEqual && isMoved) {
        // Same content, different position
        diffBlocks.push({
          id: matchId,
          type: old.node.type,
          status: 'moved' as DiffStatus,
          oldNode: old.node,
          newNode: newBlock.node,
          oldIndex: old.index,
          newIndex: newBlock.index,
        });
      } else {
        // Modified content
        diffBlocks.push({
          id: matchId,
          type: newBlock.node.type,
          status: 'modified' as DiffStatus,
          oldNode: old.node,
          newNode: newBlock.node,
          oldIndex: old.index,
          newIndex: newBlock.index,
          metadata: detectMetadataChanges(old.node, newBlock.node),
        });
      }
    } else if (old && !newBlock) {
      // Removed
      diffBlocks.push({
        id: matchId,
        type: old.node.type,
        status: 'removed' as DiffStatus,
        oldNode: old.node,
        oldIndex: old.index,
      });
    } else if (!old && newBlock) {
      // Added
      diffBlocks.push({
        id: matchId,
        type: newBlock.node.type,
        status: 'added' as DiffStatus,
        newNode: newBlock.node,
        newIndex: newBlock.index,
      });
    }
  }

  // Blocks are already sorted by matchBlocks function (NEW document order)
  return diffBlocks;
}

/**
 * Get diff statistics
 */
export function getDiffStats(diffBlocks: DiffBlock[]) {
  const stats = {
    added: 0,
    removed: 0,
    modified: 0,
    moved: 0,
    unchanged: 0,
    total: diffBlocks.length,
  };

  for (const block of diffBlocks) {
    stats[block.status]++;
  }

  return stats;
}
