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
        <script
          dangerouslySetInnerHTML={{
            __html: `
          (function(){
            try {
              var perf = window.performance;
              if (!perf || typeof perf.measure !== 'function') return;
              var orig = perf.measure.bind(perf);
              perf.measure = function(name, start, end){
                try {
                  // if start mark doesn't exist, skip measurement to avoid errors
                  if (start && perf.getEntriesByName(start, 'mark').length === 0) {
                    return null;
                  }
                  return orig(name, start, end);
                } catch (err) {
                  // swallow known browsers/perf errors to prevent app crash
                  console.warn('[Performance Guard] suppressed measurement error', err);
                  return null;
                }
              };
            } catch (e) {
              // noop
            }
          })();
        `,
          }}
        />
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
