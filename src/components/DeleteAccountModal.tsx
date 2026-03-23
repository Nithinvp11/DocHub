'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'next-auth/react';

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

export function DeleteAccountModal({ open, onOpenChange, userEmail }: DeleteAccountModalProps) {
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setDeleting(true);

    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to delete account');
        return;
      }

      toast.success('Account deleted successfully');

      // Sign out and redirect to home
      setTimeout(() => {
        signOut({ callbackUrl: '/' });
      }, 1000);
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setConfirmText('');
    setPassword('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md border border-red-500/20 bg-linear-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-red-500 to-transparent" />

        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 ring-4 ring-red-500/20">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold text-white">
            Delete Account
          </DialogTitle>
          <DialogDescription className="text-center text-slate-400">
            This action is permanent and cannot be undone
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                <h4 className="mb-3 font-semibold text-red-300">⚠️ Warning</h4>
                <ul className="space-y-2 text-sm text-red-200/90">
                  <li>• All your personal data will be deleted</li>
                  <li>• Workspaces you own will be deleted</li>
                  <li>• All documents and versions will be removed</li>
                  <li>• You will be removed from shared workspaces</li>
                  <li>• This action cannot be reversed</li>
                </ul>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <p className="text-sm text-slate-300">
                  <strong className="text-white">Account:</strong> {userEmail}
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 bg-red-600 text-white hover:bg-red-700"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    Enter your password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-white">
                    Type <strong className="font-mono text-red-400">DELETE</strong> to confirm
                  </Label>
                  <Input
                    id="confirm"
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="border-slate-700 bg-slate-800/50 font-mono text-white placeholder:text-slate-500 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                  disabled={deleting}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleDelete}
                  disabled={confirmText !== 'DELETE' || !password || deleting}
                  className="flex-1 gap-2 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete My Account
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
