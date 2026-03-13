'use client';

import { useState, useRef } from 'react';
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

interface Member {
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

function getMentionHandle(member: Member): string {
  const name = member.user.name;
  if (name) return name.replace(/\s+/g, '').toLowerCase();
  return member.user.email.split('@')[0];
}

function renderCommentWithMentions(content: string): React.ReactNode {
  const parts = content.split(/(@\w+)/g);
  return parts.map((part, i) =>
    /^@\w+$/.test(part) ? (
      <span key={i} className="font-semibold text-purple-400">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

interface Comment {
  id: string;
  content: string;
  resolved: boolean;
  createdAt: string;
  author: {
    name: string | null;
    email: string;
  };
}

export function CommentsDialog({
  documentId,
  workspaceId,
}: {
  documentId: string;
  workspaceId: string;
}) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(0);
  const [mentionedUserIds, setMentionedUserIds] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadComments = async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/comments`);
      if (res.ok) setComments(await res.json());
    } catch {
      console.error('Error loading comments');
    }
  };

  const loadMembers = async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(Array.isArray(data) ? data : (data.members ?? []));
      }
    } catch {
      console.error('Error loading members');
    }
  };

  const handleOpen = (value: boolean) => {
    setOpen(value);
    if (value) {
      loadComments();
      loadMembers();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);
    const cursor = e.target.selectionStart ?? value.length;
    const textBefore = value.slice(0, cursor);
    const match = textBefore.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionStart(cursor - match[0].length);
    } else {
      setMentionQuery(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape' && mentionQuery !== null) {
      e.preventDefault();
      setMentionQuery(null);
    }
  };

  const insertMention = (member: Member) => {
    const handle = getMentionHandle(member);
    const cursorPos = textareaRef.current?.selectionStart ?? newComment.length;
    const before = newComment.slice(0, mentionStart);
    const after = newComment.slice(cursorPos);
    const inserted = `${before}@${handle} ${after}`;
    setNewComment(inserted);
    setMentionedUserIds((prev) => new Set(prev).add(member.user.id));
    setMentionQuery(null);
    setTimeout(() => {
      const pos = before.length + handle.length + 2;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(pos, pos);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    // Catch manually-typed @mentions (without autocomplete)
    const handles = [...newComment.matchAll(/@(\w+)/g)].map((m) => m[1]);
    const extraIds = members
      .filter((m) => handles.includes(getMentionHandle(m)))
      .map((m) => m.user.id);
    const allMentionedIds = Array.from(new Set([...mentionedUserIds, ...extraIds]));

    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment, mentionedUserIds: allMentionedIds }),
      });

      if (res.ok) {
        setNewComment('');
        setMentionedUserIds(new Set());
        setMentionQuery(null);
        await loadComments();
        toast.success('Comment posted');
      } else {
        toast.error('Failed to post comment');
      }
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (commentId: string) => {
    try {
      const res = await fetch(`/api/documents/${documentId}/comments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, resolved: true }),
      });
      if (res.ok) loadComments();
    } catch {
      console.error('Error resolving comment');
    }
  };

  const filteredMembers =
    mentionQuery !== null
      ? members.filter((m) => {
          const handle = getMentionHandle(m);
          const name = (m.user.name ?? '').toLowerCase();
          const q = mentionQuery.toLowerCase();
          return handle.startsWith(q) || name.startsWith(q);
        })
      : [];

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-white/20 bg-slate-900/60 text-slate-100 hover:border-purple-400/50 hover:bg-slate-800/90 hover:text-white"
        >
          <MessageSquare className="h-4 w-4" />
          Comments
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto border border-white/10 bg-slate-900 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Document Comments</DialogTitle>
          <DialogDescription className="text-slate-400">
            Discuss this document with your team. Type{' '}
            <code className="rounded bg-purple-500/20 px-1 text-purple-300">@</code> to mention a
            member.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 border-b border-white/10 pb-4">
          <div className="relative space-y-2">
            <label className="text-sm font-semibold text-white">Add Comment</label>
            <Textarea
              ref={textareaRef}
              placeholder="Share your thoughts... Type @ to mention someone"
              value={newComment}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              rows={3}
              className="border-white/20 bg-white/5 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
            />
            {/* @mention dropdown */}
            {filteredMembers.length > 0 && mentionQuery !== null && (
              <div className="absolute z-50 mt-1 w-60 overflow-hidden rounded-xl border border-white/10 bg-slate-800 shadow-2xl shadow-purple-900/30">
                {filteredMembers.slice(0, 6).map((m) => (
                  <button
                    key={m.user.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertMention(m);
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-white/10"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-300">
                      {(m.user.name ?? m.user.email)[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">
                        {m.user.name ?? m.user.email.split('@')[0]}
                      </p>
                      <p className="truncate text-[11px] text-slate-400">@{getMentionHandle(m)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {mentionQuery !== null && mentionQuery.length > 0 && filteredMembers.length === 0 && (
              <p className="text-xs text-slate-500">No members match &quot;{mentionQuery}&quot;</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="gap-2 bg-linear-to-r from-purple-600 to-fuchsia-600 text-white hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {loading ? 'Posting...' : 'Post Comment'}
          </Button>
        </form>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white">
            {comments.length === 0 ? 'No comments yet' : `${comments.length} Comments`}
          </h3>
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`rounded-xl border border-white/10 bg-slate-900/40 p-4 transition-all ${
                comment.resolved ? 'border-green-500/20 bg-green-500/5 opacity-60' : ''
              }`}
            >
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {comment.author.name || comment.author.email}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(comment.createdAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                    })}
                  </p>
                </div>
                {!comment.resolved && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResolve(comment.id)}
                    className="text-slate-300 hover:bg-white/10 hover:text-white"
                  >
                    Resolve
                  </Button>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap text-slate-200">
                {renderCommentWithMentions(comment.content)}
              </p>
              {comment.resolved && (
                <p className="mt-2 flex items-center gap-1 text-xs text-green-400">
                  <span className="inline-block h-4 w-4 rounded-full bg-green-500/20 text-center">
                    ✓
                  </span>
                  Resolved
                </p>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
