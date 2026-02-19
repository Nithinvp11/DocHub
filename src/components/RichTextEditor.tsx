'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { InputDialog } from '@/components/ui/input-dialog';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  CheckSquare,
  Undo,
  Redo,
  Highlighter,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Table as TableIcon,
  ImageIcon,
  Minus,
  Eraser,
  Palette,
  MoreHorizontal,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  CodeSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start typing...',
  editable = true,
  className = '',
}: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline cursor-pointer hover:text-blue-700',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'flex items-start gap-2',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Typography,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 bg-gray-100 font-bold p-2',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2',
        },
      }),
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded',
        },
      }),
      TextStyle,
      Color,
      Subscript,
      Superscript,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[200px] max-w-none',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  // State for input dialogs
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [linkPreviousUrl, setLinkPreviousUrl] = useState('');

  // Define all callbacks at the top level (before any early returns)
  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    setLinkPreviousUrl(previousUrl || '');
    setLinkDialogOpen(true);
  }, [editor]);

  const handleLinkConfirm = useCallback(
    (url: string) => {
      if (!editor) return;

      if (url === '') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        return;
      }

      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    },
    [editor]
  );

  const addImage = useCallback(() => {
    if (!editor) return;
    setImageDialogOpen(true);
  }, [editor]);

  const handleImageConfirm = useCallback(
    (url: string) => {
      if (!editor || !url) return;
      editor.chain().focus().setImage({ src: url }).run();
    },
    [editor]
  );

  const insertTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const setColor = useCallback(
    (color: string) => {
      if (!editor) return;
      editor.chain().focus().setColor(color).run();
      setCurrentColor(color);
      setShowColorPicker(false);
    },
    [editor]
  );

  // Memoized command callbacks
  const toggleBold = useCallback(() => editor?.chain().focus().toggleBold().run(), [editor]);
  const toggleItalic = useCallback(() => editor?.chain().focus().toggleItalic().run(), [editor]);
  const toggleUnderline = useCallback(
    () => editor?.chain().focus().toggleUnderline().run(),
    [editor]
  );
  const toggleStrike = useCallback(() => editor?.chain().focus().toggleStrike().run(), [editor]);
  const toggleCode = useCallback(() => editor?.chain().focus().toggleCode().run(), [editor]);
  const toggleHighlight = useCallback(
    () => editor?.chain().focus().toggleHighlight().run(),
    [editor]
  );
  const toggleSubscript = useCallback(
    () => editor?.chain().focus().toggleSubscript().run(),
    [editor]
  );
  const toggleSuperscript = useCallback(
    () => editor?.chain().focus().toggleSuperscript().run(),
    [editor]
  );

  const setParagraph = useCallback(() => editor?.chain().focus().setParagraph().run(), [editor]);
  const toggleHeading1 = useCallback(
    () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
    [editor]
  );
  const toggleHeading2 = useCallback(
    () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    [editor]
  );
  const toggleHeading3 = useCallback(
    () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
    [editor]
  );
  const toggleHeading4 = useCallback(
    () => editor?.chain().focus().toggleHeading({ level: 4 }).run(),
    [editor]
  );
  const toggleHeading5 = useCallback(
    () => editor?.chain().focus().toggleHeading({ level: 5 }).run(),
    [editor]
  );
  const toggleHeading6 = useCallback(
    () => editor?.chain().focus().toggleHeading({ level: 6 }).run(),
    [editor]
  );

  const toggleBulletList = useCallback(
    () => editor?.chain().focus().toggleBulletList().run(),
    [editor]
  );
  const toggleOrderedList = useCallback(
    () => editor?.chain().focus().toggleOrderedList().run(),
    [editor]
  );
  const toggleTaskList = useCallback(
    () => editor?.chain().focus().toggleTaskList().run(),
    [editor]
  );
  const toggleBlockquote = useCallback(
    () => editor?.chain().focus().toggleBlockquote().run(),
    [editor]
  );
  const toggleCodeBlock = useCallback(
    () => editor?.chain().focus().toggleCodeBlock().run(),
    [editor]
  );

  const setAlignLeft = useCallback(
    () => editor?.chain().focus().setTextAlign('left').run(),
    [editor]
  );
  const setAlignCenter = useCallback(
    () => editor?.chain().focus().setTextAlign('center').run(),
    [editor]
  );
  const setAlignRight = useCallback(
    () => editor?.chain().focus().setTextAlign('right').run(),
    [editor]
  );
  const setAlignJustify = useCallback(
    () => editor?.chain().focus().setTextAlign('justify').run(),
    [editor]
  );

  const addHorizontalRule = useCallback(
    () => editor?.chain().focus().setHorizontalRule().run(),
    [editor]
  );
  const clearFormatting = useCallback(
    () => editor?.chain().focus().unsetAllMarks().clearNodes().run(),
    [editor]
  );
  const undo = useCallback(() => editor?.chain().focus().undo().run(), [editor]);
  const redo = useCallback(() => editor?.chain().focus().redo().run(), [editor]);

  const addColumnBefore = useCallback(
    () => editor?.chain().focus().addColumnBefore().run(),
    [editor]
  );
  const addColumnAfter = useCallback(
    () => editor?.chain().focus().addColumnAfter().run(),
    [editor]
  );
  const deleteColumn = useCallback(() => editor?.chain().focus().deleteColumn().run(), [editor]);
  const addRowBefore = useCallback(() => editor?.chain().focus().addRowBefore().run(), [editor]);
  const addRowAfter = useCallback(() => editor?.chain().focus().addRowAfter().run(), [editor]);
  const deleteRow = useCallback(() => editor?.chain().focus().deleteRow().run(), [editor]);
  const deleteTable = useCallback(() => editor?.chain().focus().deleteTable().run(), [editor]);

  const colors = [
    '#000000',
    '#374151',
    '#DC2626',
    '#EA580C',
    '#D97706',
    '#65A30D',
    '#059669',
    '#0891B2',
    '#2563EB',
    '#7C3AED',
    '#C026D3',
    '#DB2777',
    '#FFFFFF',
    '#F3F4F6',
    '#FCA5A5',
    '#FCD34D',
    '#BEF264',
    '#6EE7B7',
    '#67E8F9',
    '#93C5FD',
    '#C4B5FD',
    '#F0ABFC',
  ];

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    active = false,
    disabled = false,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => {
    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      },
      [onClick]
    );

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
    }, []);

    return (
      <button
        type="button"
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        disabled={disabled || !editable}
        title={title}
        className={`rounded p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
          active
            ? 'bg-gray-200 text-blue-600 dark:bg-gray-600 dark:text-blue-400'
            : 'text-gray-700 dark:text-gray-300'
        } ${disabled || !editable ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      >
        {children}
      </button>
    );
  };

  return (
    <div className={`overflow-hidden rounded-lg border ${className}`}>
      {editable && (
        <div className="border-b bg-linear-to-r from-gray-50 to-gray-100 p-2">
          {/* Row 1: Text Formatting */}
          <div className="mb-2 flex flex-wrap gap-1">
            <ToolbarButton
              onClick={toggleBold}
              active={editor.isActive('bold')}
              title="Bold (Ctrl+B)"
            >
              <Bold size={18} />
            </ToolbarButton>

            <ToolbarButton
              onClick={toggleItalic}
              active={editor.isActive('italic')}
              title="Italic (Ctrl+I)"
            >
              <Italic size={18} />
            </ToolbarButton>

            <ToolbarButton
              onClick={toggleUnderline}
              active={editor.isActive('underline')}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon size={18} />
            </ToolbarButton>

            <ToolbarButton
              onClick={toggleStrike}
              active={editor.isActive('strike')}
              title="Strikethrough"
            >
              <Strikethrough size={18} />
            </ToolbarButton>

            <ToolbarButton
              onClick={toggleCode}
              active={editor.isActive('code')}
              title="Inline Code"
            >
              <Code size={18} />
            </ToolbarButton>

            <ToolbarButton
              onClick={toggleHighlight}
              active={editor.isActive('highlight')}
              title="Highlight"
            >
              <Highlighter size={18} />
            </ToolbarButton>

            <div className="mx-1 h-6 w-px bg-gray-300" />

            {/* Color Picker */}
            <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  className="rounded p-2 transition-colors hover:bg-gray-200"
                  title="Text Color"
                >
                  <Palette size={18} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="grid grid-cols-6 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`h-8 w-8 rounded border-2 transition-transform hover:scale-110 ${
                        currentColor === color ? 'border-blue-500' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setColor(color)}
                      onMouseDown={(e) => e.preventDefault()}
                      title={color}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <ToolbarButton
              onClick={toggleSubscript}
              active={editor.isActive('subscript')}
              title="Subscript"
            >
              <SubscriptIcon size={18} />
            </ToolbarButton>

            <ToolbarButton
              onClick={toggleSuperscript}
              active={editor.isActive('superscript')}
              title="Superscript"
            >
              <SuperscriptIcon size={18} />
            </ToolbarButton>

            <div className="mx-1 h-6 w-px bg-gray-300" />

            {/* Headings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  className="flex items-center gap-1 rounded px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-200"
                  title="Headings"
                >
                  {editor.isActive('heading', { level: 1 })
                    ? 'H1'
                    : editor.isActive('heading', { level: 2 })
                      ? 'H2'
                      : editor.isActive('heading', { level: 3 })
                        ? 'H3'
                        : editor.isActive('heading', { level: 4 })
                          ? 'H4'
                          : editor.isActive('heading', { level: 5 })
                            ? 'H5'
                            : editor.isActive('heading', { level: 6 })
                              ? 'H6'
                              : 'P'}
                  <MoreHorizontal size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={setParagraph}>
                  <span className="text-base">Paragraph</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleHeading1}>
                  <span className="text-2xl font-bold">Heading 1</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                  <span className="text-xl font-bold">Heading 2</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                >
                  <span className="text-lg font-bold">Heading 3</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                >
                  <span className="text-base font-bold">Heading 4</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
                >
                  <span className="text-sm font-bold">Heading 5</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
                >
                  <span className="text-xs font-bold">Heading 6</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Row 2: Lists, Alignment, and More */}
          <div className="flex flex-wrap gap-1">
            <ToolbarButton
              onClick={toggleBulletList}
              active={editor.isActive('bulletList')}
              title="Bullet List"
            >
              <List size={18} />
            </ToolbarButton>

            <ToolbarButton
              onClick={toggleOrderedList}
              active={editor.isActive('orderedList')}
              title="Numbered List"
            >
              <ListOrdered size={18} />
            </ToolbarButton>

            <ToolbarButton
              onClick={toggleTaskList}
              active={editor.isActive('taskList')}
              title="Task List"
            >
              <CheckSquare size={18} />
            </ToolbarButton>

            <ToolbarButton
              onClick={toggleBlockquote}
              active={editor.isActive('blockquote')}
              title="Quote"
            >
              <Quote size={18} />
            </ToolbarButton>

            <ToolbarButton
              onClick={toggleCodeBlock}
              active={editor.isActive('codeBlock')}
              title="Code Block"
            >
              <CodeSquare size={18} />
            </ToolbarButton>

            <div className="mx-1 h-6 w-px bg-gray-300" />

            <ToolbarButton
              onClick={setAlignLeft}
              active={editor.isActive({ textAlign: 'left' })}
              title="Align Left"
            >
              <AlignLeft size={18} />
            </ToolbarButton>

            <ToolbarButton
              onClick={setAlignCenter}
              active={editor.isActive({ textAlign: 'center' })}
              title="Align Center"
            >
              <AlignCenter size={18} />
            </ToolbarButton>

            <ToolbarButton
              onClick={setAlignRight}
              active={editor.isActive({ textAlign: 'right' })}
              title="Align Right"
            >
              <AlignRight size={18} />
            </ToolbarButton>

            <ToolbarButton
              onClick={setAlignJustify}
              active={editor.isActive({ textAlign: 'justify' })}
              title="Justify"
            >
              <AlignJustify size={18} />
            </ToolbarButton>

            <div className="mx-1 h-6 w-px bg-gray-300" />

            <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Add Link">
              <Link2 size={18} />
            </ToolbarButton>

            <ToolbarButton onClick={addImage} title="Insert Image">
              <ImageIcon size={18} />
            </ToolbarButton>

            {/* Table Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  className="rounded p-2 transition-colors hover:bg-gray-200"
                  title="Table"
                >
                  <TableIcon size={18} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={insertTable}>Insert Table (3x3)</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={addColumnBefore}>Add Column Before</DropdownMenuItem>
                <DropdownMenuItem onClick={addColumnAfter}>Add Column After</DropdownMenuItem>
                <DropdownMenuItem onClick={deleteColumn}>Delete Column</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={addRowBefore}>Add Row Before</DropdownMenuItem>
                <DropdownMenuItem onClick={addRowAfter}>Add Row After</DropdownMenuItem>
                <DropdownMenuItem onClick={deleteRow}>Delete Row</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={deleteTable}>Delete Table</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ToolbarButton onClick={addHorizontalRule} title="Horizontal Line">
              <Minus size={18} />
            </ToolbarButton>

            <ToolbarButton onClick={clearFormatting} title="Clear Formatting">
              <Eraser size={18} />
            </ToolbarButton>

            <div className="mx-1 h-6 w-px bg-gray-300" />

            <ToolbarButton onClick={undo} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
              <Undo size={18} />
            </ToolbarButton>

            <ToolbarButton onClick={redo} disabled={!editor.can().redo()} title="Redo (Ctrl+Y)">
              <Redo size={18} />
            </ToolbarButton>
          </div>
        </div>
      )}

      <div className="bg-white p-4">
        <ErrorBoundary
          fallback={
            <div className="rounded-md border-2 border-red-200 bg-red-50 p-4">
              <p className="font-semibold text-red-600">Editor Error</p>
              <p className="text-sm text-red-500">
                The editor encountered an error. Please refresh the page.
              </p>
            </div>
          }
        >
          <EditorContent editor={editor} />
        </ErrorBoundary>
      </div>

      {/* Input Dialogs */}
      <InputDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        title="Insert/Edit Link"
        description="Enter or modify the URL"
        label="URL"
        placeholder="https://example.com"
        defaultValue={linkPreviousUrl}
        onConfirm={handleLinkConfirm}
      />
      <InputDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        title="Insert Image from URL"
        description="Enter the image URL"
        label="Image URL"
        placeholder="https://example.com/image.jpg"
        onConfirm={handleImageConfirm}
      />
    </div>
  );
}
