'use client';

import { useState } from 'react';
import { type Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Copy,
  Github,
  GitPullRequest,
  FileCode2,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link2 as LinkIcon,
  Unlink,
  Table,
  Underline as UnderlineIcon,
  CheckSquare,
  Minus,
  Columns,
  RowsIcon,
  ChevronDown,
  TableProperties,
} from 'lucide-react';
import { InputDialog } from '@/components/ui/input-dialog';
import { supportedLanguages } from '@/components/TipTapExtensions';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface EditorToolbarProps {
  editor: Editor | null;
  workspaceId?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
  ariaLabel?: string;
}

const ToolbarButton = ({
  onClick,
  active = false,
  disabled = false,
  children,
  title,
  ariaLabel,
}: ToolbarButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel || title}
      className={`rounded-lg p-2 transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30 ${
        active
          ? 'bg-linear-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/30'
          : 'text-slate-300 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
};

const Divider = () => <div className="mx-1 h-6 w-px bg-white/10" />;

export default function EditorToolbar({ editor, workspaceId }: EditorToolbarProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [prDialogOpen, setPrDialogOpen] = useState(false);
  const [githubCodeDialogOpen, setGitHubCodeDialogOpen] = useState(false);
  const [isLoadingGitHubCode, setIsLoadingGitHubCode] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState('typescript');

  if (!editor) {
    return null;
  }

  const addLink = () => {
    setLinkDialogOpen(true);
  };

  const handleLinkConfirm = (url: string) => {
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const applyCodeLanguage = (language: string) => {
    setCodeLanguage(language);
    editor.chain().focus().setCodeBlock({ language }).run();
  };

  const copyCurrentCodeBlock = async () => {
    if (!editor.isActive('codeBlock')) return;
    const text = editor.state.selection.$from.parent.textContent;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Silent fallback
    }
  };

  const insertGitHubReference = (type: 'issue' | 'pr', input: string) => {
    const value = input.trim();
    if (!value) return;

    let href = value;
    let label = value;

    const shortRefMatch = value.match(/^#(\d+)$/);
    if (shortRefMatch) {
      const number = shortRefMatch[1];
      href = `https://github.com/issues/${number}`;
      label = `${type === 'issue' ? 'Issue' : 'PR'} #${number}`;
    }

    const repoRefMatch = value.match(/^([\w.-]+)\/([\w.-]+)#(\d+)$/);
    if (repoRefMatch) {
      const [, owner, repo, number] = repoRefMatch;
      const pathPart = type === 'issue' ? 'issues' : 'pull';
      href = `https://github.com/${owner}/${repo}/${pathPart}/${number}`;
      label = `${owner}/${repo} ${type === 'issue' ? 'Issue' : 'PR'} #${number}`;
    }

    editor
      .chain()
      .focus()
      .insertContent(
        `<p><strong>${type === 'issue' ? 'Issue' : 'PR'}:</strong> <a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a></p>`
      )
      .run();
  };

  const insertGitHubCode = async (pathSpec: string) => {
    if (!workspaceId) {
      toast.error('Workspace context missing for GitHub code import');
      return;
    }

    const trimmedPathSpec = pathSpec.trim();
    if (!trimmedPathSpec) {
      return;
    }

    setIsLoadingGitHubCode(true);
    try {
      const response = await fetch('/api/github/snippet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          pathSpec: trimmedPathSpec,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Failed to fetch GitHub code');
        return;
      }

      editor
        .chain()
        .focus()
        .setCodeBlock({ language: data.language || 'text' })
        .run();
      editor.commands.insertContent(data.content || '');
      editor.chain().focus().setParagraph().run();

      toast.success(
        `Inserted ${data.path}${data.startLine ? `#L${data.startLine}${data.endLine ? `-L${data.endLine}` : ''}` : ''}`
      );
    } catch {
      toast.error('Failed to fetch GitHub code');
    } finally {
      setIsLoadingGitHubCode(false);
    }
  };

  return (
    <div className="flex w-full flex-wrap items-center gap-1">
      {/* History */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
        ariaLabel="Undo (Ctrl+Z)"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
        ariaLabel="Redo (Ctrl+Y)"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Bold"
        ariaLabel="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Italic"
        ariaLabel="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        title="Underline"
        ariaLabel="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        title="Strikethrough"
        ariaLabel="Strikethrough (Ctrl+Shift+X)"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
        ariaLabel="Heading 1 (Ctrl+Alt+1)"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
        ariaLabel="Heading 2 (Ctrl+Alt+2)"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
        ariaLabel="Heading 3 (Ctrl+Alt+3)"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Bullet List"
        ariaLabel="Bullet list (Ctrl+Shift+8)"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Numbered List"
        ariaLabel="Numbered list (Ctrl+Shift+7)"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        active={editor.isActive('taskList')}
        title="Task List"
        ariaLabel="Task list (Ctrl+Shift+9)"
      >
        <CheckSquare className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {/* Other blocks */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        title="Quote"
        ariaLabel="Blockquote (Ctrl+Shift+Q)"
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive('codeBlock')}
        title="Code Block"
        ariaLabel="Code block (Ctrl+Shift+C)"
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>
      {editor.isActive('codeBlock') && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-300 transition-all hover:scale-105 hover:bg-white/10 hover:text-white"
                title="Code language"
              >
                <span className="text-xs">{codeLanguage}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="max-h-64 w-48 overflow-y-auto border-white/10 bg-slate-900 text-white"
            >
              <DropdownMenuLabel className="text-slate-400">Code Language</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              {supportedLanguages.map((language) => (
                <DropdownMenuItem
                  key={language}
                  onClick={() => applyCodeLanguage(language)}
                  className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white"
                >
                  {language}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <ToolbarButton
            onClick={copyCurrentCodeBlock}
            title="Copy Code Block"
            ariaLabel="Copy code"
          >
            <Copy className="h-4 w-4" />
          </ToolbarButton>
        </>
      )}
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Line"
        ariaLabel="Horizontal rule (Ctrl+Shift+H)"
      >
        <Minus className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {/* Links */}
      <ToolbarButton
        onClick={addLink}
        active={editor.isActive('link')}
        title="Add Link"
        ariaLabel="Insert link (Ctrl+K)"
      >
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive('link')}
        title="Remove Link"
        ariaLabel="Remove link"
      >
        <Unlink className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => setIssueDialogOpen(true)}
        title="Insert GitHub Issue"
        ariaLabel="Insert GitHub issue link"
      >
        <Github className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => setPrDialogOpen(true)}
        title="Insert GitHub PR"
        ariaLabel="Insert GitHub pull request link"
      >
        <GitPullRequest className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => setGitHubCodeDialogOpen(true)}
        title="Insert Code from GitHub"
        ariaLabel="Insert code from GitHub file"
      >
        <FileCode2 className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {/* Table Operations */}
      <ToolbarButton onClick={addTable} title="Insert Table" ariaLabel="Insert table">
        <Table className="h-4 w-4" />
      </ToolbarButton>

      {editor.isActive('table') && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg p-2 text-slate-300 transition-all hover:scale-105 hover:bg-white/10 hover:text-white"
              title="Table Tools"
            >
              <TableProperties className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-56 border-white/10 bg-slate-900 text-white"
          >
            <DropdownMenuLabel className="text-slate-400">Table Tools</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white"
            >
              <Columns className="mr-2 h-4 w-4" />
              Add Column Before
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white"
            >
              <Columns className="mr-2 h-4 w-4" />
              Add Column After
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().deleteColumn().run()}
              className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white"
            >
              <Minus className="mr-2 h-4 w-4" />
              Delete Column
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addRowBefore().run()}
              className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white"
            >
              <RowsIcon className="mr-2 h-4 w-4" />
              Add Row Above
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white"
            >
              <RowsIcon className="mr-2 h-4 w-4" />
              Add Row Below
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().deleteRow().run()}
              className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white"
            >
              <Minus className="mr-2 h-4 w-4" />
              Delete Row
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().mergeCells().run()}
              disabled={!editor.can().mergeCells()}
              className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white"
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              Merge Cells
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().splitCell().run()}
              disabled={!editor.can().splitCell()}
              className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white"
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              Split Cell
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().deleteTable().run()}
              className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-400"
            >
              <Minus className="mr-2 h-4 w-4" />
              Delete Table
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Input Dialogs */}
      <InputDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        title="Insert Link"
        description="Enter the URL you want to link to"
        label="URL"
        placeholder="https://example.com"
        onConfirm={handleLinkConfirm}
      />
      <InputDialog
        open={issueDialogOpen}
        onOpenChange={setIssueDialogOpen}
        title="Insert GitHub Issue"
        description="Paste an issue URL or use owner/repo#123"
        label="Issue"
        placeholder="owner/repo#123 or https://github.com/owner/repo/issues/123"
        onConfirm={(value) => insertGitHubReference('issue', value)}
      />
      <InputDialog
        open={prDialogOpen}
        onOpenChange={setPrDialogOpen}
        title="Insert GitHub Pull Request"
        description="Paste a PR URL or use owner/repo#123"
        label="Pull Request"
        placeholder="owner/repo#123 or https://github.com/owner/repo/pull/123"
        onConfirm={(value) => insertGitHubReference('pr', value)}
      />
      <InputDialog
        open={githubCodeDialogOpen}
        onOpenChange={setGitHubCodeDialogOpen}
        title="Insert Code from GitHub"
        description="Use file path with optional line range (e.g. src/app/page.tsx#L10-L40)"
        label="File Path"
        placeholder="src/path/file.ts#L10-L40"
        onConfirm={insertGitHubCode}
        confirmText={isLoadingGitHubCode ? 'Loading...' : 'Insert Code'}
      />
    </div>
  );
}
