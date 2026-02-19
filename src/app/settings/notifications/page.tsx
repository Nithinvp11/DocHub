'use client';

import { useState, useEffect } from 'react';
import {
  PremiumCard,
  PremiumCardContent,
  PremiumCardDescription,
  PremiumCardHeader,
  PremiumCardTitle,
} from '@/components/ui/card-premium';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button-premium';
import { PremiumBadge } from '@/components/ui/badge-premium';
import {
  Bell,
  Mail,
  Save,
  Loader2,
  Check,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Share2,
  GitPullRequest,
  AlertTriangle,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface NotificationPreferences {
  id: string;
  userId: string;
  // In-app notifications
  commentMention: boolean;
  documentShared: boolean;
  githubPrReview: boolean;
  githubIssueAssigned: boolean;
  versionConflict: boolean;
  workspaceInvite: boolean;
  // Email notifications
  emailCommentMention: boolean;
  emailDocumentShared: boolean;
  emailGithubPrReview: boolean;
  emailGithubIssueAssigned: boolean;
  emailVersionConflict: boolean;
  emailWorkspaceInvite: boolean;
  createdAt: string;
  updatedAt: string;
}

type NotificationToggleKey =
  | 'commentMention'
  | 'documentShared'
  | 'githubPrReview'
  | 'githubIssueAssigned'
  | 'versionConflict'
  | 'workspaceInvite';

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications/preferences');
      if (res.ok) {
        const data = await res.json();
        setPreferences(data);
      } else {
        throw new Error('Failed to fetch preferences');
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (field: keyof NotificationPreferences) => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      [field]: !preferences[field],
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      const res = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentMention: preferences.commentMention,
          documentShared: preferences.documentShared,
          githubPrReview: preferences.githubPrReview,
          githubIssueAssigned: preferences.githubIssueAssigned,
          versionConflict: preferences.versionConflict,
          workspaceInvite: preferences.workspaceInvite,
          emailCommentMention: preferences.emailCommentMention,
          emailDocumentShared: preferences.emailDocumentShared,
          emailGithubPrReview: preferences.emailGithubPrReview,
          emailGithubIssueAssigned: preferences.emailGithubIssueAssigned,
          emailVersionConflict: preferences.emailVersionConflict,
          emailWorkspaceInvite: preferences.emailWorkspaceInvite,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setPreferences(updated);
        setHasChanges(false);
        toast.success('Notification preferences updated successfully');
      } else {
        throw new Error('Failed to update preferences');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update notification preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4">
        <div className="container mx-auto max-w-5xl px-4 py-8">
          <div className="flex h-64 items-center justify-center">
            <div className="space-y-4 text-center">
              <Loader2 className="text-primary-600 mx-auto h-12 w-12 animate-spin" />
              <p className="text-text-secondary">Loading preferences...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="min-h-screen p-4">
        <div className="container mx-auto max-w-5xl px-4 py-8">
          <PremiumCard>
            <PremiumCardContent className="py-8">
              <div className="space-y-3 text-center">
                <AlertCircle className="text-text-tertiary mx-auto h-12 w-12" />
                <p className="text-text-secondary">Failed to load preferences</p>
                <Button variant="primary" onClick={fetchPreferences}>
                  Try Again
                </Button>
              </div>
            </PremiumCardContent>
          </PremiumCard>
        </div>
      </div>
    );
  }

  const notificationCategories: Array<{
    id: NotificationToggleKey;
    title: string;
    description: string;
    icon: typeof Bell;
    iconColor: string;
    bgColor: string;
  }> = [
    {
      id: 'commentMention',
      title: 'Comment Mentions',
      description: 'When someone mentions you in a comment',
      icon: MessageSquare,
      iconColor: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      id: 'documentShared',
      title: 'Document Shared',
      description: 'When a document is shared with you',
      icon: Share2,
      iconColor: 'text-secondary-600',
      bgColor: 'bg-secondary-50',
    },
    {
      id: 'githubPrReview',
      title: 'GitHub PR Review',
      description: 'When a pull request is ready for review',
      icon: GitPullRequest,
      iconColor: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      id: 'githubIssueAssigned',
      title: 'GitHub Issue Assigned',
      description: 'When an issue is assigned to you',
      icon: AlertCircle,
      iconColor: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      id: 'versionConflict',
      title: 'Version Conflicts',
      description: "When there's a version conflict",
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      id: 'workspaceInvite',
      title: 'Workspace Invitations',
      description: "When you're invited to a workspace",
      icon: UserPlus,
      iconColor: 'text-secondary-600',
      bgColor: 'bg-secondary-50',
    },
  ];

  const activeNotifications = notificationCategories.filter(
    (cat) => preferences[cat.id as keyof NotificationPreferences]
  ).length;

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-premium-lg from-primary-500 to-primary-600 shadow-premium-lg bg-linear-to-br p-3">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="from-primary-600 to-primary-700 bg-linear-to-r bg-clip-text text-3xl font-bold text-transparent">
                    Notification Preferences
                  </h1>
                  <p className="text-text-secondary mt-1">
                    Manage how you receive notifications about workspace activities
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <PremiumBadge variant="primary" className="gap-2">
              <Check className="h-3.5 w-3.5" />
              <span>
                {activeNotifications} of {notificationCategories.length} active
              </span>
            </PremiumBadge>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const allEnabled: NotificationPreferences = { ...preferences };
                notificationCategories.forEach((cat) => {
                  allEnabled[cat.id] = true;
                });
                setPreferences(allEnabled);
                setHasChanges(true);
              }}
            >
              Enable All
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const allDisabled: NotificationPreferences = { ...preferences };
                notificationCategories.forEach((cat) => {
                  allDisabled[cat.id] = false;
                });
                setPreferences(allDisabled);
                setHasChanges(true);
              }}
            >
              Disable All
            </Button>
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* In-App Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <PremiumCard>
              <PremiumCardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-premium bg-primary-50 p-2">
                      <Bell className="text-primary-600 h-5 w-5" />
                    </div>
                    <div>
                      <PremiumCardTitle>In-App Notifications</PremiumCardTitle>
                      <PremiumCardDescription>
                        Control which notifications appear in your notification bell
                      </PremiumCardDescription>
                    </div>
                  </div>
                  <PremiumBadge variant="secondary">{activeNotifications} active</PremiumBadge>
                </div>
              </PremiumCardHeader>
              <PremiumCardContent className="space-y-1">
                {notificationCategories.map((category, index) => {
                  const Icon = category.icon;
                  return (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + index * 0.05 }}
                      className="group rounded-premium hover:bg-base-100 flex items-center justify-between p-4 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`rounded-lg p-2.5 ${category.bgColor} transition-transform group-hover:scale-110`}
                        >
                          <Icon className={`h-5 w-5 ${category.iconColor}`} />
                        </div>
                        <div className="space-y-0.5">
                          <Label htmlFor={category.id} className="cursor-pointer font-semibold">
                            {category.title}
                          </Label>
                          <p className="text-text-secondary text-sm">{category.description}</p>
                        </div>
                      </div>
                      <Switch
                        id={category.id}
                        checked={
                          preferences[category.id as keyof NotificationPreferences] as boolean
                        }
                        onCheckedChange={() =>
                          handleToggle(category.id as keyof NotificationPreferences)
                        }
                      />
                    </motion.div>
                  );
                })}
              </PremiumCardContent>
            </PremiumCard>
          </motion.div>

          {/* Email Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <PremiumCard>
              <PremiumCardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-premium bg-secondary-50 p-2">
                      <Mail className="text-secondary-600 h-5 w-5" />
                    </div>
                    <div>
                      <PremiumCardTitle>Email Notifications</PremiumCardTitle>
                      <PremiumCardDescription>
                        Control which notifications are sent to your email
                      </PremiumCardDescription>
                    </div>
                  </div>
                  <PremiumBadge variant="info" className="gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    Coming Soon
                  </PremiumBadge>
                </div>
              </PremiumCardHeader>
              <PremiumCardContent className="space-y-4">
                <div className="rounded-premium mb-4 border-2 border-amber-200 bg-linear-to-br from-amber-50 to-yellow-50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-premium bg-amber-100 p-2">
                      <Sparkles className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-amber-900">Email Integration Coming Soon</p>
                      <p className="text-sm text-amber-800">
                        Email notifications are currently disabled. These settings will be activated
                        in a future update when email functionality is implemented with proper email
                        service integration.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pointer-events-none space-y-1 opacity-50">
                  {notificationCategories.map((category) => {
                    const Icon = category.icon;
                    const emailKey = `email${
                      category.id.charAt(0).toUpperCase() + category.id.slice(1)
                    }` as keyof NotificationPreferences;

                    return (
                      <div
                        key={emailKey}
                        className="rounded-premium flex items-center justify-between p-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`rounded-premium p-2.5 ${category.bgColor}`}>
                            <Icon className={`h-5 w-5 ${category.iconColor}`} />
                          </div>
                          <div className="space-y-0.5">
                            <Label className="font-semibold">{category.title}</Label>
                            <p className="text-text-secondary text-sm">
                              Email {category.description.toLowerCase()}
                            </p>
                          </div>
                        </div>
                        <Switch checked={preferences[emailKey] as boolean} disabled />
                      </div>
                    );
                  })}
                </div>
              </PremiumCardContent>
            </PremiumCard>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="sticky bottom-4 flex justify-end gap-3 pt-6"
          >
            <Button
              variant="secondary"
              onClick={fetchPreferences}
              disabled={!hasChanges || saving}
              size="lg"
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!hasChanges || saving}
              size="lg"
              className="min-w-[140px]"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Save Changes
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
