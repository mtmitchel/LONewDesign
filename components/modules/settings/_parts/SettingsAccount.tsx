import React, { useMemo, useState } from 'react';
import { SectionCard } from './SectionCard';
import { Button } from '../../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../ui/alert-dialog';
import { ExternalLink, Loader2 } from 'lucide-react';

interface SettingsAccountProps {
  id: string;
  filter: (text: string) => boolean;
  registerSection: (node: HTMLElement | null) => void;
}

export function SettingsAccount({ id, filter, registerSection }: SettingsAccountProps) {
  const sectionMatches = useMemo(() => filter('account google connections calendar tasks mail'), [filter]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  if (!sectionMatches) return null;

  const handleAddAccount = () => {
    setShowAddDialog(true);
  };

  const handleAuthenticateGoogle = async () => {
    setIsAuthenticating(true);
    // Simulate OAuth flow - in production this would open browser OAuth window
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsAuthenticating(false);
    setShowAddDialog(false);
  };

  const handleRemoveAccount = () => {
    setShowRemoveDialog(true);
  };

  const handleConfirmRemove = () => {
    // Handle account removal
    setShowRemoveDialog(false);
  };

  return (
    <section
      id={id}
      ref={registerSection}
      aria-labelledby={`${id}-title`}
      role="region"
      className="scroll-mt-28 space-y-[var(--settings-card-gap)]"
    >
      <header className="sticky top-14 z-[1] rounded-[var(--radius-lg)] border border-transparent bg-[var(--bg-surface-elevated)] px-4 py-4 shadow-[var(--elevation-sm)]">
        <h2 id={`${id}-title`} className="text-xl font-semibold text-[var(--text-primary)]">
          Accounts
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Manage Google connections for calendar, mail, and task integrations.
        </p>
      </header>

      <SectionCard title="Google accounts" help="Manage Gmail, Calendar, and Tasks connections." defaultOpen>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3">
            <span className="text-sm text-[var(--text-primary)]">mitchel.tyler.m@gmail.com</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleAddAccount}>
                Add account
              </Button>
              <Button variant="destructive" size="sm" onClick={handleRemoveAccount}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      </SectionCard>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Google account</DialogTitle>
            <DialogDescription>
              You'll be redirected to Google to sign in and grant access to your Mail, Calendar, and Tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
              <h4 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">What we'll access</h4>
              <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                <li>• Read, send, and manage your email</li>
                <li>• View and edit your calendar events</li>
                <li>• Manage your tasks</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={isAuthenticating}>
              Cancel
            </Button>
            <Button onClick={handleAuthenticateGoogle} disabled={isAuthenticating}>
              {isAuthenticating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Authenticating
                </>
              ) : (
                <>
                  <ExternalLink className="size-4" />
                  Continue with Google
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Google account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleConfirmRemove}>
                Remove account
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
