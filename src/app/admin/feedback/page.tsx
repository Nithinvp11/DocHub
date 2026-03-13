'use client';

import { useCallback, useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Bug,
  Lightbulb,
  MessageSquare,
  HelpCircle,
  Star,
  TrendingUp,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  Trash2,
  Reply,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

interface Feedback {
  id: string;
  type: string;
  category: string | null;
  title: string;
  description: string;
  rating: number | null;
  status: string;
  priority: string;
  url: string | null;
  userAgent: string | null;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  assignee: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
}

interface Stats {
  total: number;
  new: number;
  resolved: number;
  recentCount: number;
  averageRating: number;
  byStatus: { status: string; count: number }[];
  byType: { type: string; count: number }[];
  byPriority: { priority: string; count: number }[];
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [adminReply, setAdminReply] = useState('');
  const [updating, setUpdating] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const loadFeedback = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        admin: 'true',
        limit: '100',
      });
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);

      const response = await fetch(`/api/feedback?${params}`);
      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback);
      } else {
        // Surface server-side errors so admin knows why feedback didn't load
        let errMsg = `Failed to load feedback (${response.status})`;
        try {
          const body = await response.json();
          if (body?.error) errMsg = String(body.error);
          else if (body?.message) errMsg = String(body.message);
        } catch (e) {
          /* ignore JSON parse errors */
        }

        console.warn('[Admin Feedback] loadFeedback failed:', response.status, errMsg);
        toast.error(errMsg);
      }
    } catch (error) {
      console.error('Failed to load feedback:', error);
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, priorityFilter]);

  const loadStats = useCallback(async () => {
    try {
      const response = await fetch('/api/feedback/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  useEffect(() => {
    loadFeedback();
    loadStats();
  }, [loadFeedback, loadStats]);

  const updateFeedback = async (id: string, updates: Record<string, unknown>) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update feedback');
      }

      toast.success('Feedback updated successfully');
      loadFeedback();
      loadStats();

      if (selectedFeedback?.id === id) {
        setSelectedFeedback(null);
      }
    } catch (error) {
      console.error('Failed to update feedback:', error);
      toast.error('Failed to update feedback');
    } finally {
      setUpdating(false);
    }
  };

  const deleteFeedback = async (id: string) => {
    const confirmed = window.confirm('Delete this feedback item? This action cannot be undone.');
    if (!confirmed) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/feedback/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete feedback');
      }

      toast.success('Feedback deleted successfully');
      setSelectedFeedback(null);
      await Promise.all([loadFeedback(), loadStats()]);
    } catch (error) {
      console.error('Failed to delete feedback:', error);
      toast.error('Failed to delete feedback');
    } finally {
      setUpdating(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BUG':
        return <Bug className="h-4 w-4" />;
      case 'FEATURE':
        return <Lightbulb className="h-4 w-4" />;
      case 'IMPROVEMENT':
        return <TrendingUp className="h-4 w-4" />;
      case 'QUESTION':
        return <HelpCircle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'border border-blue-500/30 bg-blue-500/15 text-blue-400';
      case 'REVIEWING':
        return 'border border-orange-500/30 bg-orange-500/15 text-orange-400';
      case 'IN_PROGRESS':
        return 'border border-purple-500/30 bg-purple-500/15 text-purple-400';
      case 'RESOLVED':
        return 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-400';
      case 'CLOSED':
        return 'border border-slate-600/40 bg-slate-700/30 text-slate-400';
      case 'REJECTED':
        return 'border border-red-500/30 bg-red-500/15 text-red-400';
      default:
        return 'border border-slate-600/40 bg-slate-700/30 text-slate-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'border border-red-500/30 bg-red-500/15 text-red-400';
      case 'HIGH':
        return 'border border-orange-500/30 bg-orange-500/15 text-orange-400';
      case 'MEDIUM':
        return 'border border-orange-500/30 bg-orange-500/15 text-orange-400';
      case 'LOW':
        return 'border border-slate-600/30 bg-slate-700/20 text-slate-400';
      default:
        return 'border border-slate-600/30 bg-slate-700/20 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Feedback</h1>
          <p className="mt-1 text-sm text-slate-300">
            Manage and respond to user feedback, bug reports, and feature requests
          </p>
        </div>
        <button
          onClick={() => {
            loadFeedback();
            loadStats();
          }}
          className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/8 px-3.5 py-2 text-sm font-medium text-slate-200 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Total Feedback',
              value: stats.total,
              sub: `${stats.recentCount} in last 7 days`,
              icon: MessageSquare,
              accent: 'from-violet-600 to-purple-600',
              glow: 'shadow-purple-500/20',
            },
            {
              label: 'New Feedback',
              value: stats.new,
              sub: 'Awaiting review',
              icon: Clock,
              accent: 'from-blue-600 to-sky-600',
              glow: 'shadow-blue-500/20',
            },
            {
              label: 'Resolved',
              value: stats.resolved,
              sub: `${stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}% resolution rate`,
              icon: CheckCircle2,
              accent: 'from-emerald-600 to-teal-600',
              glow: 'shadow-emerald-500/20',
            },
            {
              label: 'Avg Rating',
              value: stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A',
              sub: null,
              icon: Star,
              accent: 'from-violet-500 to-fuchsia-500',
              glow: 'shadow-violet-500/20',
              stars: true,
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-3xl border border-white/12 bg-slate-900/52 p-5 shadow-xl ${card.glow} backdrop-blur-2xl`}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  {card.label}
                </p>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br ${card.accent} shadow-lg`}
                >
                  <card.icon className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold text-white">{String(card.value)}</p>
              {card.stars ? (
                <div className="mt-1 flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3 w-3 ${s <= Math.round(stats.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-700'}`}
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-xs text-slate-500">{card.sub}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-slate-900/52 p-5 backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-white">Filters</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              label: 'Type',
              value: typeFilter,
              setter: setTypeFilter,
              options: [
                ['all', 'All Types'],
                ['BUG', 'Bug Report'],
                ['FEATURE', 'Feature Request'],
                ['IMPROVEMENT', 'Improvement'],
                ['QUESTION', 'Question'],
                ['GENERAL', 'General'],
              ],
            },
            {
              label: 'Status',
              value: statusFilter,
              setter: setStatusFilter,
              options: [
                ['all', 'All Status'],
                ['NEW', 'New'],
                ['REVIEWING', 'Reviewing'],
                ['IN_PROGRESS', 'In Progress'],
                ['RESOLVED', 'Resolved'],
                ['CLOSED', 'Closed'],
                ['REJECTED', 'Rejected'],
              ],
            },
            {
              label: 'Priority',
              value: priorityFilter,
              setter: setPriorityFilter,
              options: [
                ['all', 'All Priorities'],
                ['CRITICAL', 'Critical'],
                ['HIGH', 'High'],
                ['MEDIUM', 'Medium'],
                ['LOW', 'Low'],
              ],
            },
          ].map((f) => (
            <div key={f.label} className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                {f.label}
              </label>
              <Select value={f.value} onValueChange={f.setter}>
                <SelectTrigger className="border-white/12 bg-white/6 text-white focus:border-violet-400/40 focus:ring-violet-400/15">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/12 bg-slate-900 text-white">
                  {f.options.map(([val, label]) => (
                    <SelectItem
                      key={val}
                      value={val}
                      className="focus:bg-purple-500/20 focus:text-white"
                    >
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback List */}
      <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-slate-900/52 backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Feedback Items ({feedback.length})</h2>
            <p className="text-xs text-slate-500">Click on any item to view details and manage</p>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-violet-500" />
          </div>
        ) : feedback.length === 0 ? (
          <div className="py-16 text-center">
            <MessageSquare className="mx-auto mb-3 h-10 w-10 text-slate-700" />
            <p className="text-sm text-slate-500">No feedback found matching the filters</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {feedback.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="group flex cursor-pointer items-start gap-4 px-5 py-4 transition-colors hover:bg-white/4"
                onClick={() => {
                  setSelectedFeedback(item);
                  setAdminReply(item.adminReply || '');
                }}
              >
                <Avatar className="h-9 w-9 shrink-0 ring-2 ring-white/8">
                  <AvatarImage src={item.user?.image || undefined} />
                  <AvatarFallback className="bg-linear-to-br from-purple-600 to-fuchsia-600 text-xs font-bold text-white">
                    {item.user?.name?.[0] || item.user?.email[0] || '?'}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(item.status)}`}
                    >
                      {item.status}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getPriorityColor(item.priority)}`}
                    >
                      {item.priority}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                      {getTypeIcon(item.type)}
                      {item.type}
                    </span>
                    {item.category && (
                      <span className="inline-flex rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-[10px] text-slate-500">
                        {item.category}
                        {item.adminReply && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                            <Reply className="h-2.5 w-2.5" />
                            Replied
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-white transition-colors group-hover:text-violet-300">
                    {item.title}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{item.description}</p>
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-600">
                    <span>{item.user?.name || item.user?.email || 'Anonymous'}</span>
                    <span>·</span>
                    <span>{formatDistanceToNow(new Date(item.createdAt))} ago</span>
                  </div>
                </div>

                {item.rating && (
                  <div className="flex shrink-0 gap-0.5">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Detail Dialog */}
      <Dialog open={!!selectedFeedback} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-white/12 bg-slate-900/96 text-white shadow-2xl shadow-black/30">
          {selectedFeedback && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-white">
                  {getTypeIcon(selectedFeedback.type)}
                  {selectedFeedback.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusColor(selectedFeedback.status)}`}
                  >
                    {selectedFeedback.status}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getPriorityColor(selectedFeedback.priority)}`}
                  >
                    {selectedFeedback.priority}
                  </span>
                  {selectedFeedback.category && (
                    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-400">
                      {selectedFeedback.category}
                    </span>
                  )}
                </div>

                {/* User Info */}
                <div className="flex items-center gap-3">
                  <Avatar className="ring-2 ring-white/10">
                    <AvatarImage src={selectedFeedback.user?.image || undefined} />
                    <AvatarFallback className="bg-linear-to-br from-purple-600 to-fuchsia-600 font-bold text-white">
                      {selectedFeedback.user?.name?.[0] || selectedFeedback.user?.email[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-white">
                      {selectedFeedback.user?.name || selectedFeedback.user?.email || 'Anonymous'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDistanceToNow(new Date(selectedFeedback.createdAt))} ago
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Description
                  </h4>
                  <p className="rounded-xl border border-white/8 bg-white/3 p-3 text-sm whitespace-pre-wrap text-slate-300">
                    {selectedFeedback.description}
                  </p>
                </div>

                {/* Rating */}
                {selectedFeedback.rating && (
                  <div>
                    <h4 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                      Rating
                    </h4>
                    <div className="flex gap-1">
                      {[...Array(selectedFeedback.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                )}

                {/* URL */}
                {selectedFeedback.url && (
                  <div>
                    <h4 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                      Page URL
                    </h4>
                    <a
                      href={selectedFeedback.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-violet-400 hover:text-violet-300 hover:underline"
                    >
                      {selectedFeedback.url}
                    </a>
                  </div>
                )}

                {/* Status Update */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Update Status
                  </label>
                  <Select
                    value={selectedFeedback.status}
                    onValueChange={(status) => updateFeedback(selectedFeedback.id, { status })}
                    disabled={updating}
                  >
                    <SelectTrigger className="border-white/12 bg-white/6 text-white focus:border-violet-400/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-white/12 bg-slate-900 text-white">
                      <SelectItem value="NEW">New</SelectItem>
                      <SelectItem value="REVIEWING">Reviewing</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority Update */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    Update Priority
                  </label>
                  <Select
                    value={selectedFeedback.priority}
                    onValueChange={(priority) => updateFeedback(selectedFeedback.id, { priority })}
                    disabled={updating}
                  >
                    <SelectTrigger className="border-white/12 bg-white/6 text-white focus:border-violet-400/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-white/12 bg-slate-900 text-white">
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Reply to User */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Reply className="h-3.5 w-3.5 text-slate-400" />
                    <label className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                      Reply to User
                    </label>
                    <span className="ml-auto text-[10px] text-slate-600">
                      optional — visible to user
                    </span>
                  </div>
                  {selectedFeedback.repliedAt && (
                    <p className="text-[10px] text-emerald-400">
                      Replied {formatDistanceToNow(new Date(selectedFeedback.repliedAt))} ago
                    </p>
                  )}
                  <Textarea
                    value={adminReply}
                    onChange={(e) => setAdminReply(e.target.value)}
                    placeholder="Write a reply to the user (they will receive a notification)..."
                    rows={4}
                    className="border-white/12 bg-white/6 text-white placeholder:text-slate-500 focus:border-emerald-400/40 focus:ring-emerald-400/15"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateFeedback(selectedFeedback.id, { adminReply })}
                      disabled={updating || adminReply === (selectedFeedback.adminReply || '')}
                      className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {selectedFeedback.adminReply ? 'Update Reply' : 'Send Reply'}
                    </button>
                    {selectedFeedback.adminReply && (
                      <button
                        onClick={() => {
                          setAdminReply('');
                          updateFeedback(selectedFeedback.id, { adminReply: '' });
                        }}
                        disabled={updating}
                        className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Remove Reply
                      </button>
                    )}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <button
                    onClick={() => deleteFeedback(selectedFeedback.id)}
                    disabled={updating}
                    className="flex items-center gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Feedback
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
