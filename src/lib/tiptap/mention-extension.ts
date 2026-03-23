import { Node, mergeAttributes } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import { SuggestionOptions } from '@tiptap/suggestion';

export interface MentionOptions {
  HTMLAttributes: Record<string, unknown>;
  renderLabel: (props: { options: MentionOptions; node: unknown }) => string;
  suggestion: Omit<SuggestionOptions, 'editor'>;
}

export const MentionPluginKey = new PluginKey('mention');

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mention: {
      /**
       * Insert a mention
       */
      insertMention: (attributes: { id: string; label: string }) => ReturnType;
    };
  }
}

/**
 * Mention Extension
 * Enables @mentions with user autocomplete
 */
export const Mention = Node.create<MentionOptions>({
  name: 'mention',

  priority: 1000,

  addOptions() {
    return {
      HTMLAttributes: {},
      renderLabel({ options, node }) {
        const mentionNode = node as { attrs: { label?: string; id: string } };
        return `${options.suggestion.char}${mentionNode.attrs.label ?? mentionNode.attrs.id}`;
      },
      suggestion: {
        char: '@',
        pluginKey: MentionPluginKey,
        command: ({ editor, range, props }) => {
          // Increase range.to by one when the next node is of type "text"
          // and starts with a space character
          const nodeAfter = editor.view.state.selection.$to.nodeAfter;
          const overrideSpace = nodeAfter?.text?.startsWith(' ');

          if (overrideSpace) {
            range.to += 1;
          }

          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              {
                type: this.name,
                attrs: props,
              },
              {
                type: 'text',
                text: ' ',
              },
            ])
            .run();

          window.getSelection()?.collapseToEnd();
        },
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from);
          const type = state.schema.nodes[this.name];
          const allow = !!$from.parent.type.contentMatch.matchType(type);

          return allow;
        },
      },
    };
  },

  group: 'inline',

  inline: true,

  selectable: false,

  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-id'),
        renderHTML: (attributes) => {
          if (!attributes.id) {
            return {};
          }

          return {
            'data-id': attributes.id,
          };
        },
      },

      label: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-label'),
        renderHTML: (attributes) => {
          if (!attributes.label) {
            return {};
          }

          return {
            'data-label': attributes.label,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`,
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes({ 'data-type': this.name }, this.options.HTMLAttributes, HTMLAttributes, {
        class: 'mention',
        style:
          'background-color: rgba(59, 130, 246, 0.1); color: #2563eb; padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-weight: 500;',
      }),
      this.options.renderLabel({
        options: this.options,
        node,
      }),
    ];
  },

  renderText({ node }) {
    return this.options.renderLabel({
      options: this.options,
      node,
    });
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () =>
        this.editor.commands.command(({ tr, state }) => {
          let isMention = false;
          const { selection } = state;
          const { empty, anchor } = selection;

          if (!empty) {
            return false;
          }

          state.doc.nodesBetween(anchor - 1, anchor, (node, pos) => {
            if (node.type.name === this.name) {
              isMention = true;
              tr.insertText(this.options.suggestion.char || '', pos, pos + node.nodeSize);

              return false;
            }
          });

          return isMention;
        }),
    };
  },

  addProseMirrorPlugins() {
    // Mention selection UI is handled by document-editor.tsx (mentionQuery + insertMention).
    // Do not register TipTap's Suggestion plugin here, otherwise '@' keystrokes
    // can be intercepted before our custom workflow sees them.
    return [];
  },

  addCommands() {
    return {
      insertMention:
        (attributes) =>
        ({ chain }) => {
          return chain()
            .focus()
            .insertContent({
              type: this.name,
              attrs: attributes,
            })
            .run();
        },
    };
  },
});
