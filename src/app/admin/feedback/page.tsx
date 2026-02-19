'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  adminNotes: string | null;
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
  const [adminNotes, setAdminNotes] = useState('');
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
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'REVIEWING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'IN_PROGRESS':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'LOW':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Feedback</h1>
          <p className="text-muted-foreground">
            Manage and respond to user feedback, bug reports, and feature requests
          </p>
        </div>
        <Button
          onClick={() => {
            loadFeedback();
            loadStats();
          }}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
              <MessageSquare className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-muted-foreground text-xs">{stats.recentCount} in last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Feedback</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.new}</div>
              <p className="text-muted-foreground text-xs">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolved}</div>
              <p className="text-muted-foreground text-xs">
                {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}% resolution
                rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}
              </div>
              <div className="mt-1 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${
                      star <= Math.round(stats.averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="BUG">Bug Report</SelectItem>
                  <SelectItem value="FEATURE">Feature Request</SelectItem>
                  <SelectItem value="IMPROVEMENT">Improvement</SelectItem>
                  <SelectItem value="QUESTION">Question</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="REVIEWING">Reviewing</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Items ({feedback.length})</CardTitle>
          <CardDescription>Click on any item to view details and manage</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
            </div>
          ) : feedback.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No feedback found matching the filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedback.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="hover:border-primary cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedFeedback(item);
                      setAdminNotes(item.adminNotes || '');
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* User Avatar */}
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={item.user?.image || undefined} />
                          <AvatarFallback>
                            {item.user?.name?.[0] || item.user?.email[0] || '?'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-2">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="gap-1">
                                  {getTypeIcon(item.type)}
                                  {item.type}
                                </Badge>
                                <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                                <Badge className={getPriorityColor(item.priority)}>
                                  {item.priority}
                                </Badge>
                                {item.category && (
                                  <Badge variant="secondary">{item.category}</Badge>
                                )}
                              </div>
                              <h3 className="mt-2 font-semibold">{item.title}</h3>
                              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                                {item.description}
                              </p>
                            </div>

                            {item.rating && (
                              <div className="flex gap-0.5">
                                {[...Array(item.rating)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className="h-3 w-3 fill-yellow-400 text-yellow-400"
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="text-muted-foreground flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              <span>{item.user?.name || item.user?.email || 'Anonymous'}</span>
                              <span>•</span>
                              <span>{formatDistanceToNow(new Date(item.createdAt))} ago</span>
                            </div>
                            {item.assignee && (
                              <span className="flex items-center gap-1">
                                Assigned to {item.assignee.name || item.assignee.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback Detail Dialog */}
      <Dialog open={!!selectedFeedback} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {selectedFeedback && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getTypeIcon(selectedFeedback.type)}
                  {selectedFeedback.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={getStatusColor(selectedFeedback.status)}>
                    {selectedFeedback.status}
                  </Badge>
                  <Badge className={getPriorityColor(selectedFeedback.priority)}>
                    {selectedFeedback.priority}
                  </Badge>
                  {selectedFeedback.category && (
                    <Badge variant="secondary">{selectedFeedback.category}</Badge>
                  )}
                </div>

                {/* User Info */}
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedFeedback.user?.image || undefined} />
                    <AvatarFallback>
                      {selectedFeedback.user?.name?.[0] || selectedFeedback.user?.email[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {selectedFeedback.user?.name || selectedFeedback.user?.email || 'Anonymous'}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(selectedFeedback.createdAt))} ago
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="mb-2 font-semibold">Description</h4>
                  <p className="text-sm whitespace-pre-wrap">{selectedFeedback.description}</p>
                </div>

                {/* Rating */}
                {selectedFeedback.rating && (
                  <div>
                    <h4 className="mb-2 font-semibold">Rating</h4>
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
                    <h4 className="mb-2 font-semibold">Page URL</h4>
                    <a
                      href={selectedFeedback.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-sm hover:underline"
                    >
                      {selectedFeedback.url}
                    </a>
                  </div>
                )}

                {/* Status Update */}
                <div className="space-y-2">
                  <label className="font-semibold">Update Status</label>
                  <Select
                    value={selectedFeedback.status}
                    onValueChange={(status) => updateFeedback(selectedFeedback.id, { status })}
                    disabled={updating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                  <label className="font-semibold">Update Priority</label>
                  <Select
                    value={selectedFeedback.priority}
                    onValueChange={(priority) => updateFeedback(selectedFeedback.id, { priority })}
                    disabled={updating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Admin Notes */}
                <div className="space-y-2">
                  <label className="font-semibold">Admin Notes</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes (not visible to users)..."
                    rows={4}
                  />
                  <Button
                    onClick={() => updateFeedback(selectedFeedback.id, { adminNotes })}
                    disabled={updating || adminNotes === selectedFeedback.adminNotes}
                    size="sm"
                  >
                    Save Notes
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
