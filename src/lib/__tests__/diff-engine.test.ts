/**
 * Tests for diff-engine to verify fixes
 */

import { generateDocumentDiff, getDiffStats } from '../diff-engine';
import type { ProseMirrorDocument } from '@/types/prosemirror';

describe('diff-engine', () => {
  describe('block matching', () => {
    it('should not create duplicate blocks', () => {
      const oldDoc: ProseMirrorDocument = {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'World' }] },
        ],
      };

      const newDoc: ProseMirrorDocument = {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'World Updated' }] },
        ],
      };

      const diff = generateDocumentDiff(oldDoc, newDoc);

      // Should have exactly 2 blocks (one unchanged, one modified)
      expect(diff.length).toBe(2);

      // Verify no duplicate IDs
      const ids = diff.map((b) => b.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should correctly identify unchanged blocks', () => {
      const oldDoc: ProseMirrorDocument = {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Same content' }] }],
      };

      const newDoc: ProseMirrorDocument = {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Same content' }] }],
      };

      const diff = generateDocumentDiff(oldDoc, newDoc);

      expect(diff.length).toBe(1);
      expect(diff[0].status).toBe('unchanged');
      expect(diff[0].oldNode).toBeDefined();
      expect(diff[0].newNode).toBeDefined();
    });

    it('should correctly identify added blocks', () => {
      const oldDoc: ProseMirrorDocument = {
        type: 'doc',
        content: [],
      };

      const newDoc: ProseMirrorDocument = {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'New paragraph' }] }],
      };

      const diff = generateDocumentDiff(oldDoc, newDoc);

      expect(diff.length).toBe(1);
      expect(diff[0].status).toBe('added');
      expect(diff[0].oldNode).toBeUndefined();
      expect(diff[0].newNode).toBeDefined();
    });

    it('should correctly identify removed blocks', () => {
      const oldDoc: ProseMirrorDocument = {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Old paragraph' }] }],
      };

      const newDoc: ProseMirrorDocument = {
        type: 'doc',
        content: [],
      };

      const diff = generateDocumentDiff(oldDoc, newDoc);

      expect(diff.length).toBe(1);
      expect(diff[0].status).toBe('removed');
      expect(diff[0].oldNode).toBeDefined();
      expect(diff[0].newNode).toBeUndefined();
    });

    it('should correctly identify modified blocks', () => {
      const oldDoc: ProseMirrorDocument = {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Original' }] }],
      };

      const newDoc: ProseMirrorDocument = {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Modified' }] }],
      };

      const diff = generateDocumentDiff(oldDoc, newDoc);

      expect(diff.length).toBe(1);
      expect(diff[0].status).toBe('modified');
      expect(diff[0].oldNode).toBeDefined();
      expect(diff[0].newNode).toBeDefined();
    });

    it('should match blocks only once', () => {
      const oldDoc: ProseMirrorDocument = {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'A' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'B' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'C' }] },
        ],
      };

      const newDoc: ProseMirrorDocument = {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'A' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'B modified' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'D' }] },
        ],
      };

      const diff = generateDocumentDiff(oldDoc, newDoc);

      // Should have 4 blocks: A (unchanged), B (modified), C (removed), D (added)
      expect(diff.length).toBe(4);

      const statuses = diff.map((b) => b.status);
      expect(statuses.filter((s) => s === 'unchanged').length).toBe(1);
      expect(statuses.filter((s) => s === 'modified').length).toBe(1);
      expect(statuses.filter((s) => s === 'removed').length).toBe(1);
      expect(statuses.filter((s) => s === 'added').length).toBe(1);
    });
  });

  describe('stats calculation', () => {
    it('should calculate correct statistics', () => {
      const oldDoc: ProseMirrorDocument = {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Unchanged' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'To modify' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'To remove' }] },
        ],
      };

      const newDoc: ProseMirrorDocument = {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Unchanged' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Modified' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Added' }] },
        ],
      };

      const diff = generateDocumentDiff(oldDoc, newDoc);
      const stats = getDiffStats(diff);

      expect(stats.unchanged).toBe(1);
      expect(stats.modified).toBe(1);
      expect(stats.removed).toBe(1);
      expect(stats.added).toBe(1);
      expect(stats.total).toBe(4);
    });
  });

  describe('alignment', () => {
    it('should maintain proper row structure for rendering', () => {
      const oldDoc: ProseMirrorDocument = {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'A' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'B' }] },
        ],
      };

      const newDoc: ProseMirrorDocument = {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'A' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'C' }] },
        ],
      };

      const diff = generateDocumentDiff(oldDoc, newDoc);

      // Each diff block should have either oldNode or newNode or both
      for (const block of diff) {
        expect(block.oldNode !== undefined || block.newNode !== undefined).toBe(true);
      }

      // Blocks should be in logical order
      const indices = diff.map((b) => b.newIndex ?? b.oldIndex ?? 0);
      for (let i = 1; i < indices.length; i++) {
        expect(indices[i]).toBeGreaterThanOrEqual(indices[i - 1]);
      }
    });
  });
});
