'use client';

import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Check, X, Reply, Trash2, Edit2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface CommentAuthor {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface CommentReply {
  id: string;
  content: string;
  author: CommentAuthor;
  createdAt: Date;
  updatedAt: Date;
}

interface InlineComment {
  id: string;
  content: string;
  selectedText: string;
  selectionStart: number;
  selectionEnd: number;
  resolved: boolean;
  author: CommentAuthor;
  replies: CommentReply[];
  createdAt: Date;
  updatedAt: Date;
}

interface InlineCommentsProps {
  documentId: string;
  currentUserId: string;
  onCommentClick?: (comment: InlineComment) => void;
  className?: string;
}

export function InlineComments({
  documentId,
  currentUserId,
  onCommentClick,
  className,
}: InlineCommentsProps) {
  const [comments, setComments] = useState<InlineComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetchComments();
  }, [documentId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/documents/${documentId}/inline-comments`);

      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (commentId: string, resolved: boolean) => {
    try {
      const response = await fetch(
        `/api/documents/${documentId}/inline-comments?commentId=${commentId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resolved }),
        }
      );

      if (response.ok) {
        setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, resolved } : c)));
      }
    } catch (error) {
      console.error('Error resolving comment:', error);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    try {
      const response = await fetch(`/api/documents/${documentId}/inline-comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          parentId,
          selectionStart: 0,
          selectionEnd: 0,
          selectedText: '',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments((prev) =>
          prev.map((c) => (c.id === parentId ? { ...c, replies: [...c.replies, data.comment] } : c))
        );
        setReplyContent('');
        setReplyingTo(null);
      }
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch(
        `/api/documents/${documentId}/inline-comments?commentId=${commentId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: editContent }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setComments((prev) => prev.map((c) => (c.id === commentId ? data.comment : c)));
        setEditingComment(null);
        setEditContent('');
      }
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(
        `/api/documents/${documentId}/inline-comments?commentId=${commentId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const unresolvedComments = comments.filter((c) => !c.resolved);
  const resolvedComments = comments.filter((c) => c.resolved);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments
          </span>
          <Badge variant="secondary" className="text-xs">
            {unresolvedComments.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="text-muted-foreground py-4 text-sm">Loading comments...</div>
        ) : (
          <>
            {/* Unresolved Comments */}
            {unresolvedComments.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Open ({unresolvedComments.length})
                </h3>
                {unresolvedComments.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    currentUserId={currentUserId}
                    onResolve={handleResolve}
                    onReply={() => setReplyingTo(comment.id)}
                    onEdit={() => {
                      setEditingComment(comment.id);
                      setEditContent(comment.content);
                    }}
                    onDelete={handleDelete}
                    onClick={() => onCommentClick?.(comment)}
                    isReplying={replyingTo === comment.id}
                    isEditing={editingComment === comment.id}
                    replyContent={replyContent}
                    editContent={editContent}
                    onReplyContentChange={setReplyContent}
                    onEditContentChange={setEditContent}
                    onSubmitReply={() => handleReply(comment.id)}
                    onSubmitEdit={() => handleEdit(comment.id)}
                    onCancelReply={() => {
                      setReplyingTo(null);
                      setReplyContent('');
                    }}
                    onCancelEdit={() => {
                      setEditingComment(null);
                      setEditContent('');
                    }}
                  />
                ))}
              </div>
            )}

            {/* Resolved Comments */}
            {resolvedComments.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Resolved ({resolvedComments.length})
                </h3>
                {resolvedComments.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    currentUserId={currentUserId}
                    onResolve={handleResolve}
                    onClick={() => onCommentClick?.(comment)}
                  />
                ))}
              </div>
            )}

            {comments.length === 0 && (
              <div className="text-muted-foreground py-8 text-center text-sm">
                <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>No comments yet</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface CommentCardProps {
  comment: InlineComment;
  currentUserId: string;
  onResolve: (id: string, resolved: boolean) => void;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: (id: string) => void;
  onClick?: () => void;
  isReplying?: boolean;
  isEditing?: boolean;
  replyContent?: string;
  editContent?: string;
  onReplyContentChange?: (content: string) => void;
  onEditContentChange?: (content: string) => void;
  onSubmitReply?: () => void;
  onSubmitEdit?: () => void;
  onCancelReply?: () => void;
  onCancelEdit?: () => void;
}

function CommentCard({
  comment,
  currentUserId,
  onResolve,
  onReply,
  onEdit,
  onDelete,
  onClick,
  isReplying,
  isEditing,
  replyContent,
  editContent,
  onReplyContentChange,
  onEditContentChange,
  onSubmitReply,
  onSubmitEdit,
  onCancelReply,
  onCancelEdit,
}: CommentCardProps) {
  const isAuthor = comment.author.id === currentUserId;

  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-colors',
        comment.resolved ? 'bg-muted/50 border-muted' : 'bg-card border-border',
        onClick && 'hover:border-primary/50 cursor-pointer'
      )}
      onClick={onClick}
    >
      {/* Selected text quote */}
      <div className="bg-muted/50 border-primary/50 mb-2 rounded border-l-2 p-2 text-xs italic">
        &ldquo;{comment.selectedText}&rdquo;
      </div>

      {/* Comment content */}
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Avatar className="h-6 w-6 flex-shrink-0">
            <AvatarImage
              src={comment.author.image || undefined}
              alt={comment.author.name || comment.author.email}
            />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {(comment.author.name || comment.author.email)[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="truncate text-sm font-medium">
                {comment.author.name || comment.author.email}
              </span>
              <span className="text-muted-foreground shrink-0 text-xs">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => onEditContentChange?.(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={onSubmitEdit}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onCancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-foreground text-sm">{comment.content}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        {!isEditing && (
          <div className="ml-8 flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onResolve(comment.id, !comment.resolved);
              }}
            >
              {comment.resolved ? (
                <>
                  <X className="mr-1 h-3 w-3" />
                  Unresolve
                </>
              ) : (
                <>
                  <Check className="mr-1 h-3 w-3" />
                  Resolve
                </>
              )}
            </Button>

            {!comment.resolved && onReply && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onReply();
                }}
              >
                <Reply className="mr-1 h-3 w-3" />
                Reply
              </Button>
            )}

            {isAuthor && onEdit && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Edit2 className="mr-1 h-3 w-3" />
                Edit
              </Button>
            )}

            {isAuthor && onDelete && (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(comment.id);
                }}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Delete
              </Button>
            )}
          </div>
        )}

        {/* Reply form */}
        {isReplying && (
          <div className="ml-8 space-y-2 pt-2">
            <Textarea
              value={replyContent}
              onChange={(e) => onReplyContentChange?.(e.target.value)}
              placeholder="Write a reply..."
              className="min-h-[60px] text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={onSubmitReply}>
                <Send className="mr-1 h-3 w-3" />
                Reply
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancelReply}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="border-muted ml-8 space-y-2 border-l-2 pt-2 pl-3">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="flex items-start gap-2">
                <Avatar className="h-5 w-5 flex-shrink-0">
                  <AvatarImage
                    src={reply.author.image || undefined}
                    alt={reply.author.name || reply.author.email}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {(reply.author.name || reply.author.email)[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="truncate text-xs font-medium">
                      {reply.author.name || reply.author.email}
                    </span>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-foreground text-xs">{reply.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
