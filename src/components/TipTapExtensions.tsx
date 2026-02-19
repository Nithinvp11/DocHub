// Advanced TipTap Extensions Configuration
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { Callout } from '@/components/editor/CalloutExtension';
import { Details, DetailsSummary, DetailsContent } from '@/components/editor/DetailsExtension';

// Initialize lowlight with common languages
const lowlight = createLowlight(common);

// Configure TipTap extensions
export const getTipTapExtensions = () => [
  StarterKit.configure({
    codeBlock: false, // Disable default code block to use lowlight version
    heading: {
      levels: [1, 2, 3, 4, 5, 6],
    },
  }),

  // Code highlighting with lowlight
  CodeBlockLowlight.configure({
    lowlight,
    defaultLanguage: 'typescript',
    HTMLAttributes: {
      class: 'code-block-lowlight',
    },
  }),

  // Tables
  Table.configure({
    resizable: true,
  }),
  TableRow,
  TableHeader,
  TableCell,

  // Task lists
  TaskList,
  TaskItem.configure({
    nested: true,
  }),

  // Links
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'tiptap-link',
    },
  }),

  // Other formatting
  Underline,

  // Placeholder
  Placeholder.configure({
    placeholder: 'Start writing your document...',
  }),

  // Advanced formatting - Callouts and collapsible sections
  Callout,
  Details,
  DetailsSummary,
  DetailsContent,
];

// Supported programming languages for syntax highlighting
export const supportedLanguages = [
  'typescript',
  'javascript',
  'python',
  'java',
  'csharp',
  'cpp',
  'go',
  'rust',
  'php',
  'ruby',
  'swift',
  'kotlin',
  'html',
  'css',
  'scss',
  'json',
  'yaml',
  'markdown',
  'sql',
  'bash',
  'shell',
  'powershell',
  'dockerfile',
  'xml',
];
