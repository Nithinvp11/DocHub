import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SkipNavigation } from '@/components/SkipNavigation';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { AmbientBackground } from '@/components/ui/ambient-background';
import { AuthProvider } from '@/components/providers/AuthProvider';
// Temporarily disabled - causes memory issues during startup

export const metadata: Metadata = {
  title: 'DocHub – Collaborative Documentation Platform',
  description:
    'DocHub is a collaborative documentation platform with workspace management, version control, and GitHub integration.',
  openGraph: {
    title: 'DocHub – Collaborative Documentation Platform',
    description:
      'DocHub is a collaborative documentation platform with workspace management, version control, and GitHub integration.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="bg-base-50 text-text-primary h-full antialiased">
        <AuthProvider>
          <AmbientBackground />
          <SkipNavigation />
          <main id="main-content" tabIndex={-1} className="relative">
            {children}
          </main>
          <Toaster position="top-right" richColors />
          <KeyboardShortcutsModal />
        </AuthProvider>
      </body>
    </html>
  );
}
