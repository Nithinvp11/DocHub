'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send } from 'lucide-react';

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

export function CommentsDialog({ documentId }: { documentId: string }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const loadComments = async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleOpen = (value: boolean) => {
    setOpen(value);
    if (value) {
      loadComments();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        setNewComment('');
        loadComments();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
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

      if (res.ok) {
        loadComments();
      }
    } catch (error) {
      console.error('Error resolving comment:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10"
        >
          <MessageSquare className="h-4 w-4" />
          Comments
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Document Comments</DialogTitle>
          <DialogDescription className="text-slate-400">
            Discuss this document with your team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 border-b border-white/10 pb-4">
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm font-semibold text-white">
              Add Comment
            </Label>
            <Textarea
              id="comment"
              placeholder="Share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="border-white/20 bg-white/5 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-700 hover:to-fuchsia-700 disabled:opacity-50"
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
              <p className="text-sm whitespace-pre-wrap text-slate-200">{comment.content}</p>
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
