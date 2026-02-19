import { Mark, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface CommentHighlightOptions {
  HTMLAttributes: Record<string, unknown>;
  onCommentClick?: (commentId: string) => void;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    commentHighlight: {
      /**
       * Set a comment highlight
       */
      setCommentHighlight: (attributes: { commentId: string; resolved?: boolean }) => ReturnType;
      /**
       * Toggle comment highlight
       */
      toggleCommentHighlight: (attributes: { commentId: string; resolved?: boolean }) => ReturnType;
      /**
       * Remove comment highlight
       */
      unsetCommentHighlight: () => ReturnType;
    };
  }
}

/**
 * Comment Highlight Extension
 * Enables text selection with inline comments
 */
export const CommentHighlight = Mark.create<CommentHighlightOptions>({
  name: 'commentHighlight',

  priority: 1000,

  addOptions() {
    return {
      HTMLAttributes: {},
      onCommentClick: undefined,
    };
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-comment-id'),
        renderHTML: (attributes) => {
          if (!attributes.commentId) {
            return {};
          }

          return {
            'data-comment-id': attributes.commentId,
          };
        },
      },
      resolved: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-resolved') === 'true',
        renderHTML: (attributes) => {
          return {
            'data-resolved': attributes.resolved ? 'true' : 'false',
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'mark[data-comment-id]',
      },
    ];
  },

  renderHTML({ mark, HTMLAttributes }) {
    const isResolved = mark.attrs.resolved;
    
    return [
      'mark',
      mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        {
          class: isResolved ? 'comment-highlight-resolved' : 'comment-highlight',
          style: isResolved
            ? 'background-color: rgba(34, 197, 94, 0.15); cursor: pointer; border-bottom: 2px solid rgba(34, 197, 94, 0.4);'
            : 'background-color: rgba(251, 191, 36, 0.2); cursor: pointer; border-bottom: 2px solid rgba(251, 191, 36, 0.6);',
        }
      ),
      0,
    ];
  },

  addCommands() {
    return {
      setCommentHighlight:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      toggleCommentHighlight:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes);
        },
      unsetCommentHighlight:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;

    return [
      new Plugin({
        key: new PluginKey('commentHighlightClick'),
        props: {
          handleClick(view, pos, event) {
            const { schema } = view.state;
            const coords = { left: event.clientX, top: event.clientY };
            const nodePos = view.posAtCoords(coords);

            if (!nodePos) return false;

            const node = view.state.doc.nodeAt(nodePos.pos);
            const marks = node?.marks || [];

            const commentMark = marks.find(
              (mark) => mark.type.name === 'commentHighlight'
            );

            if (commentMark) {
              event.preventDefault();

              if (options.onCommentClick) {
                options.onCommentClick(commentMark.attrs.commentId);
              }

              return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});
