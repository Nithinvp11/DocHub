/**
 * Type definitions for ProseMirror JSON document structure
 */

export interface ProseMirrorMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface ProseMirrorNode {
  type: string;
  text?: string;
  content?: ProseMirrorNode[];
  marks?: ProseMirrorMark[];
  attrs?: Record<string, unknown>;
}

export interface ProseMirrorDocument {
  type: 'doc';
  content: ProseMirrorNode[];
}
