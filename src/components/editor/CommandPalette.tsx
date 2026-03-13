'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Table,
  Code,
  Quote,
  Minus,
  CheckSquare,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

interface Command {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  keywords: string[];
  action: (editor: Editor) => void;
  category: 'basic' | 'advanced' | 'media';
}

interface CommandPaletteProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ editor, isOpen, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset state when dialog closes
  const handleClose = useCallback(() => {
    setSearch('');
    setSelectedIndex(0);
    onClose();
  }, [onClose]);

  const commands: Command[] = [
    // Basic blocks
    {
      id: 'heading1',
      title: 'Heading 1',
      description: 'Large section heading',
      icon: <Heading1 className="h-4 w-4" />,
      keywords: ['h1', 'title', 'heading', 'large'],
      category: 'basic',
      action: (ed) => ed.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      id: 'heading2',
      title: 'Heading 2',
      description: 'Medium section heading',
      icon: <Heading2 className="h-4 w-4" />,
      keywords: ['h2', 'heading', 'subtitle'],
      category: 'basic',
      action: (ed) => ed.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      id: 'heading3',
      title: 'Heading 3',
      description: 'Small section heading',
      icon: <Heading3 className="h-4 w-4" />,
      keywords: ['h3', 'heading', 'subheading'],
      category: 'basic',
      action: (ed) => ed.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      id: 'bullet-list',
      title: 'Bullet List',
      description: 'Create a simple bullet list',
      icon: <List className="h-4 w-4" />,
      keywords: ['ul', 'unordered', 'bullet', 'list'],
      category: 'basic',
      action: (ed) => ed.chain().focus().toggleBulletList().run(),
    },
    {
      id: 'numbered-list',
      title: 'Numbered List',
      description: 'Create a numbered list',
      icon: <ListOrdered className="h-4 w-4" />,
      keywords: ['ol', 'ordered', 'numbered', 'list'],
      category: 'basic',
      action: (ed) => ed.chain().focus().toggleOrderedList().run(),
    },
    {
      id: 'task-list',
      title: 'Task List',
      description: 'Track tasks with checkboxes',
      icon: <CheckSquare className="h-4 w-4" />,
      keywords: ['todo', 'checkbox', 'task', 'checklist'],
      category: 'basic',
      action: (ed) => ed.chain().focus().toggleTaskList().run(),
    },
    {
      id: 'quote',
      title: 'Quote',
      description: 'Insert a blockquote',
      icon: <Quote className="h-4 w-4" />,
      keywords: ['blockquote', 'quote', 'citation'],
      category: 'basic',
      action: (ed) => ed.chain().focus().toggleBlockquote().run(),
    },
    {
      id: 'code-block',
      title: 'Code Block',
      description: 'Insert code with syntax highlighting',
      icon: <Code className="h-4 w-4" />,
      keywords: ['code', 'snippet', 'pre', 'programming'],
      category: 'basic',
      action: (ed) => ed.chain().focus().toggleCodeBlock().run(),
    },
    {
      id: 'divider',
      title: 'Divider',
      description: 'Add a horizontal divider',
      icon: <Minus className="h-4 w-4" />,
      keywords: ['hr', 'horizontal', 'line', 'separator', 'divider'],
      category: 'basic',
      action: (ed) => ed.chain().focus().setHorizontalRule().run(),
    },

    // Advanced blocks
    {
      id: 'table',
      title: 'Table',
      description: 'Insert a table',
      icon: <Table className="h-4 w-4" />,
      keywords: ['table', 'grid', 'spreadsheet'],
      category: 'advanced',
      action: (ed) =>
        ed.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
      id: 'callout-info',
      title: 'Info Callout',
      description: 'Informational callout box',
      icon: <Info className="h-4 w-4 text-blue-500" />,
      keywords: ['callout', 'info', 'note', 'information'],
      category: 'advanced',
      action: (ed) => {
        ed.chain()
          .focus()
          .insertContent({
            type: 'paragraph',
            attrs: { class: 'callout callout-info' },
            content: [{ type: 'text', text: 'ℹ️ Info: ' }],
          })
          .run();
      },
    },
    {
      id: 'callout-warning',
      title: 'Warning Callout',
      description: 'Warning callout box',
      icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
      keywords: ['callout', 'warning', 'caution', 'alert'],
      category: 'advanced',
      action: (ed) => {
        ed.chain()
          .focus()
          .insertContent({
            type: 'paragraph',
            attrs: { class: 'callout callout-warning' },
            content: [{ type: 'text', text: '⚠️ Warning: ' }],
          })
          .run();
      },
    },
    {
      id: 'callout-error',
      title: 'Error Callout',
      description: 'Error callout box',
      icon: <AlertCircle className="h-4 w-4 text-red-500" />,
      keywords: ['callout', 'error', 'danger', 'critical'],
      category: 'advanced',
      action: (ed) => {
        ed.chain()
          .focus()
          .insertContent({
            type: 'paragraph',
            attrs: { class: 'callout callout-error' },
            content: [{ type: 'text', text: '❌ Error: ' }],
          })
          .run();
      },
    },
    {
      id: 'callout-success',
      title: 'Success Callout',
      description: 'Success callout box',
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      keywords: ['callout', 'success', 'tip', 'done'],
      category: 'advanced',
      action: (ed) => {
        ed.chain()
          .focus()
          .insertContent({
            type: 'paragraph',
            attrs: { class: 'callout callout-success' },
            content: [{ type: 'text', text: '✅ Success: ' }],
          })
          .run();
      },
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    const searchLower = search.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(searchLower) ||
      cmd.description.toLowerCase().includes(searchLower) ||
      cmd.keywords.some((kw) => kw.includes(searchLower))
    );
  });

  const handleExecute = useCallback(
    (command: Command) => {
      if (!editor) return;
      command.action(editor);
      handleClose();
    },
    [editor, handleClose]
  );

  // Clamp selection when filter results change
  const safeSelectedIndex = Math.min(selectedIndex, Math.max(0, filteredCommands.length - 1));

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const commandToExecute = filteredCommands[safeSelectedIndex];
        if (commandToExecute) {
          handleExecute(commandToExecute);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, safeSelectedIndex, filteredCommands, handleExecute]);

  const categoryNames = {
    basic: 'Basic Blocks',
    advanced: 'Advanced',
    media: 'Media',
  };

  const groupedCommands = filteredCommands.reduce(
    (acc, cmd) => {
      if (!acc[cmd.category]) acc[cmd.category] = [];
      acc[cmd.category].push(cmd);
      return acc;
    },
    {} as Record<string, Command[]>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="px-3 pt-3">
          <DialogTitle>Insert Block</DialogTitle>
          <DialogDescription>Search for a block to insert</DialogDescription>
        </DialogHeader>

        <div className="px-3">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0); // Reset selection when search changes
            }}
            placeholder="Search blocks... (type / or press Ctrl+K)"
            className="w-full"
            autoFocus
          />
        </div>

        <ScrollArea className="max-h-72 px-3 pb-3">
          {Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category} className="mb-3">
              <h3 className="mb-1.5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                {categoryNames[category as keyof typeof categoryNames]}
              </h3>
              <div className="space-y-1">
                {cmds.map((cmd) => {
                  const globalIndex = filteredCommands.indexOf(cmd);
                  const isSelected = globalIndex === safeSelectedIndex;

                  return (
                    <button
                      key={cmd.id}
                      onClick={() => handleExecute(cmd)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                        isSelected ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-100'
                      }`}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                    >
                      <div className="shrink-0">{cmd.icon}</div>
                      <div className="flex-1 overflow-hidden">
                        <div className="text-sm font-medium">{cmd.title}</div>
                        <div className="text-xs text-slate-500">{cmd.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div className="py-8 text-center text-slate-500">
              <p>No blocks found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
