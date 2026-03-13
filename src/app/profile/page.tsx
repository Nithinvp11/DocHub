'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuroraBackground } from '@/components/ui/aurora-background';
import {
  Loader2,
  User,
  ArrowLeft,
  Check,
  Sparkles,
  Camera,
  Mail,
  AtSign,
  UserCircle,
  Github,
  Link as LinkIcon,
  CheckCircle2,
  Shield,
  Upload,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  username?: string;
  createdAt: Date;
  githubLinked?: boolean;
  hasPassword?: boolean;
  githubUsername?: string | null;
  githubAvatarUrl?: string | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile form
  const [profileName, setProfileName] = useState('');
  const [profileImage, setProfileImage] = useState('');

  // Username editing
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  // Profile picture modal
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState('');

  // GitHub linking
  const [linkingGithub, setLinkingGithub] = useState(false);

  useEffect(() => {
    fetchProfile();

    // Check if we just linked an account
    const params = new URLSearchParams(window.location.search);
    if (params.get('linked') === 'github') {
      toast.success('GitHub account linked successfully!');
      // Clean up URL
      window.history.replaceState({}, '', '/profile');
    }
  }, []);

  useEffect(() => {
    return () => {
      if (selectedImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    };
  }, [selectedImagePreview]);

  const fetchProfile = async () => {
    try {
      const profileRes = await fetch('/api/user/profile');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
        setProfileName(profileData.name || '');
        setProfileImage(profileData.image || '');
        setSelectedImagePreview('');
        setSelectedImageFile(null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
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
      fetchProfile();
    } catch (error) {
      toast.error('Failed to update username');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedImageFile) {
      toast.error('Please select an image file');
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedImageFile);

      const res = await fetch('/api/user/profile/image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || 'Failed to update profile picture');
        return;
      }
      const updatedProfile = await res.json();
      toast.success('Profile picture updated successfully');
      setShowImageModal(false);
      setProfile(updatedProfile);
      setProfileImage(updatedProfile.image || '');
      setSelectedImageFile(null);
      setSelectedImagePreview('');
    } catch (error) {
      toast.error('Failed to update profile picture');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!profileImage) {
      toast.error('No profile picture to remove');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/user/profile/image', {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || 'Failed to remove profile picture');
        return;
      }

      const updatedProfile = await res.json();
      setProfile(updatedProfile);
      setProfileImage('');
      setSelectedImageFile(null);
      setSelectedImagePreview('');
      setShowImageModal(false);
      toast.success('Profile picture removed');
    } catch (error) {
      toast.error('Failed to remove profile picture');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectProfileImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    if (selectedImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(selectedImagePreview);
    }

    setSelectedImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setSelectedImagePreview(previewUrl);
  };

  const handleLinkGithub = async () => {
    setLinkingGithub(true);
    try {
      // Use NextAuth signIn to trigger OAuth flow
      // The callbackUrl will bring user back to profile after linking
      const { signIn } = await import('next-auth/react');
      await signIn('github', { callbackUrl: '/profile?linked=github' });
    } catch (error) {
      console.error('GitHub linking error:', error);
      toast.error('Failed to initiate GitHub linking');
      setLinkingGithub(false);
    }
  };

  if (loading) {
    return (
      <AuroraBackground showGrids showGlowOrbs>
        <div className="flex h-screen items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Loader2 className="h-10 w-10 animate-spin text-purple-400" />
          </motion.div>
        </div>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground showGrids showGlowOrbs>
      <div className="relative min-h-screen py-12">
        <div className="container mx-auto max-w-4xl px-6">
          {/* Premium Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Link
              href="/dashboard"
              className="group mb-8 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/5 hover:text-purple-300"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Dashboard
            </Link>

            <div className="relative">
              {/* Title with glow effect */}
              <div className="mb-4 flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-purple-600 to-fuchsia-600 opacity-60 blur-xl" />
                  <div className="relative rounded-2xl bg-linear-to-br from-purple-600 to-fuchsia-600 p-4 shadow-2xl">
                    <User className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="bg-linear-to-r from-white via-purple-200 to-fuchsia-200 bg-clip-text text-5xl font-black tracking-tight text-transparent">
                    Your Profile
                  </h1>
                  <p className="mt-2 text-lg text-slate-400">
                    Manage your personal information and settings
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Premium Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="relative">
              {/* Card glow effect */}
              <div className="absolute -inset-1 rounded-3xl bg-linear-to-r from-purple-600/20 via-fuchsia-600/20 to-purple-600/20 opacity-75 blur-2xl" />

              {/* Main premium glass card */}
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 shadow-2xl backdrop-blur-2xl">
                {/* Top gradient line */}
                <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-purple-500 to-transparent" />

                <div className="p-10">
                  {/* Profile Picture Section - Premium Design */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mb-10"
                  >
                    <div className="flex items-center gap-8">
                      <div className="group relative">
                        {/* Avatar glow */}
                        <div className="absolute -inset-2 rounded-full bg-linear-to-r from-purple-600 to-fuchsia-600 opacity-0 blur-xl transition-opacity group-hover:opacity-60" />

                        {/* Avatar container */}
                        <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white/10 bg-linear-to-br from-slate-800 to-slate-900 shadow-2xl">
                          <img
                            src={
                              profileImage ||
                              'https://ui-avatars.com/api/?name=' +
                                encodeURIComponent(profile?.name || profile?.username || 'User') +
                                '&background=7c3aed&color=fff&size=256&bold=true'
                            }
                            alt="Profile"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://ui-avatars.com/api/?name=' +
                                encodeURIComponent(profile?.username || 'User') +
                                '&background=7c3aed&color=fff&size=256&bold=true';
                            }}
                          />
                        </div>

                        {/* Hover camera icon */}
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 opacity-0 transition-all group-hover:bg-black/50 group-hover:opacity-100">
                          <Camera className="h-8 w-8 text-white" />
                        </div>
                      </div>

                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="text-2xl font-bold text-white">
                            {profile?.name || 'Your Name'}
                          </h3>
                          <p className="text-sm text-slate-400">
                            @{profile?.username || profile?.id || 'username'}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImageFile(null);
                            setSelectedImagePreview(profileImage || '');
                            setShowImageModal(true);
                          }}
                          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl border border-purple-500/30 bg-linear-to-r from-purple-600/10 to-fuchsia-600/10 px-6 py-3 font-semibold text-purple-300 transition-all hover:border-purple-500/50 hover:from-purple-600/20 hover:to-fuchsia-600/20 hover:shadow-lg hover:shadow-purple-500/25"
                        >
                          <div className="absolute inset-0 bg-linear-to-r from-purple-600/0 via-purple-600/20 to-purple-600/0 opacity-0 transition-opacity group-hover:opacity-100" />
                          <Camera className="relative h-4 w-4" />
                          <span className="relative">Change Picture</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>

                  {/* Divider */}
                  <div className="mb-10 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

                  {/* Form Fields - Premium Design */}
                  <form onSubmit={handleUpdateProfile} className="space-y-8">
                    {/* Username Field */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="username"
                          className="flex items-center gap-2 text-sm font-semibold text-slate-200"
                        >
                          <AtSign className="h-4 w-4 text-purple-400" />
                          Username
                        </Label>
                        {!editingUsername && (
                          <button
                            type="button"
                            onClick={() => {
                              setNewUsername(profile?.username || '');
                              setEditingUsername(true);
                            }}
                            className="rounded-lg px-3 py-1 text-sm font-medium text-purple-400 transition-colors hover:bg-purple-500/10 hover:text-purple-300"
                          >
                            Edit
                          </button>
                        )}
                      </div>

                      {editingUsername ? (
                        <div className="space-y-4">
                          <div className="relative">
                            <Input
                              id="newUsername"
                              value={newUsername}
                              onChange={(e) => setNewUsername(e.target.value)}
                              placeholder="Enter new username"
                              minLength={3}
                              maxLength={20}
                              className="h-12 border-white/20 bg-white/5 text-base text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:bg-white/10 focus:ring-2 focus:ring-purple-500/20"
                            />
                          </div>
                          <p className="text-sm text-slate-400">
                            3-20 characters, letters, numbers, and underscores only
                          </p>
                          <div className="flex gap-3">
                            <Button
                              type="button"
                              onClick={handleUpdateUsername}
                              disabled={saving || !newUsername || newUsername.length < 3}
                              className="bg-linear-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                            >
                              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Save Username
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => {
                                setEditingUsername(false);
                                setNewUsername('');
                              }}
                              className="border-white/10 bg-white/5 hover:bg-white/10"
                            >
                              Cancel
                            </Button>
                          </div>
                          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                            <p className="text-sm text-yellow-300">
                              ⚠️ You can only change your username once every 30 days
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="relative">
                            <Input
                              id="username"
                              value={'@' + (profile?.username || profile?.id || 'not_set')}
                              disabled
                              className="h-12 cursor-not-allowed border-white/10 bg-white/5 text-base text-slate-400"
                            />
                            <div className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg bg-slate-700/50 px-2 py-1 text-xs font-medium text-slate-400">
                              Read-only
                            </div>
                          </div>
                          <p className="text-sm text-slate-400">
                            Your unique username identifier across the platform
                          </p>
                        </>
                      )}
                    </motion.div>

                    {/* Display Name Field */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="space-y-3"
                    >
                      <Label
                        htmlFor="name"
                        className="flex items-center gap-2 text-sm font-semibold text-slate-200"
                      >
                        <UserCircle className="h-4 w-4 text-fuchsia-400" />
                        Display Name
                      </Label>
                      <Input
                        id="name"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Your display name"
                        className="h-12 border-white/20 bg-white/5 text-base text-white placeholder:text-slate-500 focus:border-fuchsia-500/50 focus:bg-white/10 focus:ring-2 focus:ring-fuchsia-500/20"
                      />
                      <p className="text-sm text-slate-400">
                        This is how others will see your name
                      </p>
                    </motion.div>

                    {/* Email Field */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      className="space-y-3"
                    >
                      <Label
                        htmlFor="email"
                        className="flex items-center gap-2 text-sm font-semibold text-slate-200"
                      >
                        <Mail className="h-4 w-4 text-blue-400" />
                        Email Address
                      </Label>
                      <div className="relative">
                        <Input
                          id="email"
                          value={profile?.email || ''}
                          disabled
                          className="h-12 cursor-not-allowed border-white/10 bg-white/5 text-base text-slate-400"
                        />
                        <div className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg bg-slate-700/50 px-2 py-1 text-xs font-medium text-slate-400">
                          Cannot be changed
                        </div>
                      </div>
                      <p className="text-sm text-slate-400">
                        Your email is permanent and used for authentication
                      </p>
                    </motion.div>

                    {/* Divider */}
                    <div className="h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

                    {/* Premium Save Button */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                    >
                      <button
                        type="submit"
                        disabled={saving}
                        className="group relative w-full overflow-hidden rounded-xl bg-linear-to-r from-purple-600 to-fuchsia-600 p-0.5 transition-all hover:shadow-2xl hover:shadow-purple-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="relative flex items-center justify-center gap-2 rounded-md bg-linear-to-r from-purple-600 to-fuchsia-600 px-8 py-4 font-bold text-white transition-all">
                          <div className="absolute inset-0 bg-linear-to-r from-purple-600/0 via-white/25 to-purple-600/0 opacity-0 transition-opacity group-hover:opacity-100" />
                          {saving ? (
                            <>
                              <Loader2 className="relative h-5 w-5 animate-spin" />
                              <span className="relative">Saving Changes...</span>
                            </>
                          ) : (
                            <>
                              <Check className="relative h-5 w-5" />
                              <span className="relative">Save Changes</span>
                              <Sparkles className="relative h-5 w-5" />
                            </>
                          )}
                        </div>
                      </button>
                    </motion.div>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Connected Accounts Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8"
          >
            <div className="relative">
              {/* Card glow effect */}
              <div className="absolute -inset-1 rounded-3xl bg-linear-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 opacity-75 blur-2xl" />

              {/* Connected Accounts Card */}
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 shadow-2xl backdrop-blur-2xl">
                {/* Top gradient line */}
                <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-blue-500 to-transparent" />

                <div className="p-10">
                  <div className="mb-8">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="rounded-xl bg-linear-to-br from-blue-600 to-cyan-600 p-3">
                        <Shield className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-3xl font-bold text-white">Connected Accounts</h2>
                    </div>
                    <p className="text-slate-400">
                      Link your account with other authentication providers
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* GitHub Connection */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-slate-800/50 to-slate-900/50 p-6 transition-all hover:border-white/20 hover:bg-linear-to-br hover:from-slate-800/70 hover:to-slate-900/70"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="rounded-xl bg-linear-to-br from-slate-700 to-slate-800 p-3 shadow-lg">
                            <Github className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">GitHub</h3>
                            <p className="text-sm text-slate-400">
                              {profile?.githubLinked
                                ? profile?.githubUsername
                                  ? `@${profile.githubUsername}`
                                  : 'Connected'
                                : 'Not connected'}
                            </p>
                          </div>
                        </div>
                        <div>
                          {profile?.githubLinked ? (
                            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-emerald-400">
                              <CheckCircle2 className="h-5 w-5" />
                              <span className="font-semibold">Linked</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleLinkGithub}
                              disabled={linkingGithub}
                              className="group/btn relative inline-flex items-center gap-2 overflow-hidden rounded-xl border border-slate-600/50 bg-linear-to-r from-slate-700/50 to-slate-800/50 px-6 py-3 font-semibold text-white transition-all hover:border-slate-500 hover:from-slate-700 hover:to-slate-800 hover:shadow-lg disabled:opacity-50"
                            >
                              {linkingGithub ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Linking...</span>
                                </>
                              ) : (
                                <>
                                  <LinkIcon className="h-4 w-4" />
                                  <span>Link with GitHub</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {/* Email & Password Connection */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-slate-800/50 to-slate-900/50 p-6"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="rounded-xl bg-linear-to-br from-blue-600 to-blue-700 p-3 shadow-lg">
                            <Mail className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">Email & Password</h3>
                            <p className="text-sm text-slate-400">
                              {profile?.hasPassword ? 'Active' : 'Set up password'}
                            </p>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-emerald-400">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-semibold">Active</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Premium Image URL Modal */}
      {showImageModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
          onClick={() => {
            setShowImageModal(false);
            setSelectedImageFile(null);
            setSelectedImagePreview('');
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg"
          >
            {/* Modal glow */}
            <div className="absolute -inset-1 rounded-3xl bg-linear-to-r from-purple-600/30 via-fuchsia-600/30 to-purple-600/30 blur-2xl" />

            {/* Modal content */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 shadow-2xl backdrop-blur-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-purple-500 to-transparent" />

              <div className="p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-xl bg-linear-to-br from-purple-600 to-fuchsia-600 p-3">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Update Profile Picture</h3>
                </div>

                <form onSubmit={handleImageUpdate} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="imageFile" className="text-sm font-semibold text-slate-200">
                      Choose Image
                    </Label>
                    <label
                      htmlFor="imageFile"
                      className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-8 text-center transition-all hover:border-purple-400/50 hover:bg-white/10"
                    >
                      <div className="rounded-xl bg-linear-to-br from-purple-600/20 to-fuchsia-600/20 p-3 text-purple-300">
                        <Upload className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {selectedImageFile ? selectedImageFile.name : 'Click to select an image'}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          PNG, JPG, GIF, or WebP up to 5MB
                        </p>
                      </div>
                    </label>
                    <input
                      id="imageFile"
                      type="file"
                      accept="image/*"
                      onChange={handleSelectProfileImage}
                      className="hidden"
                    />
                    <p className="text-sm text-slate-400">
                      Select an image file from your device to use as your profile picture.
                    </p>
                  </div>

                  {(selectedImagePreview || profileImage) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex justify-center"
                    >
                      <div className="relative">
                        <div className="absolute -inset-2 rounded-full bg-linear-to-r from-purple-600 to-fuchsia-600 opacity-50 blur-xl" />
                        {selectedImagePreview || profileImage ? (
                          <img
                            src={selectedImagePreview || profileImage}
                            alt="Preview"
                            className="relative h-40 w-40 rounded-full border-4 border-white/10 object-cover shadow-2xl"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://ui-avatars.com/api/?name=Invalid&background=ef4444&color=fff&size=256';
                            }}
                          />
                        ) : (
                          <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-4 border-white/10 bg-slate-900 text-slate-400 shadow-2xl">
                            <ImageIcon className="h-10 w-10" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={saving || !selectedImageFile}
                      className="flex-1 overflow-hidden rounded-xl bg-linear-to-r from-purple-600 to-fuchsia-600 px-6 py-3 font-bold text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 inline h-5 w-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 inline h-5 w-5" />
                          Save Picture
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowImageModal(false);
                        setSelectedImageFile(null);
                        setSelectedImagePreview('');
                      }}
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition-all hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  </div>

                  {profileImage && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={saving}
                      className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-3 font-semibold text-red-300 transition-all hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <Trash2 className="mr-2 inline h-4 w-4" />
                      Remove Picture
                    </button>
                  )}
                </form>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AuroraBackground>
  );
}
