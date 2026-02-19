import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface DocumentLinkOptions {
  HTMLAttributes: Record<string, unknown>;
  onLinkClick?: (documentPath: string) => void;
  onLinkCreated?: (sourceDocId: string, targetPath: string) => void;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    documentLink: {
      /**
       * Set a document link
       */
      setDocumentLink: (attributes: { path: string; title?: string }) => ReturnType;
    };
  }
}

/**
 * Document Link Extension
 * Enables [[wiki-style]] document linking with autocomplete
 */
export const DocumentLink = Node.create<DocumentLinkOptions>({
  name: 'documentLink',

  priority: 1000,

  group: 'inline',

  inline: true,

  selectable: true,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      onLinkClick: undefined,
      onLinkCreated: undefined,
    };
  },

  addAttributes() {
    return {
      path: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-path'),
        renderHTML: (attributes) => ({
          'data-path': attributes.path,
        }),
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-title'),
        renderHTML: (attributes) => ({
          'data-title': attributes.title,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="document-link"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        { 'data-type': 'document-link' },
        this.options.HTMLAttributes,
        HTMLAttributes,
        {
          class: 'document-link',
          style: 'color: #0066cc; cursor: pointer; text-decoration: underline;',
        }
      ),
      `[[${node.attrs.title || node.attrs.path}]]`,
    ];
  },

  renderText({ node }) {
    return `[[${node.attrs.title || node.attrs.path}]]`;
  },

  addCommands() {
    return {
      setDocumentLink:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;

    return [
      new Plugin({
        key: new PluginKey('documentLinkDetection'),
        
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            const doc = state.doc;

            // Detect [[wiki-style]] patterns in text nodes
            doc.descendants((node, pos) => {
              if (node.isText && node.text) {
                const regex = /\[\[([^\]]+)\]\]/g;
                let match;

                while ((match = regex.exec(node.text)) !== null) {
                  const from = pos + match.index;
                  const to = from + match[0].length;

                  decorations.push(
                    Decoration.inline(from, to, {
                      class: 'document-link-suggestion',
                      style: 'background-color: rgba(0, 102, 204, 0.1); border-radius: 3px;',
                    })
                  );
                }
              }
            });

            return DecorationSet.create(doc, decorations);
          },

          handleClick(view, pos, event) {
            const { schema } = view.state;
            const coords = { left: event.clientX, top: event.clientY };
            const nodePos = view.posAtCoords(coords);

            if (!nodePos) return false;

            const node = view.state.doc.nodeAt(nodePos.pos);
            
            if (node?.type.name === 'documentLink') {
              event.preventDefault();
              
              if (options.onLinkClick) {
                options.onLinkClick(node.attrs.path);
              }
              
              return true;
            }

            return false;
          },
        },

        // Auto-convert [[text]] to document link nodes
        appendTransaction(transactions, oldState, newState) {
          const tr = newState.tr;
          let modified = false;

          newState.doc.descendants((node, pos) => {
            if (node.isText && node.text) {
              const regex = /\[\[([^\]]+)\]\]/g;
              let match;

              while ((match = regex.exec(node.text)) !== null) {
                const linkText = match[1];
                const from = pos + match.index;
                const to = from + match[0].length;

                // Create document link node
                const linkNode = newState.schema.nodes.documentLink.create({
                  path: linkText,
                  title: linkText,
                });

                tr.replaceWith(from, to, linkNode);
                modified = true;

                // Notify about link creation
                if (options.onLinkCreated) {
                  options.onLinkCreated('current-doc-id', linkText);
                }
              }
            }
          });

          return modified ? tr : null;
        },
      }),
    ];
  },
});
