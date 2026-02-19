import { Node, mergeAttributes } from '@tiptap/core';

export interface DetailsOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    details: {
      setDetails: () => ReturnType;
      toggleDetails: () => ReturnType;
    };
  }
}

export const Details = Node.create<DetailsOptions>({
  name: 'details',

  group: 'block',

  content: 'detailsSummary detailsContent',

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'details',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['details', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setDetails:
        () =>
        ({ commands }) => {
          return commands.wrapIn(this.name);
        },
      toggleDetails:
        () =>
        ({ commands }) => {
          return commands.toggleWrap(this.name);
        },
    };
  },
});

export const DetailsSummary = Node.create({
  name: 'detailsSummary',

  group: 'block',

  content: 'inline*',

  defining: true,

  parseHTML() {
    return [
      {
        tag: 'summary',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['summary', mergeAttributes(HTMLAttributes), 0];
  },
});

export const DetailsContent = Node.create({
  name: 'detailsContent',

  group: 'block',

  content: 'block+',

  defining: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-details-content]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-details-content': '' }), 0];
  },
});
