import React from 'react';
import { Button } from '../../../ui/button';
import { Save } from 'lucide-react';
import { useSettingsState } from './SettingsState';

export function DirtyBar(): JSX.Element | null {
  const { dirty, saveAll } = useSettingsState();

  if (!dirty) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[var(--z-overlay)] flex items-center justify-center px-4 pb-4">
      <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-4 py-3 shadow-[var(--elevation-sm)]">
        <span className="text-sm text-[var(--text-secondary)]">You have unsaved changes</span>
        <Button
          onClick={saveAll}
          title="Save (Cmd/Ctrl+Enter)"
          aria-keyshortcuts="Control+Enter Meta+Enter"
          className="gap-2"
        >
          <Save aria-hidden className="size-4" />
          Save
        </Button>
      </div>
    </div>
  );
}
