'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlassCard } from '@/components/ui/glass-card';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { SettingsSkeleton } from '@/components/LoadingStates';
import { FeedbackWidget } from '@/components/FeedbackWidget';
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Settings,
  Trash2,
  User,
  MessageSquare,
  Star,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
  username?: string;
  password?: string | null;
  githubLinked?: boolean;
}

interface WorkspaceSettings {
  id: string;
  name: string;
  description: string | null;
  role: string;
  createdAt: string;
  members?: Array<{ role: string }>;
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile form
  const [profileName, setProfileName] = useState('');
  const [profileImage, setProfileImage] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // GitHub linking (using OAuth)
  const [linkingGithub, setLinkingGithub] = useState(false);

  // Add password form
  const [showAddPasswordModal, setShowAddPasswordModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addConfirmPassword, setAddConfirmPassword] = useState('');

  // Username editing
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  // Profile picture upload
  const [showImageModal, setShowImageModal] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState('');

  useEffect(() => {
    fetchProfile();

    // Check if we just linked an account
    const params = new URLSearchParams(window.location.search);
    if (params.get('linked') === 'github') {
      toast.success('GitHub account linked successfully!');
      // Clean up URL
      window.history.replaceState({}, '', '/settings');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    loadData();
  };

  const loadData = async () => {
    try {
      // Load user profile
      const profileRes = await fetch('/api/user/profile');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
        setProfileName(profileData.name || '');
        setProfileImage(profileData.image || '');
      }

      // Load workspaces
      const workspacesRes = await fetch('/api/workspaces');
      if (workspacesRes.ok) {
        const workspacesData = await workspacesRes.json();
        setWorkspaces(workspacesData);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          image: profileImage || undefined,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        toast.success('Profile updated successfully');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkGithub = async () => {
    setLinkingGithub(true);
    try {
      // Use NextAuth signIn to trigger OAuth flow
      // The callbackUrl will bring user back to settings after linking
      const { signIn } = await import('next-auth/react');
      await signIn('github', { callbackUrl: '/settings?linked=github' });
    } catch (error) {
      console.error('GitHub linking error:', error);
      toast.error('Failed to initiate GitHub linking');
      setLinkingGithub(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <SettingsSkeleton />
        </div>
      </div>
    );
  }

  const handleUnlinkGithub = async () => {
    if (!confirm('Are you sure you want to unlink your GitHub account?')) {
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/auth/link-github', {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to unlink GitHub account');
        return;
      }

      toast.success('GitHub account unlinked successfully');
      fetchProfile(); // Refresh profile
    } catch (error) {
      toast.error('Failed to unlink GitHub account');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/user/username', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to update username');
        return;
      }

      toast.success('Username updated successfully!');
      setEditingUsername(false);
      setNewUsername('');
      fetchProfile(); // Refresh profile
    } catch (error) {
      toast.error('Failed to update username');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: tempImageUrl }),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || 'Failed to update profile picture');
        return;
      }

      toast.success('Profile picture updated successfully');
      setShowImageModal(false);
      setProfileImage(tempImageUrl);
      setTempImageUrl('');
      fetchProfile();
    } catch (error) {
      toast.error('Failed to update profile picture');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/auth/add-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          password: addPassword,
          confirmPassword: addConfirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to add password');
        return;
      }

      toast.success('Email and password added successfully');
      setShowAddPasswordModal(false);
      setNewEmail('');
      setAddPassword('');
      setAddConfirmPassword('');
      fetchProfile(); // Refresh profile
    } catch (error) {
      toast.error('Failed to add password');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
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

  const handleDeleteWorkspace = async (workspaceId: string, workspaceName: string) => {
    if (
      !confirm(`Are you sure you want to delete "${workspaceName}"? This action cannot be undone.`)
    ) {
      return;
    }

    try {
      const res = await fetch('/api/workspaces/' + workspaceId + '/settings', {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Workspace deleted successfully');
        setWorkspaces(workspaces.filter((w) => w.id !== workspaceId));
        router.push('/dashboard');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete workspace');
      }
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast.error('Failed to delete workspace');
    }
  };

  const handleDeleteAccount = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Account deleted successfully');
        // Sign out and redirect to home
        const { signOut } = await import('next-auth/react');
        await signOut({ callbackUrl: '/' });
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    } finally {
      setSaving(false);
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
      <div className="relative container mx-auto max-w-4xl p-6">
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 p-2.5 shadow-lg shadow-purple-500/20">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <h1 className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
              Settings
            </h1>
          </div>
          <p className="text-lg text-slate-400">
            Manage your account security and workspace settings
          </p>
        </div>

        <Tabs defaultValue="security" className="space-y-4">
          <TabsList>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
            <TabsTrigger value="feedback">
              <MessageSquare className="mr-2 h-4 w-4" />
              Feedback
            </TabsTrigger>
          </TabsList>

          {/* Security Tab */}
          <TabsContent value="security">
            <GlassCard className="p-6">
              <div className="mb-6 border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold text-white">Change Password</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Update your password to keep your account secure
                </p>
              </div>
              <div>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>

                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Change Password
                  </Button>
                </form>
              </div>
            </GlassCard>

            {/* Delete Account Section */}
            <GlassCard className="mt-6 border-2 border-red-500/20 bg-red-500/5 p-6">
              <div className="mb-6 border-b border-red-500/20 pb-4">
                <h3 className="flex items-center gap-2 text-xl font-bold text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  Danger Zone
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Irreversible actions that affect your account
                </p>
              </div>
              <div className="space-y-4">
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                  <h4 className="mb-2 font-semibold text-red-300">Delete Account</h4>
                  <p className="mb-4 text-sm text-red-200/80">
                    Once you delete your account, there is no going back. This will permanently
                    delete your profile, workspaces, and all associated data.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (
                        confirm(
                          'Are you absolutely sure? This action cannot be undone. All your data will be permanently deleted.'
                        )
                      ) {
                        if (
                          confirm(
                            'Last warning: Type DELETE in the next prompt to confirm account deletion'
                          )
                        ) {
                          const confirmation = prompt(
                            'Type DELETE (in capital letters) to confirm:'
                          );
                          if (confirmation === 'DELETE') {
                            handleDeleteAccount();
                          } else {
                            toast.error('Account deletion cancelled - incorrect confirmation');
                          }
                        }
                      }
                    }}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete My Account
                  </Button>
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          {/* Workspaces Tab */}
          <TabsContent value="workspaces">
            <GlassCard className="p-6">
              <div className="mb-6 border-b border-white/10 pb-4">
                <h3 className="text-xl font-bold text-white">Manage Workspaces</h3>
                <p className="mt-1 text-sm text-slate-400">View and manage your workspaces</p>
              </div>
              <div>
                <div className="space-y-4">
                  {workspaces.length === 0 ? (
                    <p className="py-8 text-center text-slate-400">
                      You don&apos;t have any workspaces yet
                    </p>
                  ) : (
                    workspaces.map((workspace) => (
                      <div
                        key={workspace.id}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/40 p-4"
                      >
                        <div>
                          <h3 className="font-semibold text-white">{workspace.name}</h3>
                          {workspace.description && (
                            <p className="mt-1 text-sm text-slate-400">{workspace.description}</p>
                          )}
                          <p className="mt-1 text-xs text-slate-500">
                            Role:{' '}
                            <span className="font-medium text-purple-400">
                              {workspace.members?.[0]?.role || 'Member'}
                            </span>
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/dashboard/' + workspace.id)}
                          >
                            Open
                          </Button>
                          {workspace.members?.[0]?.role === 'OWNER' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                              onClick={() => handleDeleteWorkspace(workspace.id, workspace.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback">
            <GlassCard className="p-6">
              <div className="mb-6 border-b border-white/10 pb-4">
                <h3 className="flex items-center gap-2 text-xl font-bold text-white">
                  <MessageSquare className="h-5 w-5" />
                  Send Feedback
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Help us improve by sharing your thoughts, reporting bugs, or suggesting new
                  features
                </p>
              </div>
              <div className="space-y-6">
                <div className="rounded-lg border-2 border-dashed border-purple-500/30 bg-purple-500/10 p-8">
                  <div className="mx-auto max-w-2xl text-center">
                    <MessageSquare className="mx-auto mb-4 h-12 w-12 text-purple-400" />
                    <h3 className="mb-2 text-lg font-semibold text-white">
                      We value your feedback!
                    </h3>
                    <p className="mb-6 text-sm text-slate-400">
                      Your input helps us build a better product. Share bug reports, feature
                      requests, or general suggestions.
                    </p>
                    <FeedbackWidget
                      trigger={
                        <Button size="lg" className="gap-2">
                          <MessageSquare className="h-5 w-5" />
                          Send Feedback
                        </Button>
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-white">What can you share?</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex gap-3 rounded-lg border border-white/10 bg-slate-900/40 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      </div>
                      <div>
                        <h5 className="font-medium text-white">Bug Reports</h5>
                        <p className="text-sm text-slate-400">
                          Let us know if something isn&apos;t working as expected
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border border-white/10 bg-slate-900/40 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                        <Star className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <h5 className="font-medium text-white">Feature Requests</h5>
                        <p className="text-sm text-slate-400">
                          Suggest new features you&apos;d like to see
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border border-white/10 bg-slate-900/40 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                        <Sparkles className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <h5 className="font-medium text-white">Improvements</h5>
                        <p className="text-sm text-slate-400">
                          Ideas to make existing features better
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border border-white/10 bg-slate-900/40 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                        <HelpCircle className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <h5 className="font-medium text-white">Questions</h5>
                        <p className="text-sm text-slate-400">
                          Ask about features or functionality
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-emerald-300">
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                    Your feedback matters
                  </h4>
                  <ul className="space-y-1 text-sm text-emerald-200/80">
                    <li>• All feedback is reviewed by our team</li>
                    <li>• We prioritize based on user needs and impact</li>
                    <li>• Critical bugs are addressed immediately</li>
                    <li>• Feature requests influence our roadmap</li>
                  </ul>
                </div>
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>
    </AuroraBackground>
  );
}
