import React, { useMemo } from 'react';
import { AlertTriangle, LifeBuoy } from 'lucide-react';

import { SectionCard } from './SectionCard';

import { Button } from '../../../ui/button';

interface SettingsAdvancedProps {
  id: string;
  filter: (text: string) => boolean;
  registerSection: (node: HTMLElement | null) => void;
}

export function SettingsAdvanced({ id, filter, registerSection }: SettingsAdvancedProps) {
  const sectionMatches = useMemo(
    () => filter('advanced diagnostics logs reset export troubleshoot support danger zone'),
    [filter],
  );

  if (!sectionMatches) return null;

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
          Advanced
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Review diagnostics, export data, or reset the workspace.
        </p>
      </header>

      <SectionCard title="Diagnostics" help="Gather artifacts when chatting with support." defaultOpen>
        <div className="space-y-4">
          <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3 text-left">
                <LifeBuoy className="mt-0.5 size-4 text-[var(--text-tertiary)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Diagnostics archive</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Download recent request logs and configuration snapshots to share with support.
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" disabled>
                Download log
              </Button>
            </div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3">
            <p className="text-xs text-[var(--text-secondary)]">
              Advanced exports are coming soon. You’ll be able to generate an encrypted bundle with anonymised request metadata.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Danger zone" help="Restore factory defaults or clear sensitive tokens.">
        <div className="space-y-4">
          <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-4 text-[var(--status-warn)]" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Reset settings</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Remove cached API keys, local endpoints, and assistant defaults. You’ll review every step before anything is removed.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[var(--text-tertiary)]">Requires workspace admin privileges.</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled
                className="text-[var(--status-warn)] hover:bg-[color-mix(in_oklab,var(--status-warn)_12%,transparent)] hover:text-[var(--status-warn)]/90"
              >
                Reset workspace
              </Button>
            </div>
          </div>
        </div>
      </SectionCard>
    </section>
  );
}

export default SettingsAdvanced;
