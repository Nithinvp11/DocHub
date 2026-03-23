'use client';

import { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Github,
  User,
  Mail,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  UserCircle,
  ArrowRight,
  Check,
  X,
} from 'lucide-react';

interface SignUpFormProps {
  onSwitchToSignIn: () => void;
}

export function SignUpForm({ onSwitchToSignIn }: SignUpFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    username?: string;
    name?: string;
  }>({});
  const emailRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // Password strength validation
  const passwordStrength = {
    hasLength: formData.password.length >= 8,
    hasUpper: /[A-Z]/.test(formData.password),
    hasLower: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
  };

  const passwordStrengthCount = Object.values(passwordStrength).filter(Boolean).length;
  const passwordStrengthPercentage = (passwordStrengthCount / 4) * 100;

  const getStrengthColor = () => {
    if (passwordStrengthCount === 4) return 'from-green-500 to-emerald-500';
    if (passwordStrengthCount >= 2) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-red-600';
  };

  const getStrengthLabel = () => {
    if (passwordStrengthCount === 4) return 'Strong';
    if (passwordStrengthCount >= 2) return 'Medium';
    return 'Weak';
  };

  const passwordsMatch =
    formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!formData.username) {
      setError('Username is required');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    if (formData.username.length < 3 || formData.username.length > 20) {
      setError('Username must be between 3 and 20 characters');
      return;
    }

    const trimmedName = formData.name.trim();
    if (trimmedName && !/^[A-Za-z\s]+$/.test(trimmedName)) {
      setError('Full name can only contain letters and spaces');
      setFieldErrors({ name: 'Full name can only contain letters and spaces' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordStrengthCount < 4) {
      setError('Please create a stronger password');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data?.error || 'Registration failed';
        const lower = String(msg).toLowerCase();
        if (lower.includes('email')) {
          setFieldErrors({ email: msg });
          emailRef.current?.focus();
        } else if (lower.includes('username')) {
          setFieldErrors({ username: msg });
        } else if (lower.includes('name')) {
          setFieldErrors({ name: msg });
        } else {
          setError(msg);
        }
        setLoading(false);
        return;
      }

      // Auto sign in after successful registration
      setFieldErrors({});
      setError('');
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError('Registration successful, but sign in failed. Please sign in manually.');
        setLoading(false);
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setGithubLoading(true);
    try {
      await signIn('github', { callbackUrl });
    } catch {
      setError('GitHub sign in failed');
      setGithubLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title with improved contrast */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-3xl font-bold text-white">Create your account</h2>
        <p className="text-base text-slate-300">Join us and start collaborating today</p>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3.5 text-sm text-red-200 shadow-lg shadow-red-500/10 backdrop-blur-sm"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form with Staggered Animation */}
      <motion.form
        onSubmit={handleSubmit}
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* Username Input */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          <label htmlFor="username" className="block text-sm font-semibold text-slate-200">
            Username
          </label>
          <div className="group relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <User className="h-5 w-5 text-slate-400 transition-all duration-200 group-focus-within:scale-110 group-focus-within:text-purple-400" />
            </div>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-700/50 bg-slate-900/60 py-3.5 pr-4 pl-12 text-white placeholder-slate-500 backdrop-blur-xl transition-all duration-200 hover:border-slate-600/50 focus:border-purple-500/50 focus:bg-slate-900/80 focus:ring-4 focus:ring-purple-500/20 focus:outline-none"
              placeholder="johndoe"
            />
          </div>
          {fieldErrors.username && (
            <p className="mt-2 text-sm text-red-400">{fieldErrors.username}</p>
          )}
          <p className="text-xs text-slate-400">
            Only letters, numbers, and underscores (3-20 characters)
          </p>
        </motion.div>

        {/* Name Input (Optional) */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.18 }}
        >
          <label htmlFor="name" className="block text-sm font-semibold text-slate-200">
            Full Name <span className="text-xs text-slate-500">(optional)</span>
          </label>
          <div className="group relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <UserCircle className="h-5 w-5 text-slate-400 transition-all duration-200 group-focus-within:scale-110 group-focus-within:text-purple-400" />
            </div>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              pattern="[A-Za-z ]+"
              className="w-full rounded-xl border border-slate-700/50 bg-slate-900/60 py-3.5 pr-4 pl-12 text-white placeholder-slate-500 backdrop-blur-xl transition-all duration-200 hover:border-slate-600/50 focus:border-purple-500/50 focus:bg-slate-900/80 focus:ring-4 focus:ring-purple-500/20 focus:outline-none"
              placeholder="John Doe"
            />
          </div>
          {fieldErrors.name && <p className="mt-2 text-sm text-red-400">{fieldErrors.name}</p>}
          <p className="text-xs text-slate-400">Letters and spaces only</p>
        </motion.div>

        {/* Email Input */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.21 }}
        >
          <label htmlFor="email" className="block text-sm font-semibold text-slate-200">
            Email address
          </label>
          <div className="group relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Mail className="h-5 w-5 text-slate-400 transition-all duration-200 group-focus-within:scale-110 group-focus-within:text-purple-400" />
            </div>
            <input
              id="email"
              name="email"
              ref={emailRef}
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-700/50 bg-slate-900/60 py-3.5 pr-4 pl-12 text-white placeholder-slate-500 backdrop-blur-xl transition-all duration-200 hover:border-slate-600/50 focus:border-purple-500/50 focus:bg-slate-900/80 focus:ring-4 focus:ring-purple-500/20 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
          {fieldErrors.email && <p className="mt-2 text-sm text-red-400">{fieldErrors.email}</p>}
        </motion.div>

        {/* Password Input with Strength Indicator */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.24 }}
        >
          <label htmlFor="password" className="block text-sm font-semibold text-slate-200">
            Password
          </label>
          <div className="group relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Lock className="h-5 w-5 text-slate-400 transition-all duration-200 group-focus-within:scale-110 group-focus-within:text-purple-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-700/50 bg-slate-900/60 py-3.5 pr-12 pl-12 text-white placeholder-slate-500 backdrop-blur-xl transition-all duration-200 hover:border-slate-600/50 focus:border-purple-500/50 focus:bg-slate-900/80 focus:ring-4 focus:ring-purple-500/20 focus:outline-none"
              placeholder="Create a strong password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-slate-300"
            >
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </motion.div>
            </button>
          </div>

          {/* Password Strength Bar - Premium Animated */}
          <AnimatePresence>
            {formData.password.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300">Password Strength</span>
                  <span
                    className={`font-semibold ${passwordStrengthCount === 4 ? 'text-green-400' : passwordStrengthCount >= 2 ? 'text-yellow-400' : 'text-red-400'}`}
                  >
                    {getStrengthLabel()}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/50">
                  <motion.div
                    className={`h-full bg-linear-to-r ${getStrengthColor()} shadow-lg`}
                    initial={{ width: 0 }}
                    animate={{ width: `${passwordStrengthPercentage}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'hasLength', label: 'At least 8 characters' },
                    { key: 'hasUpper', label: 'One uppercase letter' },
                    { key: 'hasLower', label: 'One lowercase letter' },
                    { key: 'hasNumber', label: 'One number' },
                  ].map((req) => (
                    <motion.div
                      key={req.key}
                      className="flex items-center gap-1.5"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      {passwordStrength[req.key as keyof typeof passwordStrength] ? (
                        <Check className="h-3.5 w-3.5 flex-shrink-0 text-green-400" />
                      ) : (
                        <X className="h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
                      )}
                      <span
                        className={
                          passwordStrength[req.key as keyof typeof passwordStrength]
                            ? 'text-green-300'
                            : 'text-slate-500'
                        }
                      >
                        {req.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Confirm Password Input */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.27 }}
        >
          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-200">
            Confirm Password
          </label>
          <div className="group relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Lock className="h-5 w-5 text-slate-400 transition-all duration-200 group-focus-within:scale-110 group-focus-within:text-purple-400" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-700/50 bg-slate-900/60 py-3.5 pr-12 pl-12 text-white placeholder-slate-500 backdrop-blur-xl transition-all duration-200 hover:border-slate-600/50 focus:border-purple-500/50 focus:bg-slate-900/80 focus:ring-4 focus:ring-purple-500/20 focus:outline-none"
              placeholder="Re-enter your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-slate-300"
            >
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </motion.div>
            </button>
          </div>
          <AnimatePresence>
            {formData.confirmPassword.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-1.5 text-xs"
              >
                {passwordsMatch ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-green-300">Passwords match</span>
                  </>
                ) : (
                  <>
                    <X className="h-3.5 w-3.5 text-red-400" />
                    <span className="text-red-300">Passwords do not match</span>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Premium Create Account Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pt-2"
        >
          <motion.button
            type="submit"
            disabled={loading}
            className="group relative w-full overflow-hidden rounded-xl bg-linear-to-r from-purple-500 via-violet-600 to-fuchsia-600 px-6 py-4 font-semibold text-white shadow-xl shadow-purple-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            whileHover={{ scale: loading ? 1 : 1.02, y: -2 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
                ease: 'linear',
              }}
            />

            <span className="relative flex items-center justify-center gap-2 text-base">
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                </>
              )}
            </span>
          </motion.button>
        </motion.div>
      </motion.form>

      {/* Divider */}
      <motion.div
        className="relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700/50" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-linear-to-r from-transparent via-slate-900/80 to-transparent px-4 font-medium text-slate-400">
            OR CONTINUE WITH
          </span>
        </div>
      </motion.div>

      {/* GitHub OAuth Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <motion.button
          type="button"
          onClick={handleGitHubSignIn}
          disabled={githubLoading}
          className="group w-full rounded-xl border border-slate-700/50 bg-slate-900/40 px-6 py-3.5 font-semibold text-white backdrop-blur-xl transition-all duration-200 hover:border-slate-600/50 hover:bg-slate-900/60 disabled:cursor-not-allowed disabled:opacity-60"
          whileHover={{ scale: githubLoading ? 1 : 1.01 }}
          whileTap={{ scale: githubLoading ? 1 : 0.99 }}
        >
          <span className="flex items-center justify-center gap-3">
            {githubLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Github className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
            )}
            <span className="text-base">{githubLoading ? 'Connecting...' : 'GitHub'}</span>
          </span>
        </motion.button>
      </motion.div>

      {/* Sign In Link */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
      >
        <p className="text-sm text-slate-400">
          Already have an account?{' '}
          <button
            onClick={onSwitchToSignIn}
            className="font-semibold text-purple-400 transition-colors hover:text-purple-300 hover:underline"
          >
            Sign in
          </button>
        </p>
      </motion.div>
    </div>
  );
}
