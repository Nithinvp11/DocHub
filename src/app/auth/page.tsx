'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Zap, Shield, Layers } from 'lucide-react';
import { SignInForm } from '@/components/auth/SignInForm';
import { SignUpForm } from '@/components/auth/SignUpForm';

type AuthMode = 'signin' | 'signup';

const createSeededRandom = (seed: number) => {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
};

const seededRandom = createSeededRandom(42);

const PARTICLES = Array.from({ length: 30 }, () => {
  const red = Math.round(167 + seededRandom() * 40);
  const green = Math.round(139 + seededRandom() * 40);
  const alpha = 0.3 + seededRandom() * 0.4;
  return {
    left: `${seededRandom() * 100}%`,
    top: `${seededRandom() * 100}%`,
    background: `rgba(${red}, ${green}, 250, ${alpha})`,
    duration: 8 + seededRandom() * 6,
    delay: seededRandom() * 5,
  };
});

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('signin');

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* REDESIGNED Premium Animated Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {/* Deep gradient mesh - more vibrant */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(124,58,237,0.15),transparent_50%),radial-gradient(ellipse_at_top_right,rgba(219,39,119,0.12),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(59,130,246,0.1),transparent_50%)]" />

        {/* Animated gradient orbs - more pronounced */}
        <motion.div
          className="absolute -top-20 -left-20 h-[500px] w-[500px] rounded-full bg-linear-to-br from-purple-600/30 via-violet-600/20 to-transparent blur-[100px]"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -right-20 -bottom-20 h-[600px] w-[600px] rounded-full bg-linear-to-tl from-fuchsia-600/25 via-pink-600/15 to-transparent blur-[120px]"
          animate={{
            scale: [1.1, 1, 1.1],
            x: [0, -40, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-r from-blue-600/20 to-cyan-600/15 blur-[90px]"
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Subtle animated grid - finer detail */}
        <motion.div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(167, 139, 250, 0.4) 0.5px, transparent 0.5px),
              linear-gradient(90deg, rgba(167, 139, 250, 0.4) 0.5px, transparent 0.5px)
            `,
            backgroundSize: '60px 60px',
          }}
          animate={{
            backgroundPosition: ['0px 0px', '60px 60px'],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Floating particles - subtle motion */}
        <div className="absolute inset-0">
          {PARTICLES.map((particle, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full"
              style={{
                left: particle.left,
                top: particle.top,
                background: particle.background,
              }}
              animate={{
                y: [0, -150, 0],
                opacity: [0, 0.8, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Noise texture overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWx0ZXI9InVybCgjYSkiIG9wYWNpdHk9IjAuMDUiLz48L3N2Zz4=')] opacity-20" />

        {/* Floating reflective glass elements */}
        <>
          <motion.div
            className="absolute top-[15%] right-[12%] h-32 w-32 rounded-2xl border border-purple-400/20 bg-linear-to-br from-purple-500/10 via-transparent to-transparent shadow-2xl shadow-purple-500/10 backdrop-blur-md"
            animate={{
              y: [0, -30, 0],
              rotate: [0, 10, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-[25%] left-[8%] h-28 w-28 rounded-xl border border-fuchsia-400/20 bg-linear-to-tr from-fuchsia-500/10 via-transparent to-transparent shadow-xl shadow-fuchsia-500/10 backdrop-blur-lg"
            animate={{
              y: [0, 40, 0],
              rotate: [0, -15, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
          />
          <motion.div
            className="absolute top-[45%] left-[7%] h-20 w-20 rounded-lg border border-blue-400/20 bg-linear-to-bl from-blue-500/10 via-transparent to-transparent shadow-xl shadow-blue-500/10 backdrop-blur-md"
            animate={{
              y: [0, -50, 0],
              rotate: [0, 20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1.5,
            }}
          />
        </>
      </div>

      {/* Main Container - Split Layout */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 lg:p-8">
        <motion.div
          className="w-full max-w-6xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-16">
            {/* LEFT PANEL - Enhanced Branding Section */}
            <motion.div
              className="hidden lg:flex lg:flex-col lg:justify-center lg:self-center"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            >
              <div className="space-y-8">
                {/* Logo with enhanced glow */}
                <motion.div
                  className="inline-flex"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div className="relative">
                    {/* Animated glow halo */}
                    <motion.div
                      className="absolute -inset-4 rounded-[2rem] bg-linear-to-r from-purple-500 via-fuchsia-500 to-pink-500 opacity-30 blur-2xl"
                      animate={{
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                    <div className="relative rounded-3xl bg-linear-to-br from-purple-500 via-violet-600 to-fuchsia-600 p-5 shadow-2xl shadow-purple-500/50">
                      <FileText className="h-14 w-14 text-white drop-shadow-lg" />
                    </div>
                  </div>
                </motion.div>

                {/* Brand title with improved contrast */}
                <div className="space-y-4">
                  <h1 className="text-6xl leading-tight font-bold tracking-tight">
                    <motion.span
                      className="block bg-linear-to-r from-white via-purple-100 to-white bg-clip-text text-transparent"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      DocHub
                    </motion.span>
                  </h1>

                  <motion.p
                    className="text-lg leading-relaxed font-medium text-slate-200"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    Professional documentation platform with{' '}
                    <span className="text-purple-300">Git-like versioning</span> and{' '}
                    <span className="text-fuchsia-300">GitHub integration</span>
                  </motion.p>
                </div>

                {/* Feature highlights with better visibility */}
                <div className="space-y-4 pt-4">
                  {[
                    {
                      icon: Zap,
                      text: 'Lightning-fast version control',
                      color: 'from-yellow-400/20 to-orange-500/20',
                    },
                    {
                      icon: Shield,
                      text: 'Enterprise-grade security',
                      color: 'from-green-400/20 to-emerald-500/20',
                    },
                    {
                      icon: Layers,
                      text: 'Seamless collaboration',
                      color: 'from-blue-400/20 to-cyan-500/20',
                    },
                  ].map((feature, i) => (
                    <motion.div
                      key={i}
                      className="group flex items-center gap-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                      whileHover={{ x: 8 }}
                    >
                      <div
                        className={`rounded-xl bg-linear-to-br ${feature.color} border border-white/10 p-3 shadow-lg backdrop-blur-sm transition-transform group-hover:scale-110`}
                      >
                        <feature.icon className="h-6 w-6 text-white drop-shadow-lg" />
                      </div>
                      <span className="text-base font-medium text-slate-100 transition-colors group-hover:text-white">
                        {feature.text}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Decorative accent line with shimmer */}
                <motion.div
                  className="relative mt-10 h-1.5 w-40 overflow-hidden rounded-full bg-linear-to-r from-purple-500 via-fuchsia-500 to-pink-500 shadow-lg shadow-purple-500/50"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ delay: 1, duration: 0.8, ease: 'easeOut' }}
                >
                  <motion.div
                    className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent"
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: 'linear',
                      repeatDelay: 1.5,
                    }}
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* RIGHT PANEL - Auth Forms with Smooth Transitions */}
            <motion.div
              className="flex flex-col justify-center"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            >
              {/* Mobile Logo */}
              <div className="mb-8 flex flex-col items-center lg:hidden">
                <motion.div
                  className="mb-4 rounded-2xl bg-linear-to-br from-purple-500 via-violet-600 to-fuchsia-600 p-3 shadow-xl shadow-purple-500/40"
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <FileText className="h-8 w-8 text-white" />
                </motion.div>
                <h1 className="bg-linear-to-r from-purple-300 via-fuchsia-300 to-pink-300 bg-clip-text text-2xl font-bold text-transparent">
                  DocHub
                </h1>
              </div>

              {/* Premium Tab Switcher with Gliding Indicator */}
              <motion.div
                className="relative mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="relative flex rounded-2xl border border-purple-500/20 bg-linear-to-r from-white/5 via-white/10 to-white/5 p-1.5 shadow-xl shadow-purple-500/10 backdrop-blur-xl">
                  {/* Animated sliding indicator */}
                  <motion.div
                    className="absolute inset-y-1.5 rounded-xl bg-linear-to-r from-purple-500 via-violet-600 to-fuchsia-600 shadow-2xl shadow-purple-500/60"
                    initial={false}
                    animate={{
                      left: mode === 'signin' ? '6px' : 'calc(50% + 2px)',
                    }}
                    style={{
                      width: 'calc(50% - 8px)',
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 350,
                      damping: 35,
                      mass: 0.8,
                    }}
                  >
                    {/* Inner glow */}
                    <div className="absolute inset-0 rounded-xl bg-linear-to-t from-white/20 to-transparent" />
                  </motion.div>

                  <button
                    onClick={() => setMode('signin')}
                    className="relative z-10 flex-1 rounded-xl px-8 py-3.5 text-sm font-semibold transition-all duration-200"
                  >
                    <motion.span
                      animate={{
                        color: mode === 'signin' ? '#ffffff' : '#94a3b8',
                        scale: mode === 'signin' ? 1 : 0.95,
                      }}
                      transition={{ duration: 0.2 }}
                      className="drop-shadow-sm"
                    >
                      Sign In
                    </motion.span>
                  </button>

                  <button
                    onClick={() => setMode('signup')}
                    className="relative z-10 flex-1 rounded-xl px-8 py-3.5 text-sm font-semibold transition-all duration-200"
                  >
                    <motion.span
                      animate={{
                        color: mode === 'signup' ? '#ffffff' : '#94a3b8',
                        scale: mode === 'signup' ? 1 : 0.95,
                      }}
                      transition={{ duration: 0.2 }}
                      className="drop-shadow-sm"
                    >
                      Sign Up
                    </motion.span>
                  </button>
                </div>
              </motion.div>

              {/* Form Container with Smooth Height Animation */}
              <motion.div
                className="relative"
                animate={{ height: 'auto' }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              >
                <AnimatePresence mode="wait" custom={mode}>
                  <motion.div
                    key={mode}
                    initial={{
                      opacity: 0,
                      x: mode === 'signin' ? -30 : 30,
                      scale: 0.98,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      x: mode === 'signin' ? 30 : -30,
                      scale: 0.98,
                    }}
                    transition={{
                      duration: 0.35,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    className="rounded-3xl border border-purple-500/20 bg-linear-to-br from-white/10 via-white/5 to-white/5 p-10 shadow-2xl shadow-purple-500/10 backdrop-blur-2xl"
                  >
                    {mode === 'signin' ? (
                      <SignInForm onSwitchToSignUp={() => setMode('signup')} />
                    ) : (
                      <SignUpForm onSwitchToSignIn={() => setMode('signin')} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              {/* Back to Home Link */}
              <motion.div
                className="mt-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <Link
                  href="/"
                  className="group inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition-all hover:text-purple-300"
                >
                  <motion.span
                    className="inline-block"
                    whileHover={{ x: -4 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    ←
                  </motion.span>
                  <span>Back to home</span>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
