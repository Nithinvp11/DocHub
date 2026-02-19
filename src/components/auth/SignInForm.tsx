'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Mail, Lock, AlertCircle, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

interface SignInFormProps {
  onSwitchToSignUp: () => void;
}

export function SignInForm({ onSwitchToSignUp }: SignInFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
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
        <h2 className="text-3xl font-bold text-white">Welcome back</h2>
        <p className="text-base text-slate-300">Sign in to your account to continue</p>
      </motion.div>

      {/* Error Message with Premium Animation */}
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
        className="space-y-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* Email Input - Premium Dark Glass Style */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
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
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-700/50 bg-slate-900/60 py-3.5 pr-4 pl-12 text-white placeholder-slate-500 backdrop-blur-xl transition-all duration-200 hover:border-slate-600/50 focus:border-purple-500/50 focus:bg-slate-900/80 focus:ring-4 focus:ring-purple-500/20 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
        </motion.div>
        {/* Password Input with Toggle */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
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
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-700/50 bg-slate-900/60 py-3.5 pr-12 pl-12 text-white placeholder-slate-500 backdrop-blur-xl transition-all duration-200 hover:border-slate-600/50 focus:border-purple-500/50 focus:bg-slate-900/80 focus:ring-4 focus:ring-purple-500/20 focus:outline-none"
              placeholder="Enter your password"
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
        </motion.div>
        {/* Premium Sign In Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            type="submit"
            disabled={loading}
            className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-purple-500 via-violet-600 to-fuchsia-600 px-6 py-4 font-semibold text-white shadow-xl shadow-purple-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            whileHover={{ scale: loading ? 1 : 1.02, y: -2 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
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
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
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
          <span className="bg-gradient-to-r from-transparent via-slate-900/80 to-transparent px-4 font-medium text-slate-400">
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

      {/* Sign Up Link */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
      >
        <p className="text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <button
            onClick={onSwitchToSignUp}
            className="font-semibold text-purple-400 transition-colors hover:text-purple-300 hover:underline"
          >
            Sign up
          </button>
        </p>
      </motion.div>
    </div>
  );
}
