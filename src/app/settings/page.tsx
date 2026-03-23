'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { SettingsSkeleton } from '@/components/LoadingStates';
import { FeedbackWidget } from '@/components/FeedbackWidget';
import { DeleteAccountModal } from '@/components/DeleteAccountModal';
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Settings,
  Trash2,
  MessageSquare,
  Star,
  HelpCircle,
  Sparkles,
  Users,
  FileText,
  Calendar,
  Crown,
  UserMinus,
  ExternalLink,
  Shield,
  Key,
  ArrowLeft,
  ArrowLeftRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Reply } from 'lucide-react';

interface UserFeedbackItem {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  rating: number | null;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  hasPassword?: boolean;
  githubLinked?: boolean;
}

interface WorkspaceSettings {
  id: string;
  name: string;
  description: string | null;
  memberLimit: number | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  members: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  }>;
  _count: { documents: number };
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('security');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Workspace actions
  const [deletingWorkspace, setDeletingWorkspace] = useState<string | null>(null);
  // User feedback submissions
  const [myFeedback, setMyFeedback] = useState<UserFeedbackItem[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const [leavingWorkspace, setLeavingWorkspace] = useState<string | null>(null);
  const [transferringWorkspace, setTransferringWorkspace] = useState<string | null>(null);
  const [savingMemberLimit, setSavingMemberLimit] = useState<string | null>(null);
  const [memberLimitInputs, setMemberLimitInputs] = useState<Record<string, string>>({});
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferWorkspaceId, setTransferWorkspaceId] = useState<string>('');
  const [newOwnerId, setNewOwnerId] = useState<string>('');
  const [showDeleteWorkspaceDialog, setShowDeleteWorkspaceDialog] = useState(false);
  const [deleteWorkspaceTarget, setDeleteWorkspaceTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteWorkspaceConfirmation, setDeleteWorkspaceConfirmation] = useState('');

  // Password strength indicators
  const passwordStrength = {
    hasLength: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
  };

  const passwordStrengthCount = Object.values(passwordStrength).filter(Boolean).length;
  const hasPassword = profile?.hasPassword ?? false;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load user profile
      const profileRes = await fetch('/api/user/profile');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
      }

      // Load workspaces
      const workspacesRes = await fetch('/api/workspaces');
      if (workspacesRes.ok) {
        const workspacesData = await workspacesRes.json();
        setWorkspaces(workspacesData);
        setMemberLimitInputs(
          Object.fromEntries(
            workspacesData.map((workspace: WorkspaceSettings) => [
              workspace.id,
              workspace.memberLimit?.toString() ?? '',
            ])
          )
        );
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const loadMyFeedback = async () => {
    try {
      setFeedbackLoading(true);
      const res = await fetch('/api/feedback?limit=20');
      if (res.ok) {
        const data = await res.json();
        setMyFeedback(data.feedback ?? []);
      }
    } catch {
      // silent
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordStrengthCount < 4) {
      toast.error('Password must meet all strength requirements');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      if (res.ok) {
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordStrengthCount < 4) {
      toast.error('Password must meet all strength requirements');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword,
          confirmPassword,
        }),
      });

      if (res.ok) {
        toast.success('Password set successfully! You can now use it to sign in.');
        setNewPassword('');
        setConfirmPassword('');
        // Refresh profile to update password status
        await loadData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to set password');
      }
    } catch (error) {
      console.error('Error setting password:', error);
      toast.error('Failed to set password');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWorkspace = (workspaceId: string, workspaceName: string) => {
    setDeleteWorkspaceTarget({ id: workspaceId, name: workspaceName });
    setDeleteWorkspaceConfirmation('');
    setShowDeleteWorkspaceDialog(true);
  };

  const closeDeleteWorkspaceDialog = () => {
    setShowDeleteWorkspaceDialog(false);
    setDeleteWorkspaceTarget(null);
    setDeleteWorkspaceConfirmation('');
  };

  const handleConfirmDeleteWorkspace = async () => {
    if (!deleteWorkspaceTarget) {
      return;
    }

    if (deleteWorkspaceConfirmation !== deleteWorkspaceTarget.name) {
      toast.error('Workspace name does not match');
      return;
    }

    setDeletingWorkspace(deleteWorkspaceTarget.id);

    try {
      const res = await fetch('/api/workspaces/' + deleteWorkspaceTarget.id + '/settings', {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Workspace deleted successfully');
        setWorkspaces(workspaces.filter((w) => w.id !== deleteWorkspaceTarget.id));
        closeDeleteWorkspaceDialog();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete workspace');
      }
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast.error('Failed to delete workspace');
    } finally {
      setDeletingWorkspace(null);
    }
  };

  const handleLeaveWorkspace = async (workspaceId: string, workspaceName: string) => {
    if (
      !confirm(
        `Are you sure you want to leave "${workspaceName}"? You will need to be re-invited to access it again.`
      )
    ) {
      return;
    }

    setLeavingWorkspace(workspaceId);

    try {
      const res = await fetch('/api/workspaces/' + workspaceId + '/leave', {
        method: 'POST',
      });

      if (res.ok) {
        toast.success('Left workspace successfully');
        setWorkspaces(workspaces.filter((w) => w.id !== workspaceId));
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to leave workspace');
      }
    } catch (error) {
      console.error('Error leaving workspace:', error);
      toast.error('Failed to leave workspace');
    } finally {
      setLeavingWorkspace(null);
    }
  };

  const handleTransferOwnership = async () => {
    if (!newOwnerId || !transferWorkspaceId) {
      toast.error('Please select a new owner');
      return;
    }

    const workspace = workspaces.find((w) => w.id === transferWorkspaceId);
    if (!workspace) return;

    setTransferringWorkspace(transferWorkspaceId);
    try {
      const res = await fetch(`/api/workspaces/${transferWorkspaceId}/transfer-ownership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOwnerId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to transfer ownership');
      }

      toast.success(data.message || 'Ownership transferred successfully');
      setShowTransferDialog(false);
      setTransferWorkspaceId('');
      setNewOwnerId('');
      await loadData(); // Reload workspaces
    } catch (error) {
      console.error('Error transferring ownership:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to transfer ownership');
    } finally {
      setTransferringWorkspace(null);
    }
  };

  const isWorkspaceOwner = (workspace: WorkspaceSettings) => {
    return profile?.id === workspace.ownerId;
  };

  const handleSaveMemberLimit = async (workspaceId: string) => {
    const rawValue = memberLimitInputs[workspaceId] ?? '';
    const trimmed = rawValue.trim();

    if (trimmed !== '') {
      const parsed = Number.parseInt(trimmed, 10);
      if (!Number.isInteger(parsed) || parsed < 1) {
        toast.error('Member limit must be a whole number greater than 0');
        return;
      }
    }

    setSavingMemberLimit(workspaceId);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberLimit: trimmed === '' ? null : Number.parseInt(trimmed, 10),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update member limit');
      }

      setWorkspaces((prev) =>
        prev.map((workspace) =>
          workspace.id === workspaceId
            ? { ...workspace, memberLimit: data.memberLimit ?? null }
            : workspace
        )
      );
      setMemberLimitInputs((prev) => ({
        ...prev,
        [workspaceId]: data.memberLimit?.toString() ?? '',
      }));
      toast.success('Member limit updated');
    } catch (error) {
      console.error('Error updating member limit:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update member limit');
    } finally {
      setSavingMemberLimit(null);
    }
  };

  if (loading) {
    return (
      <AuroraBackground showGrids showGlowOrbs>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        </div>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground showGrids showGlowOrbs>
      <div className="relative container mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="mb-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="gap-2 border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <div className="mb-4 flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-purple-600 to-fuchsia-600 opacity-50 blur-xl" />
              <div className="relative rounded-2xl bg-linear-to-br from-purple-600 to-fuchsia-600 p-3 shadow-2xl">
                <Settings className="h-7 w-7 text-white" />
              </div>
            </div>
            <div>
              <h1 className="bg-linear-to-r from-white via-purple-200 to-fuchsia-200 bg-clip-text text-5xl font-black tracking-tight text-transparent">
                Settings
              </h1>
              <p className="mt-2 text-lg text-slate-400">
                Manage your account security and workspace settings
              </p>
            </div>
          </div>
        </motion.div>

        {/* Animated Tab Switcher */}
        <div className="mb-6 flex justify-center">
          <AnimatedTabs
            tabs={[
              {
                id: 'security',
                label: 'Security',
                icon: <Shield className="h-4 w-4" />,
              },
              {
                id: 'workspaces',
                label: 'Workspaces',
                icon: <Users className="h-4 w-4" />,
              },
              {
                id: 'feedback',
                label: 'Feedback',
                icon: <MessageSquare className="h-4 w-4" />,
              },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* Tab Content (keep existing Tabs wrapper for content only) */}
        <Tabs
          value={activeTab}
          onValueChange={(tab) => {
            setActiveTab(tab);
            if (tab === 'feedback') loadMyFeedback();
          }}
          className="space-y-6"
        >
          <AnimatePresence mode="wait">
            {/* Security Tab */}
            <TabsContent key="security" value="security" className="space-y-6">
              <motion.div
                key="security"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Password Management Card */}
                <div className="relative">
                  <div className="absolute -inset-1 rounded-3xl bg-linear-to-r from-purple-600/20 via-fuchsia-600/20 to-purple-600/20 opacity-75 blur-2xl" />
                  <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 shadow-2xl backdrop-blur-2xl">
                    <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-purple-500 to-transparent" />
                    <div className="p-8">
                      <div className="mb-8 flex items-center gap-3">
                        <div className="rounded-xl bg-linear-to-br from-purple-600 to-fuchsia-600 p-2.5">
                          <Key className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white">
                            {hasPassword ? 'Change Password' : 'Set Password'}
                          </h3>
                          <p className="mt-1 text-sm text-slate-400">
                            {hasPassword
                              ? 'Update your password to keep your account secure'
                              : 'Set a password to enable email/password login'}
                          </p>
                        </div>
                      </div>

                      <form
                        onSubmit={hasPassword ? handleChangePassword : handleSetPassword}
                        className="space-y-5"
                      >
                        {hasPassword && (
                          <div className="space-y-2">
                            <Label htmlFor="currentPassword" className="text-white">
                              Current Password
                            </Label>
                            <div className="relative">
                              <Input
                                id="currentPassword"
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                className="h-12 border-white/20 bg-white/5 pr-12 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:bg-white/10 focus:ring-2 focus:ring-purple-500/20"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowCurrentPassword((prev) => !prev)}
                                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition-colors hover:text-white"
                                aria-label={
                                  showCurrentPassword
                                    ? 'Hide current password'
                                    : 'Show current password'
                                }
                              >
                                {showCurrentPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="newPassword" className="text-white">
                            New Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              type={showNewPassword ? 'text' : 'password'}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter new password"
                              className="h-12 border-white/20 bg-white/5 pr-12 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:bg-white/10 focus:ring-2 focus:ring-purple-500/20"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword((prev) => !prev)}
                              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition-colors hover:text-white"
                              aria-label={
                                showNewPassword ? 'Hide new password' : 'Show new password'
                              }
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>

                          {/* Password Strength Indicator */}
                          {newPassword && (
                            <div className="mt-3 space-y-2 rounded-lg border border-white/10 bg-white/5 p-4">
                              <p className="text-sm font-medium text-slate-300">
                                Password Strength
                              </p>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  {passwordStrength.hasLength ? (
                                    <CheckCircle className="h-4 w-4 text-green-400" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 text-slate-500" />
                                  )}
                                  <span
                                    className={`text-sm ${passwordStrength.hasLength ? 'text-green-400' : 'text-slate-400'}`}
                                  >
                                    At least 8 characters
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {passwordStrength.hasUpper ? (
                                    <CheckCircle className="h-4 w-4 text-green-400" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 text-slate-500" />
                                  )}
                                  <span
                                    className={`text-sm ${passwordStrength.hasUpper ? 'text-green-400' : 'text-slate-400'}`}
                                  >
                                    One uppercase letter
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {passwordStrength.hasLower ? (
                                    <CheckCircle className="h-4 w-4 text-green-400" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 text-slate-500" />
                                  )}
                                  <span
                                    className={`text-sm ${passwordStrength.hasLower ? 'text-green-400' : 'text-slate-400'}`}
                                  >
                                    One lowercase letter
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {passwordStrength.hasNumber ? (
                                    <CheckCircle className="h-4 w-4 text-green-400" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 text-slate-500" />
                                  )}
                                  <span
                                    className={`text-sm ${passwordStrength.hasNumber ? 'text-green-400' : 'text-slate-400'}`}
                                  >
                                    One number
                                  </span>
                                </div>
                              </div>
                              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    passwordStrengthCount === 4
                                      ? 'bg-green-500'
                                      : passwordStrengthCount === 3
                                        ? 'bg-yellow-500'
                                        : passwordStrengthCount >= 2
                                          ? 'bg-orange-500'
                                          : 'bg-red-500'
                                  }`}
                                  style={{ width: `${(passwordStrengthCount / 4) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword" className="text-white">
                            Confirm New Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm new password"
                              className="h-12 border-white/20 bg-white/5 pr-12 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:bg-white/10 focus:ring-2 focus:ring-purple-500/20"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword((prev) => !prev)}
                              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition-colors hover:text-white"
                              aria-label={
                                showConfirmPassword
                                  ? 'Hide confirm password'
                                  : 'Show confirm password'
                              }
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="pt-2">
                          <Button
                            type="submit"
                            disabled={saving || passwordStrengthCount < 4}
                            className="h-12 gap-2 bg-linear-to-r from-purple-600 to-fuchsia-600 px-8 font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40 disabled:opacity-50"
                          >
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            {hasPassword ? 'Change Password' : 'Set Password'}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>

                {/* Danger Zone Card */}
                <div className="relative mt-8">
                  <div className="absolute -inset-1 rounded-3xl bg-linear-to-r from-red-600/20 via-red-500/20 to-red-600/20 opacity-75 blur-2xl" />
                  <div className="relative overflow-hidden rounded-3xl border-2 border-red-500/20 bg-linear-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 shadow-2xl backdrop-blur-2xl">
                    <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-red-500 to-transparent" />
                    <div className="p-8">
                      <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-xl bg-red-500/10 p-2.5 ring-2 ring-red-500/20">
                          <AlertCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-red-400">Danger Zone</h3>
                          <p className="mt-1 text-sm text-slate-400">
                            Irreversible actions that affect your account
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="mb-2 font-bold text-red-300">Delete Account</h4>
                            <p className="text-sm leading-relaxed text-red-200/80">
                              Once you delete your account, there is no going back. This will
                              permanently delete your profile, workspaces, and all associated data.
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            onClick={() => setShowDeleteModal(true)}
                            className="shrink-0 gap-2 bg-red-600 text-white hover:bg-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            {/* Workspaces Tab */}
            <TabsContent key="workspaces" value="workspaces">
              <motion.div
                key="workspaces"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative">
                  <div className="absolute -inset-1 rounded-3xl bg-linear-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 opacity-75 blur-2xl" />
                  <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 shadow-2xl backdrop-blur-2xl">
                    <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-blue-500 to-transparent" />
                    <div className="p-8">
                      <div className="mb-8 flex items-center gap-3">
                        <div className="rounded-xl bg-linear-to-br from-blue-600 to-cyan-600 p-2.5">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white">Your Workspaces</h3>
                          <p className="mt-1 text-sm text-slate-400">
                            Manage and organize your collaborative spaces
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {workspaces.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-white/20 bg-slate-800/30 p-12 text-center">
                            <Users className="mx-auto mb-4 h-12 w-12 text-slate-600" />
                            <p className="text-lg font-medium text-slate-400">No workspaces yet</p>
                            <p className="mt-2 text-sm text-slate-500">
                              Create your first workspace from the dashboard
                            </p>
                          </div>
                        ) : (
                          <motion.div className="space-y-3">
                            {workspaces.map((workspace, index) => {
                              const isOwner = isWorkspaceOwner(workspace);
                              const isDeleting = deletingWorkspace === workspace.id;
                              const isLeaving = leavingWorkspace === workspace.id;

                              return (
                                <motion.div
                                  key={workspace.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-slate-800/50 to-slate-900/50 p-6 transition-all hover:border-white/20 hover:shadow-xl"
                                >
                                  <div className="absolute inset-0 bg-linear-to-br from-purple-600/0 via-purple-600/0 to-fuchsia-600/0 opacity-0 transition-opacity group-hover:opacity-5" />

                                  <div className="relative flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-3">
                                      <div className="flex items-center gap-3">
                                        <h4 className="text-xl font-bold text-white">
                                          {workspace.name}
                                        </h4>
                                        {isOwner ? (
                                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-linear-to-br from-amber-500/20 to-yellow-500/20 px-3 py-1 text-xs font-bold text-amber-300 ring-1 ring-amber-500/30">
                                            <Crown className="h-3.5 w-3.5" />
                                            Owner
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300 ring-1 ring-blue-500/20">
                                            Member
                                          </span>
                                        )}
                                      </div>

                                      {workspace.description && (
                                        <p className="text-sm leading-relaxed text-slate-400">
                                          {workspace.description}
                                        </p>
                                      )}

                                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                          <Users className="h-3.5 w-3.5" />
                                          <span>
                                            {workspace.members.length}{' '}
                                            {workspace.members.length === 1 ? 'member' : 'members'}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <FileText className="h-3.5 w-3.5" />
                                          <span>
                                            {workspace._count.documents}{' '}
                                            {workspace._count.documents === 1
                                              ? 'document'
                                              : 'documents'}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <Calendar className="h-3.5 w-3.5" />
                                          <span>
                                            Updated{' '}
                                            {formatDistanceToNow(new Date(workspace.updatedAt), {
                                              addSuffix: true,
                                            })}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <Shield className="h-3.5 w-3.5" />
                                          <span>
                                            Limit:{' '}
                                            {workspace.memberLimit === null
                                              ? 'Unlimited'
                                              : `${workspace.memberLimit} members`}
                                          </span>
                                        </div>
                                      </div>

                                      {isOwner && (
                                        <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-3">
                                          <div className="mb-2 text-xs font-medium text-slate-300">
                                            Member limit
                                          </div>
                                          <div className="flex flex-wrap items-center gap-2">
                                            <Input
                                              type="number"
                                              min={1}
                                              step={1}
                                              value={memberLimitInputs[workspace.id] ?? ''}
                                              onChange={(e) =>
                                                setMemberLimitInputs((prev) => ({
                                                  ...prev,
                                                  [workspace.id]: e.target.value,
                                                }))
                                              }
                                              placeholder="Unlimited"
                                              className="h-9 w-44 border-white/20 bg-white/5 text-sm text-white placeholder:text-slate-500"
                                            />
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleSaveMemberLimit(workspace.id)}
                                              disabled={savingMemberLimit === workspace.id}
                                              className="border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
                                            >
                                              {savingMemberLimit === workspace.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                              ) : (
                                                'Save Limit'
                                              )}
                                            </Button>
                                            <span className="text-xs text-slate-500">
                                              Leave empty to allow unlimited members.
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex shrink-0 items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.push(`/dashboard/${workspace.id}`)}
                                        className="gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10"
                                      >
                                        Open
                                        <ExternalLink className="h-3.5 w-3.5" />
                                      </Button>

                                      {isOwner && workspace.members.length > 0 && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setTransferWorkspaceId(workspace.id);
                                            setShowTransferDialog(true);
                                          }}
                                          disabled={transferringWorkspace === workspace.id}
                                          className="gap-2 border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
                                        >
                                          {transferringWorkspace === workspace.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <ArrowLeftRight className="h-4 w-4" />
                                          )}
                                        </Button>
                                      )}

                                      {isOwner ? (
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() =>
                                            handleDeleteWorkspace(workspace.id, workspace.name)
                                          }
                                          disabled={isDeleting}
                                          className="gap-2 border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                        >
                                          {isDeleting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <Trash2 className="h-4 w-4" />
                                          )}
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleLeaveWorkspace(workspace.id, workspace.name)
                                          }
                                          disabled={isLeaving}
                                          className="gap-2 border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                                        >
                                          {isLeaving ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <>
                                              <UserMinus className="h-4 w-4" />
                                              Leave
                                            </>
                                          )}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            {/* Feedback Tab */}
            <TabsContent key="feedback" value="feedback">
              <motion.div
                key="feedback"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative">
                  <div className="absolute -inset-1 rounded-3xl bg-linear-to-r from-purple-600/20 via-fuchsia-600/20 to-purple-600/20 opacity-75 blur-2xl" />
                  <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 shadow-2xl backdrop-blur-2xl">
                    <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-purple-500 to-transparent" />
                    <div className="p-8">
                      <div className="mb-8 flex items-center gap-3">
                        <div className="rounded-xl bg-linear-to-br from-purple-600 to-fuchsia-600 p-2.5">
                          <MessageSquare className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white">Send Feedback</h3>
                          <p className="mt-1 text-sm text-slate-400">
                            Help us improve by sharing your thoughts, reporting bugs, or suggesting
                            new features
                          </p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {/* CTA Card */}
                        <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-purple-500/30 bg-linear-to-br from-purple-500/10 to-fuchsia-500/10 p-8">
                          <div className="absolute top-0 right-0 h-32 w-32 bg-linear-to-br from-purple-600/20 to-fuchsia-600/20 blur-3xl" />
                          <div className="relative mx-auto max-w-2xl text-center">
                            <MessageSquare className="mx-auto mb-4 h-14 w-14 text-purple-400" />
                            <h4 className="mb-3 text-2xl font-bold text-white">
                              We value your feedback!
                            </h4>
                            <p className="mb-6 text-slate-400">
                              Your input helps us build a better product. Share bug reports, feature
                              requests, or general suggestions.
                            </p>
                            <FeedbackWidget
                              trigger={
                                <Button
                                  size="lg"
                                  className="gap-2 bg-linear-to-r from-purple-600 to-fuchsia-600 px-8 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                                >
                                  <MessageSquare className="h-5 w-5" />
                                  Send Feedback
                                </Button>
                              }
                            />
                          </div>
                        </div>

                        {/* Feedback Types */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-white">What can you share?</h4>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              className="flex gap-3 rounded-2xl border border-white/10 bg-slate-800/50 p-5"
                            >
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-red-500/20">
                                <AlertCircle className="h-6 w-6 text-red-400" />
                              </div>
                              <div>
                                <h5 className="font-semibold text-white">Bug Reports</h5>
                                <p className="mt-1 text-sm text-slate-400">
                                  Let us know if something isn&apos;t working
                                </p>
                              </div>
                            </motion.div>

                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              className="flex gap-3 rounded-2xl border border-white/10 bg-slate-800/50 p-5"
                            >
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
                                <Star className="h-6 w-6 text-amber-400" />
                              </div>
                              <div>
                                <h5 className="font-semibold text-white">Feature Requests</h5>
                                <p className="mt-1 text-sm text-slate-400">
                                  Suggest new features you&apos;d like to see
                                </p>
                              </div>
                            </motion.div>

                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              className="flex gap-3 rounded-2xl border border-white/10 bg-slate-800/50 p-5"
                            >
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
                                <Sparkles className="h-6 w-6 text-blue-400" />
                              </div>
                              <div>
                                <h5 className="font-semibold text-white">Improvements</h5>
                                <p className="mt-1 text-sm text-slate-400">
                                  Ideas to make existing features better
                                </p>
                              </div>
                            </motion.div>

                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              className="flex gap-3 rounded-2xl border border-white/10 bg-slate-800/50 p-5"
                            >
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 ring-1 ring-purple-500/20">
                                <HelpCircle className="h-6 w-6 text-purple-400" />
                              </div>
                              <div>
                                <h5 className="font-semibold text-white">Questions</h5>
                                <p className="mt-1 text-sm text-slate-400">
                                  Ask about features or functionality
                                </p>
                              </div>
                            </motion.div>
                          </div>
                        </div>

                        {/* Commitment Card */}
                        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
                          <h4 className="mb-3 flex items-center gap-2 font-semibold text-emerald-300">
                            <CheckCircle className="h-5 w-5 text-emerald-400" />
                            Your feedback matters
                          </h4>
                          <ul className="space-y-2 text-sm text-emerald-200/90">
                            <li>• All feedback is reviewed by our team</li>
                            <li>• We prioritize based on user needs and impact</li>
                            <li>• Critical bugs are addressed immediately</li>
                            <li>• Feature requests influence our roadmap</li>
                          </ul>

                          {/* My Submissions */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="flex items-center gap-2 font-semibold text-white">
                                <Reply className="h-4 w-4 text-purple-400" />
                                My Submissions
                              </h4>
                              <button
                                onClick={loadMyFeedback}
                                disabled={feedbackLoading}
                                className="text-xs text-slate-500 transition-colors hover:text-slate-300 disabled:opacity-40"
                              >
                                {feedbackLoading ? 'Loading…' : 'Refresh'}
                              </button>
                            </div>

                            {myFeedback.length === 0 && !feedbackLoading ? (
                              <div className="rounded-2xl border border-white/8 bg-white/3 py-8 text-center">
                                <MessageSquare className="mx-auto mb-2 h-8 w-8 text-slate-700" />
                                <p className="text-sm text-slate-500">No submissions yet</p>
                                <p className="mt-1 text-xs text-slate-600">
                                  Use the button above to send your first feedback
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {myFeedback.map((item) => (
                                  <div
                                    key={item.id}
                                    className="space-y-3 rounded-2xl border border-white/8 bg-white/3 p-4"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-white">
                                          {item.title}
                                        </p>
                                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                                          {item.description}
                                        </p>
                                      </div>
                                      <div className="flex shrink-0 flex-col items-end gap-1">
                                        <span
                                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                            item.status === 'NEW'
                                              ? 'border-blue-500/30 bg-blue-500/15 text-blue-400'
                                              : item.status === 'RESOLVED'
                                                ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                                                : item.status === 'REJECTED'
                                                  ? 'border-red-500/30 bg-red-500/15 text-red-400'
                                                  : 'border-purple-500/30 bg-purple-500/15 text-purple-400'
                                          }`}
                                        >
                                          {item.status}
                                        </span>
                                        <span className="text-[10px] text-slate-600">
                                          {formatDistanceToNow(new Date(item.createdAt))} ago
                                        </span>
                                      </div>
                                    </div>

                                    {item.adminReply && (
                                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-3">
                                        <div className="mb-1.5 flex items-center gap-1.5">
                                          <Reply className="h-3 w-3 text-emerald-400" />
                                          <span className="text-[10px] font-semibold tracking-wide text-emerald-400 uppercase">
                                            Team Reply
                                          </span>
                                          {item.repliedAt && (
                                            <span className="ml-auto text-[10px] text-slate-600">
                                              {formatDistanceToNow(new Date(item.repliedAt))} ago
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-sm whitespace-pre-wrap text-slate-200">
                                          {item.adminReply}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>

        {/* Transfer Ownership Dialog */}
        <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
          <DialogContent className="border-white/10 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <ArrowLeftRight className="h-5 w-5 text-purple-400" />
                Transfer Workspace Ownership
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {transferWorkspaceId &&
                  (() => {
                    const workspace = workspaces.find((w) => w.id === transferWorkspaceId);
                    return workspace
                      ? `Select a member to become the new owner of "${workspace.name}". You will become a regular member with full permissions.`
                      : 'Select a new owner for this workspace.';
                  })()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newOwner" className="text-white">
                  New Owner
                </Label>
                <Select value={newOwnerId} onValueChange={setNewOwnerId}>
                  <SelectTrigger
                    id="newOwner"
                    className="border-white/10 bg-slate-800/50 text-white"
                  >
                    <SelectValue placeholder="Select a member" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-slate-800">
                    {transferWorkspaceId &&
                      workspaces
                        .find((w) => w.id === transferWorkspaceId)
                        ?.members.map((member) => (
                          <SelectItem
                            key={member.userId}
                            value={member.userId}
                            className="text-white focus:bg-slate-700 focus:text-white"
                          >
                            {member.user.name || member.user.email}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-sm text-amber-200">
                  <strong>Important:</strong> After transferring ownership, you will become a
                  regular member with full permissions. This action cannot be undone by you.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowTransferDialog(false);
                  setTransferWorkspaceId('');
                  setNewOwnerId('');
                }}
                className="border-slate-600 bg-slate-700 text-white hover:bg-slate-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleTransferOwnership}
                disabled={!newOwnerId || transferringWorkspace === transferWorkspaceId}
                className="bg-linear-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-700 hover:to-fuchsia-700"
              >
                {transferringWorkspace === transferWorkspaceId ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  <>
                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                    Transfer Ownership
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Workspace Dialog */}
        <Dialog
          open={showDeleteWorkspaceDialog}
          onOpenChange={(open) => {
            if (!open) {
              closeDeleteWorkspaceDialog();
              return;
            }
            setShowDeleteWorkspaceDialog(true);
          }}
        >
          <DialogContent className="border-red-500/20 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <AlertCircle className="h-5 w-5 text-red-400" />
                Delete Workspace
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                This action permanently deletes the workspace, documents, versions, and comments.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                <p className="text-xs tracking-wide text-red-300 uppercase">Workspace to delete</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {deleteWorkspaceTarget?.name}
                </p>
              </div>

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="text-sm text-amber-200">
                  Type the workspace name exactly to confirm deletion.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deleteWorkspaceName" className="text-white">
                  Confirmation
                </Label>
                <Input
                  id="deleteWorkspaceName"
                  value={deleteWorkspaceConfirmation}
                  onChange={(event) => setDeleteWorkspaceConfirmation(event.target.value)}
                  placeholder={deleteWorkspaceTarget?.name || 'Workspace name'}
                  className="border-white/15 bg-slate-900/60 text-white placeholder:text-slate-500"
                  autoComplete="off"
                />
                {deleteWorkspaceTarget && deleteWorkspaceConfirmation.length > 0 && (
                  <p
                    className={`text-xs ${
                      deleteWorkspaceConfirmation === deleteWorkspaceTarget.name
                        ? 'text-emerald-300'
                        : 'text-red-300'
                    }`}
                  >
                    {deleteWorkspaceConfirmation === deleteWorkspaceTarget.name
                      ? 'Name matches. Deletion is unlocked.'
                      : 'Name does not match.'}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={closeDeleteWorkspaceDialog}
                disabled={deletingWorkspace === deleteWorkspaceTarget?.id}
                className="border-slate-600 bg-slate-700 text-white hover:bg-slate-600"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDeleteWorkspace}
                disabled={
                  !deleteWorkspaceTarget ||
                  deleteWorkspaceConfirmation !== deleteWorkspaceTarget.name ||
                  deletingWorkspace === deleteWorkspaceTarget.id
                }
                className="bg-linear-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700"
              >
                {deletingWorkspace === deleteWorkspaceTarget?.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Permanently
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Account Modal */}
        <DeleteAccountModal
          open={showDeleteModal}
          onOpenChange={setShowDeleteModal}
          userEmail={profile?.email || ''}
        />
      </div>
    </AuroraBackground>
  );
}
