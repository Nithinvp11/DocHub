import { Node, mergeAttributes } from '@tiptap/core';

export interface CalloutOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (type: 'info' | 'warning' | 'error' | 'success') => ReturnType;
      toggleCallout: (type: 'info' | 'warning' | 'error' | 'success') => ReturnType;
    };
  }
}

export const Callout = Node.create<CalloutOptions>({
  name: 'callout',

  group: 'block',

  content: 'block+',

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: (element) => element.getAttribute('data-type'),
        renderHTML: (attributes) => {
          return {
            'data-type': attributes.type,
            class: `callout callout-${attributes.type}`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
      },
      {
        tag: 'div.callout',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'callout',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setCallout:
        (type) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, { type });
        },
      toggleCallout:
        (type) =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, { type });
        },
    };
  },
});
