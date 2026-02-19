'use client';

import { useEffect, useState } from 'react';
import { X, Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Shortcut {
  keys: string;
  description: string;
  category?: string;
}

const shortcuts: Record<string, Shortcut[]> = {
  editing: [
    { keys: 'Ctrl+B', description: 'Bold text' },
    { keys: 'Ctrl+I', description: 'Italic text' },
    { keys: 'Ctrl+U', description: 'Underline text' },
    { keys: 'Ctrl+Shift+X', description: 'Strikethrough' },
    { keys: 'Ctrl+E', description: 'Inline code' },
    { keys: 'Ctrl+Alt+1', description: 'Heading 1' },
    { keys: 'Ctrl+Alt+2', description: 'Heading 2' },
    { keys: 'Ctrl+Alt+3', description: 'Heading 3' },
    { keys: 'Ctrl+Shift+8', description: 'Bullet list' },
    { keys: 'Ctrl+Shift+7', description: 'Numbered list' },
    { keys: 'Ctrl+Shift+9', description: 'Task list' },
    { keys: 'Ctrl+K', description: 'Insert link' },
    { keys: 'Ctrl+Shift+C', description: 'Code block' },
    { keys: 'Ctrl+Shift+Q', description: 'Blockquote' },
    { keys: 'Ctrl+Shift+H', description: 'Horizontal rule' },
  ],
  navigation: [
    { keys: 'Ctrl+/', description: 'Toggle this help' },
    { keys: 'Tab', description: 'Next element' },
    { keys: 'Shift+Tab', description: 'Previous element' },
    { keys: 'Alt+S', description: 'Skip to content' },
    { keys: 'Esc', description: 'Close dialog' },
    { keys: 'Ctrl+P', description: 'Quick search' },
    { keys: 'Ctrl+N', description: 'New document' },
    { keys: '/', description: 'Focus search' },
  ],
  history: [
    { keys: 'Ctrl+Z', description: 'Undo' },
    { keys: 'Ctrl+Y', description: 'Redo' },
    { keys: 'Ctrl+Shift+Z', description: 'Redo (alt)' },
    { keys: 'Ctrl+S', description: 'Save' },
    { keys: 'Ctrl+Shift+V', description: 'Version history' },
  ],
  general: [
    { keys: 'Ctrl+A', description: 'Select all' },
    { keys: 'Ctrl+C', description: 'Copy' },
    { keys: 'Ctrl+X', description: 'Cut' },
    { keys: 'Ctrl+V', description: 'Paste' },
    { keys: 'Ctrl+,', description: 'Settings' },
  ],
};

const KeyBadge = ({ keys }: { keys: string }) => {
  const keyArray = keys.split('+');
  return (
    <div className="flex gap-1">
      {keyArray.map((key, index) => (
        <span key={index} className="inline-flex items-center">
          <kbd className="rounded border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            {key}
          </kbd>
          {index < keyArray.length - 1 && <span className="mx-1 text-slate-400">+</span>}
        </span>
      ))}
    </div>
  );
};

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+/ or Cmd+/ to toggle shortcuts modal
      if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Floating help button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed right-6 bottom-6 z-40 rounded-full bg-blue-600 p-3 text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:outline-none"
        aria-label="Show keyboard shortcuts (Ctrl+/)"
        title="Keyboard Shortcuts (Ctrl+/)"
      >
        <Keyboard className="h-5 w-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Keyboard className="h-6 w-6" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Press <kbd className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold">Ctrl</kbd>
              {' + '}
              <kbd className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold">/</kbd> anytime
              to toggle this help
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="editing" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="editing">Editing</TabsTrigger>
              <TabsTrigger value="navigation">Navigation</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="general">General</TabsTrigger>
            </TabsList>

            <TabsContent value="editing" className="mt-4 space-y-2">
              <div className="rounded-lg border border-slate-200 bg-white">
                {shortcuts.editing.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50"
                  >
                    <span className="text-sm text-slate-700">{shortcut.description}</span>
                    <KeyBadge keys={shortcut.keys} />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="navigation" className="mt-4 space-y-2">
              <div className="rounded-lg border border-slate-200 bg-white">
                {shortcuts.navigation.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50"
                  >
                    <span className="text-sm text-slate-700">{shortcut.description}</span>
                    <KeyBadge keys={shortcut.keys} />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-4 space-y-2">
              <div className="rounded-lg border border-slate-200 bg-white">
                {shortcuts.history.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50"
                  >
                    <span className="text-sm text-slate-700">{shortcut.description}</span>
                    <KeyBadge keys={shortcut.keys} />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="general" className="mt-4 space-y-2">
              <div className="rounded-lg border border-slate-200 bg-white">
                {shortcuts.general.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50"
                  >
                    <span className="text-sm text-slate-700">{shortcut.description}</span>
                    <KeyBadge keys={shortcut.keys} />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
            <p className="font-semibold">💡 Tip:</p>
            <p className="mt-1">
              On macOS, use{' '}
              <kbd className="rounded bg-blue-100 px-1.5 py-0.5 font-semibold">Cmd</kbd> instead of{' '}
              <kbd className="rounded bg-blue-100 px-1.5 py-0.5 font-semibold">Ctrl</kbd> for most
              shortcuts.
            </p>
          </div>

          <Button
            onClick={() => setOpen(false)}
            variant="outline"
            className="mt-4 w-full"
            aria-label="Close keyboard shortcuts"
          >
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
