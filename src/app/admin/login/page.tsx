'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/admin/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#111827_0%,#1f2937_42%,#0f172a_100%)] p-4">
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-500/12 blur-[120px]" />
      <div className="pointer-events-none absolute top-0 -right-24 h-[560px] w-[560px] rounded-full bg-violet-600/15 blur-[140px]" />
      <div className="pointer-events-none absolute -right-40 -bottom-40 h-[560px] w-[560px] rounded-full bg-fuchsia-500/10 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-1/4 left-1/4 h-80 w-80 rounded-full bg-indigo-600/8 blur-[100px]" />
      {/* Decorative rings */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-500/6" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-500/8" />
      {/* Grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-size-[48px_48px] opacity-[0.04]" />
      {/* Diagonal overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.014)_0px,rgba(255,255,255,0.014)_1px,transparent_1px,transparent_56px)]" />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="overflow-hidden rounded-4xl border border-white/12 bg-slate-900/68 shadow-2xl shadow-black/25 backdrop-blur-2xl">
          {/* Top accent */}
          <div className="h-px w-full bg-linear-to-r from-transparent via-indigo-400/60 via-50% to-fuchsia-500/50" />

          <div className="p-8">
            {/* Logo */}
            <div className="mb-8 flex flex-col items-center gap-4">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-xl shadow-violet-500/30">
                <Shield className="h-8 w-8 text-white" />
                <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20 ring-inset" />
              </div>
              <div className="text-center">
                <h1 className="bg-linear-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-2xl font-bold text-transparent">
                  Admin Portal
                </h1>
                <p className="mt-1.5 text-sm text-slate-300">
                  Sign in with admin credentials to access the control panel
                </p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-500/25 bg-red-500/10 p-3.5 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Admin Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 border-white/12 bg-white/6 text-white placeholder:text-slate-500 focus:border-violet-400/40 focus:ring-2 focus:ring-violet-400/15"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 border-white/12 bg-white/6 text-white placeholder:text-slate-500 focus:border-violet-400/40 focus:ring-2 focus:ring-violet-400/15"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative mt-2 flex h-11 w-full items-center justify-center overflow-hidden rounded-xl bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-600 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition-all hover:from-indigo-600 hover:via-violet-600 hover:to-fuchsia-700 hover:shadow-violet-600/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in…
                  </span>
                ) : (
                  'Sign In as Admin'
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Restricted access · Authorised personnel only
        </p>
      </div>
    </div>
  );
}
