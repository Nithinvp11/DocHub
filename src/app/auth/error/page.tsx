import Link from 'next/link';
import { Button } from '@/components/ui/button-premium';
import {
  PremiumCard,
  PremiumCardContent,
  PremiumCardDescription,
  PremiumCardHeader,
  PremiumCardTitle,
} from '@/components/ui/card-premium';
import { AlertCircle } from 'lucide-react';

export default function AuthErrorPage({ searchParams }: { searchParams: { error?: string } }) {
  const errorMessages: Record<string, string> = {
    Configuration: 'There is a problem with the server configuration.',
    AccessDenied: 'You do not have permission to sign in.',
    Verification: 'The verification token has expired or has already been used.',
    Default: 'An error occurred during authentication.',
  };

  const error = searchParams.error || 'Default';
  const errorMessage = errorMessages[error] || errorMessages.Default;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <PremiumCard className="w-full max-w-md">
        <PremiumCardHeader>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-6 w-6" />
            <PremiumCardTitle>Authentication Error</PremiumCardTitle>
          </div>
          <PremiumCardDescription>{errorMessage}</PremiumCardDescription>
        </PremiumCardHeader>
        <PremiumCardContent className="flex flex-col gap-4">
          <p className="text-text-secondary text-sm">
            Please try signing in again. If the problem persists, contact support.
          </p>
          <div className="flex gap-2">
            <Button variant="primary" className="flex-1">
              <Link href="/auth">Try Again</Link>
            </Button>
            <Button variant="secondary" className="flex-1">
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </PremiumCardContent>
      </PremiumCard>
    </div>
  );
}
