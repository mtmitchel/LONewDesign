import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, ArrowUpRight } from 'lucide-react';

import { SettingsProviders } from './_parts/SettingsProviders';
import { SettingsAccount } from './_parts/SettingsAccount';
import { SettingsAdvanced } from './_parts/SettingsAdvanced';
import { SettingsStateProvider } from './_parts/SettingsState';
import { DirtyBar } from './_parts/DirtyBar';

import { ScrollArea } from '../../ui/scroll-area';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { cn } from '../../ui/utils';
import { useSettingsSections, useScrollSpy, scrollToSection, type SectionConfig, type SectionId } from '../../features/settings/shell';

const SECTION_CONFIG: SectionConfig[] = [
  {
    id: 'models',
    label: 'Models',
    description: 'Connect cloud providers and manage local endpoints.',
    keywords: 'models providers cloud local api keys mistral anthropic openai openrouter credentials',
    render: (props) => <SettingsProviders {...props} />,
  },
  {
    id: 'accounts',
    label: 'Accounts',
    description: 'Link calendar and mail integrations.',
    keywords: 'accounts google calendar gmail integrations auth',
    render: (props) => <SettingsAccount {...props} />,
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'Diagnostics, exports, and reset tools.',
    keywords: 'advanced diagnostics logs reset danger export troubleshooting',
    render: (props) => <SettingsAdvanced {...props} />,
  },
];

const NAV_ACTIVE_INDICATOR =
  'before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-1.5 before:rounded-full before:bg-[var(--primary)] before:opacity-0';

export default function SettingsPage(): JSX.Element {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();

  const filter = useCallback(
    (text: string) => {
      if (!normalizedQuery) return true;
      return text.toLowerCase().includes(normalizedQuery);
    },
    [normalizedQuery],
  );

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>('models');

  const { visibleSections, registerSection } = useSettingsSections({ config: SECTION_CONFIG, filter });

  useEffect(() => {
    if (visibleSections.length === 0) {
      return;
    }
    const firstVisible = visibleSections[0];
    if (!firstVisible) {
      return;
    }
    if (!visibleSections.some((section) => section.id === activeSection)) {
      setActiveSection(firstVisible.id);
    }
  }, [activeSection, visibleSections]);

  useScrollSpy({ viewportRef, visibleSections, activeSection, setActiveSection });

  const handleNavClick = useCallback((id: SectionId) => {
    scrollToSection(id, viewportRef.current);
    setActiveSection(id);
  }, []);

  return (
    <SettingsStateProvider>
      <div className="grid h-full gap-6 lg:grid-cols-[260px_1fr] lg:gap-8">
        <aside className="hidden lg:flex lg:flex-col lg:gap-6">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-4 shadow-[var(--elevation-sm)]">
            <label htmlFor="settings-search" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <Input
                id="settings-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter settings by name or provider…"
                className="pl-9"
                spellCheck={false}
                autoComplete="off"
                aria-describedby="settings-search-hint"
              />
            </div>
            <p id="settings-search-hint" className="mt-2 text-xs italic text-[var(--text-tertiary)]">
              Try “Mistral”, “local”, or “accounts” to jump to specific sections.
            </p>
          </div>

          <nav
            aria-label="Settings sections"
            className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-2 shadow-[var(--elevation-sm)]"
          >
            <ul className="flex flex-col gap-1" role="list">
              {visibleSections.map((section) => {
                const isActive = activeSection === section.id;
                return (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => handleNavClick(section.id)}
                      className={cn(
                        'group relative w-full rounded-[var(--radius-md)] px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]',
                        NAV_ACTIVE_INDICATOR,
                        isActive
                          ? 'before:opacity-100 bg-[color-mix(in_oklab,var(--primary)_8%,transparent)] text-[var(--text-primary)] font-medium'
                          : 'before:opacity-0 text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]',
                      )}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <span className="text-sm">{section.label}</span>
                      <span className="mt-1 block text-xs text-[var(--text-tertiary)]">{section.description}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {normalizedQuery && visibleSections.length === 0 ? (
              <div className="mt-2 rounded-[var(--radius-md)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                No sections match “{query}”.
              </div>
            ) : null}
          </nav>
        </aside>

        <ScrollArea className="h-[calc(100dvh-88px)] lg:h-[calc(100dvh-64px)]">
          <div
            ref={viewportRef}
            className="mx-auto flex h-full w-full max-w-[var(--settings-content-w)] flex-col gap-10 px-[var(--settings-pad-x,1.5rem)] py-8 lg:px-0"
          >
            <header className="sticky top-0 z-10 mb-7 flex items-center justify-between gap-6 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-6 py-5 shadow-[var(--elevation-sm)]">
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-[var(--text-primary)]">Settings</h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  Configure providers, defaults, and workspace integrations.
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-w-[110px]"
                  onClick={() => {
                    setQuery('');
                    const viewport = viewportRef.current;
                    if (viewport) viewport.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Clear filters
                </Button>
              </div>
            </header>

            {visibleSections.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center">
                <ArrowUpRight className="size-6 text-[var(--text-tertiary)]" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[var(--text-primary)]">No settings match your search</p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Try a different keyword or{' '}
                    <button
                      type="button"
                      className="text-[var(--primary)] underline underline-offset-4"
                      onClick={() => setQuery('')}
                    >
                      reset the filter
                    </button>
                    .
                  </p>
                </div>
              </div>
            ) : (
              visibleSections.map((section) =>
                section.render({
                  id: section.id,
                  filter,
                  registerSection: registerSection[section.id],
                }),
              )
            )}
          </div>
        </ScrollArea>
      </div>
      <DirtyBar />
    </SettingsStateProvider>
  );
}
