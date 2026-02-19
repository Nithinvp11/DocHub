/**
 * Utility to convert HTML content to ProseMirror JSON
 * Uses TipTap's editor instance to ensure proper parsing
 */

import { Editor } from '@tiptap/react';
import { getTipTapExtensions } from '@/components/TipTapExtensions';
import type { ProseMirrorDocument } from '@/types/prosemirror';

// Singleton editor instance for HTML parsing
let parserEditor: Editor | null = null;

function getParserEditor(): Editor {
  if (!parserEditor) {
    parserEditor = new Editor({
      extensions: getTipTapExtensions(),
      content: '',
      editable: false,
    });
  }
  return parserEditor;
}

/**
 * Convert HTML content to ProseMirror JSON format
 * @param html - HTML string from document content
 * @returns ProseMirror JSON document
 */
export function htmlToProseMirrorJSON(html: string): ProseMirrorDocument {
  try {
    const editor = getParserEditor();
    editor.commands.setContent(html);
    const json = editor.getJSON();
    return json as ProseMirrorDocument;
  } catch (error) {
    console.error('Failed to parse HTML to ProseMirror JSON:', error);
    // Return fallback empty document
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Error: Failed to parse document content' }],
        },
      ],
    };
  }
}

/**
 * Cleanup parser editor when no longer needed
 */
export function cleanupParser() {
  if (parserEditor) {
    parserEditor.destroy();
    parserEditor = null;
  }
}
