'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button-premium';
import dynamic from 'next/dynamic';
import {
  PremiumCard,
  PremiumCardHeader,
  PremiumCardTitle,
  PremiumCardDescription,
} from '@/components/ui/card-premium';
import {
  FileText,
  GitBranch,
  Users,
  Github,
  Lock,
  Zap,
  Shield,
  ArrowRight,
  Code2,
  Rocket,
  Star,
} from 'lucide-react';

// Dynamically import LightPillar to avoid SSR issues
const LightPillar = dynamic(() => import('@/components/LightPillar'), {
  ssr: false,
  loading: () => null,
});

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function Home() {
  // Generate particle positions once using lazy initialization
  // This ensures particles are created once and never change
  const particlePositions = useState(() => {
    // This initialization function only runs once on client
    return [...Array(20)].map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 3 + Math.random() * 2,
      delay: Math.random() * 2,
    }));
  })[0];

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* LightPillar Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0">
          <LightPillar
            topColor="#5227FF"
            bottomColor="#FF9FFC"
            intensity={1}
            rotationSpeed={0.3}
            interactive={false}
            glowAmount={0.002}
            pillarWidth={3}
            pillarHeight={0.4}
            noiseIntensity={0.5}
            pillarRotation={25}
          />
        </div>

        {/* Additional animated overlay elements */}
        <motion.div
          className="bg-gradient-radial absolute inset-0 from-purple-600/10 via-transparent to-transparent"
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Floating gradient orbs matching LightPillar colors */}
        <motion.div
          className="absolute top-[20%] left-[10%] h-96 w-96 rounded-full bg-linear-to-br from-purple-600/20 to-fuchsia-500/20 blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute top-[10%] right-[15%] h-[500px] w-[500px] rounded-full bg-linear-to-br from-fuchsia-500/25 to-purple-600/20 blur-3xl"
          animate={{
            x: [0, -60, 0],
            y: [0, 40, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute right-[10%] bottom-[15%] h-[450px] w-[450px] rounded-full bg-linear-to-br from-blue-600/20 to-purple-600/25 blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -50, 0],
            scale: [1, 1.25, 1],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Glowing particles */}
        <div className="absolute inset-0">
          {particlePositions.map((particle, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-white"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
              }}
            />
          ))}
        </div>

        {/* Vertical light beams */}
        <motion.div
          className="absolute top-0 left-[20%] h-full w-px bg-linear-to-b from-transparent via-purple-500/40 to-transparent"
          animate={{
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute top-0 left-[60%] h-full w-px bg-linear-to-b from-transparent via-fuchsia-500/40 to-transparent"
          animate={{
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />
        <motion.div
          className="absolute top-0 left-[80%] h-full w-px bg-linear-to-b from-transparent via-blue-500/30 to-transparent"
          animate={{
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
      </div>

      {/* Hero Section */}
      <div className="relative z-10">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Heading */}
            <div className="mb-6">
              <motion.h1
                className="mb-4 text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-6xl"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                DocHub
              </motion.h1>

              <motion.div
                className="mx-auto max-w-3xl bg-clip-text text-center text-4xl leading-tight font-semibold text-transparent sm:text-5xl lg:text-5xl"
                style={{ backgroundImage: 'linear-gradient(90deg,#a78bfa,#fb7185)' }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
              >
                Collaborative Documentation Platform
              </motion.div>
            </div>

            {/* Description */}
            <motion.p
              className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-purple-100/90"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.55 }}
            >
              A unified workspace for version-controlled documentation, real-time collaboration, and
              granular access control — built for modern engineering teams.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <Button
                asChild
                size="lg"
                className="group relative overflow-hidden rounded-2xl bg-linear-to-r from-purple-600 to-fuchsia-600 px-10 py-5 text-lg text-white shadow-2xl ring-1 ring-purple-600/30 transition-all hover:scale-105 hover:shadow-2xl hover:ring-2"
              >
                <Link href="/auth">
                  <span className="relative z-10 flex items-center gap-3">
                    Get Started Free
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-linear-to-r from-purple-500 to-fuchsia-500 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </Button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              className="mt-10 flex items-center justify-center gap-6 text-sm text-purple-200/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>Open Source</span>
              </div>
              <div className="h-4 w-px bg-purple-400/30" />
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>Team Collaboration</span>
              </div>
              <div className="h-4 w-px bg-purple-400/30" />
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4" />
                <span>Enterprise Ready</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <motion.div
        className="mx-auto max-w-7xl px-6 pt-24 pb-32 lg:px-8"
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-100px' }}
      >
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Everything you need for team documentation
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-purple-200/80">
            Powerful features designed to streamline your documentation workflow
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <motion.div variants={fadeInUp}>
            <PremiumCard
              className="border-purple-500/20 bg-white/5 backdrop-blur-xl transition-all hover:border-purple-500/40 hover:bg-white/10 hover:shadow-xl hover:shadow-purple-500/20"
              hover
            >
              <PremiumCardHeader>
                <div className="rounded-premium mb-4 w-fit bg-linear-to-br from-purple-500/20 to-fuchsia-500/20 p-3 backdrop-blur-sm">
                  <FileText className="h-6 w-6 text-purple-300" />
                </div>
                <PremiumCardTitle className="text-white">Rich Text Editor</PremiumCardTitle>
                <PremiumCardDescription className="text-purple-200/70">
                  Powerful WYSIWYG editor with markdown support, code blocks, tables, and more
                </PremiumCardDescription>
              </PremiumCardHeader>
            </PremiumCard>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <PremiumCard
              className="border-purple-500/20 bg-white/5 backdrop-blur-xl transition-all hover:border-purple-500/40 hover:bg-white/10 hover:shadow-xl hover:shadow-purple-500/20"
              hover
            >
              <PremiumCardHeader>
                <div className="rounded-premium mb-4 w-fit bg-linear-to-br from-fuchsia-500/20 to-pink-500/20 p-3 backdrop-blur-sm">
                  <GitBranch className="h-6 w-6 text-fuchsia-300" />
                </div>
                <PremiumCardTitle className="text-white">Git-Like Versioning</PremiumCardTitle>
                <PremiumCardDescription className="text-purple-200/70">
                  Track every change with automatic version history and easy rollback capabilities
                </PremiumCardDescription>
              </PremiumCardHeader>
            </PremiumCard>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <PremiumCard
              className="border-purple-500/20 bg-white/5 backdrop-blur-xl transition-all hover:border-purple-500/40 hover:bg-white/10 hover:shadow-xl hover:shadow-purple-500/20"
              hover
            >
              <PremiumCardHeader>
                <div className="rounded-premium mb-4 w-fit bg-linear-to-br from-blue-500/20 to-purple-500/20 p-3 backdrop-blur-sm">
                  <Users className="h-6 w-6 text-blue-300" />
                </div>
                <PremiumCardTitle className="text-white">Real-Time Collaboration</PremiumCardTitle>
                <PremiumCardDescription className="text-purple-200/70">
                  Work together with your team, see who&apos;s editing, and prevent conflicts
                </PremiumCardDescription>
              </PremiumCardHeader>
            </PremiumCard>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <PremiumCard
              className="border-purple-500/20 bg-white/5 backdrop-blur-xl transition-all hover:border-purple-500/40 hover:bg-white/10 hover:shadow-xl hover:shadow-purple-500/20"
              hover
            >
              <PremiumCardHeader>
                <div className="rounded-premium mb-4 w-fit bg-linear-to-br from-purple-500/20 to-blue-500/20 p-3 backdrop-blur-sm">
                  <Github className="h-6 w-6 text-purple-300" />
                </div>
                <PremiumCardTitle className="text-white">GitHub Integration</PremiumCardTitle>
                <PremiumCardDescription className="text-purple-200/70">
                  Sync documentation with GitHub repos, track PRs, and automate workflows
                </PremiumCardDescription>
              </PremiumCardHeader>
            </PremiumCard>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <PremiumCard
              className="border-purple-500/20 bg-white/5 backdrop-blur-xl transition-all hover:border-purple-500/40 hover:bg-white/10 hover:shadow-xl hover:shadow-purple-500/20"
              hover
            >
              <PremiumCardHeader>
                <div className="rounded-premium mb-4 w-fit bg-linear-to-br from-fuchsia-500/20 to-purple-500/20 p-3 backdrop-blur-sm">
                  <Lock className="h-6 w-6 text-fuchsia-300" />
                </div>
                <PremiumCardTitle className="text-white">Access Control</PremiumCardTitle>
                <PremiumCardDescription className="text-purple-200/70">
                  Fine-grained permissions and workspace management for secure team collaboration
                </PremiumCardDescription>
              </PremiumCardHeader>
            </PremiumCard>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <PremiumCard
              className="border-purple-500/20 bg-white/5 backdrop-blur-xl transition-all hover:border-purple-500/40 hover:bg-white/10 hover:shadow-xl hover:shadow-purple-500/20"
              hover
            >
              <PremiumCardHeader>
                <div className="rounded-premium mb-4 w-fit bg-linear-to-br from-pink-500/20 to-fuchsia-500/20 p-3 backdrop-blur-sm">
                  <Zap className="h-6 w-6 text-pink-300" />
                </div>
                <PremiumCardTitle className="text-white">Lightning Fast</PremiumCardTitle>
                <PremiumCardDescription className="text-purple-200/70">
                  Optimized performance with instant search, smart caching, and smooth animations
                </PremiumCardDescription>
              </PremiumCardHeader>
            </PremiumCard>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
