import React, { useMemo } from 'react';
import { SectionCard } from './SectionCard';
import { AccountProvider } from '../providers/AccountProvider';

interface SettingsAccountProps {
  id: string;
  filter: (text: string) => boolean;
  registerSection: (node: HTMLElement | null) => void;
}

export function SettingsAccount({ id, filter, registerSection }: SettingsAccountProps) {
  const sectionMatches = useMemo(() => filter('account google connections calendar tasks mail'), [filter]);

  if (!sectionMatches) return null;

  return (
    <section
      id={id}
      ref={registerSection}
      aria-labelledby={`${id}-title`}
      role="region"
      className="scroll-mt-28 space-y-[var(--settings-card-gap)]"
    >
      <header className="mb-6">
        <h2 id={`${id}-title`} className="text-xl font-semibold text-[var(--text-primary)]">
          Accounts
        </h2>
      </header>

      <SectionCard title="Google accounts" help="Manage Gmail, Calendar, and Tasks connections." defaultOpen>
        <AccountProvider />
      </SectionCard>
    </section>
  );
}