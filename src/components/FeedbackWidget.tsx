'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { MessageSquare, Bug, Lightbulb, HelpCircle, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface FeedbackWidgetProps {
  trigger?: React.ReactNode;
  className?: string;
}

export function FeedbackWidget({ trigger, className = '' }: FeedbackWidgetProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    type: 'GENERAL',
    category: '',
    title: '',
    description: '',
    rating: 0,
  });

  const feedbackTypes = [
    { value: 'BUG', label: 'Bug Report', icon: Bug, color: 'text-red-600' },
    { value: 'FEATURE', label: 'Feature Request', icon: Lightbulb, color: 'text-yellow-600' },
    { value: 'IMPROVEMENT', label: 'Improvement', icon: Star, color: 'text-blue-600' },
    { value: 'QUESTION', label: 'Question', icon: HelpCircle, color: 'text-purple-600' },
    { value: 'GENERAL', label: 'General Feedback', icon: MessageSquare, color: 'text-gray-600' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Client-side rating validation (defensive)
    if (formData.rating !== 0 && (formData.rating < 1 || formData.rating > 5)) {
      toast.error('Rating must be between 1 and 5');
      return;
    }

    // Prevent submit during server-enforced cooldown
    if (cooldownUntil && Date.now() < cooldownUntil) {
      const seconds = Math.ceil((cooldownUntil - Date.now()) / 1000);
      toast.error(`Too many submissions. Try again in ${seconds}s`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          url: window.location.href,
          rating: formData.rating || null,
        }),
      });

      if (!response.ok) {
        // Try to show the server-provided error message (if any) instead of throwing a generic error
        let errMsg = 'Failed to submit feedback';
        try {
          const errBody = await response.json();
          if (errBody?.error) errMsg = String(errBody.error);
          else if (errBody?.message) errMsg = String(errBody.message);
        } catch (e) {
          // ignore parse errors
        }

        // If rate-limited, respect Retry-After and set a local cooldown
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          if (retryAfter) {
            const seconds = parseInt(retryAfter, 10) || 3600;
            setCooldownUntil(Date.now() + seconds * 1000);
            // clear cooldown after expiry so UI re-enables
            setTimeout(() => setCooldownUntil(null), seconds * 1000);
            errMsg += ` — try again in ${seconds} seconds`;
          }
        }

        // Log only server/internal errors as console.error to avoid noisy devtools errors for expected 4xx responses
        if (response.status >= 500) {
          console.error('Feedback submission failed:', response.status, errMsg);
        } else {
          console.warn(
            'Feedback submission failed (client/server validation):',
            response.status,
            errMsg
          );
        }

        toast.error(errMsg);
        setLoading(false);
        return;
      }

      toast.success('Thank you for your feedback! 🎉', {
        description: 'We appreciate your input and will review it soon.',
      });

      setFormData({
        type: 'GENERAL',
        category: '',
        title: '',
        description: '',
        rating: 0,
      });
      setOpen(false);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = feedbackTypes.find((t) => t.value === formData.type);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className={className}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border border-purple-500/20 bg-linear-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-purple-500 to-transparent" />

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
            <div className="rounded-lg bg-linear-to-br from-purple-600 to-fuchsia-600 p-2">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            Share Your Feedback
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Help us improve by sharing your thoughts, reporting bugs, or suggesting new features.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feedback Type */}
          <div className="space-y-3">
            <Label className="text-white">Feedback Type *</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {feedbackTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.type === type.value;
                return (
                  <motion.button
                    key={type.value}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-white/10 bg-slate-800/50 hover:border-white/20'
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 ${isSelected ? 'text-purple-400' : 'text-slate-400'}`}
                    />
                    <span className="text-center text-xs font-medium text-white">{type.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-white">
              Category (Optional)
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="border-white/20 bg-slate-800/50 text-white focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="border-white/20 bg-slate-800 text-white">
                <SelectItem value="ui-ux">UI/UX</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="documentation">Documentation</SelectItem>
                <SelectItem value="github-integration">GitHub Integration</SelectItem>
                <SelectItem value="collaboration">Collaboration</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">
              Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief summary of your feedback"
              className="border-white/20 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Description *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Please provide details about your feedback..."
              rows={6}
              className="border-white/20 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
              required
            />
            <p className="text-xs text-slate-400">
              {formData.type === 'BUG'
                ? 'Please describe what happened, what you expected, and steps to reproduce.'
                : formData.type === 'FEATURE'
                  ? "Describe the feature you'd like to see and how it would help you."
                  : 'Share your thoughts and suggestions.'}
            </p>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label className="text-white">Overall Experience (Optional)</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setFormData({ ...formData, rating: star })}
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= formData.rating ? 'fill-violet-400 text-violet-400' : 'text-slate-600'
                    }`}
                  />
                </motion.button>
              ))}
              {formData.rating > 0 && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: 0 })}
                  className="ml-2 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 border-white/20 bg-slate-800/50 text-white hover:bg-slate-700/50"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-linear-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-700 hover:to-fuchsia-700"
              disabled={loading || (cooldownUntil !== null && Date.now() < cooldownUntil)}
            >
              {loading
                ? 'Submitting...'
                : cooldownUntil && Date.now() < cooldownUntil
                  ? 'Try later'
                  : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
