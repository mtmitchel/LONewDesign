import React, { useMemo } from 'react';
import { SectionCard } from './SectionCard';
import { Button } from '../../../ui/button';

interface SettingsAssistantProps {
  id: string;
  filter: (text: string) => boolean;
  registerSection: (node: HTMLElement | null) => void;
}

export function SettingsAssistant({ id, filter, registerSection }: SettingsAssistantProps) {
  const sectionMatches = useMemo(
    () => filter('assistant provider model routing defaults primary fallback'),
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
          Assistant routing
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Choose which provider or local runtime powers assistant interactions. Detailed controls live in Providers.
        </p>
      </header>

      <SectionCard title="Model defaults" help="Set the primary and fallback routes that the assistant calls first.">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Configure the assistant’s primary and fallback models directly inside the Providers section. Once a provider is connected, pick the default model from the “Assistant defaults” card there.
          </p>
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-6 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Head to the Providers section to assign assistant defaults and fallbacks.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                const target = document.querySelector<HTMLElement>('#models');
                target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              Jump to Providers
            </Button>
          </div>
        </div>
      </SectionCard>
    </section>
  );
}

export default SettingsAssistant;
