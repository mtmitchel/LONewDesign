import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, ArrowUpRight } from 'lucide-react';

import { SettingsProviders } from './_parts/SettingsProviders';
import { SettingsAccount } from './_parts/SettingsAccount';
import { SettingsStateProvider } from './_parts/SettingsState';
import { DirtyBar } from './_parts/DirtyBar';

import { TriPane } from '../../TriPane';
import { PaneHeader } from '../../layout/PaneHeader';
import { PaneCaret, PaneFooter } from '../../dev/PaneCaret';
import { ScrollArea } from '../../ui/scroll-area';
import { Input } from '../../ui/input';
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
];

export default function SettingsPage(): JSX.Element {
  const [leftPaneVisible, setLeftPaneVisible] = useState(true);
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();

  const filter = useCallback(
    (text: string) => {
      if (!normalizedQuery) return true;
      return text.toLowerCase().includes(normalizedQuery);
    },
    [normalizedQuery],
  );

  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>('models');
  const isScrollingProgrammatically = useRef(false);

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

  // Callback ref to capture the ScrollArea viewport
  const handleScrollViewportRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const viewport = node.closest('[data-slot="scroll-area-viewport"]') as HTMLDivElement;
      scrollViewportRef.current = viewport;
    }
  }, []);

  useScrollSpy({ 
    viewportRef: scrollViewportRef, 
    visibleSections, 
    activeSection, 
    setActiveSection,
    disabled: isScrollingProgrammatically
  });

  const handleNavClick = useCallback((id: SectionId) => {
    isScrollingProgrammatically.current = true;
    setActiveSection(id);
    scrollToSection(id, scrollViewportRef.current);
    
    // Re-enable scroll spy after scroll completes
    setTimeout(() => {
      isScrollingProgrammatically.current = false;
    }, 500);
  }, []);

  const leftPane = leftPaneVisible ? (
    <div className="flex h-full flex-col bg-[var(--bg-surface)]">
      <div className="px-[var(--space-4)] pt-[var(--space-3)] pb-[var(--space-2)]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-[var(--space-3)] top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-tertiary)]" />
          <Input
            id="settings-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search settings"
            className="h-[var(--field-height)] bg-[var(--bg-surface)] border border-[var(--border-default)] pl-10 placeholder:text-[color:var(--text-tertiary)] focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary-tint-10)]"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>

      <nav
        aria-label="Settings sections"
        className="flex-1 overflow-y-auto"
      >
        {visibleSections.length === 0 ? (
          <div className="px-[var(--space-4)] py-[var(--space-5)] text-sm text-[color:var(--text-tertiary)]">
            No sections match "{query}".
          </div>
        ) : (
          <div className="space-y-[var(--space-1)] px-[var(--space-4)] pb-[var(--space-4)]">
            {visibleSections.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleNavClick(section.id)}
                  className={cn(
                    'group relative flex w-full min-h-[var(--list-row-min-h)] flex-col justify-center rounded-[var(--radius-md)] border border-transparent px-[var(--list-row-pad-x)] py-[var(--space-2-5,10px)] text-left cursor-pointer motion-safe:transition-all duration-[var(--duration-fast)] ease-[var(--easing-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]',
                    isActive
                      ? 'bg-[var(--primary)] text-white shadow-[inset_0_0_0_1px_hsla(0,0%,100%,0.18)]'
                      : 'text-[var(--text-primary)] hover:bg-[var(--primary-tint-10)]',
                  )}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <span className={cn('text-[length:var(--list-row-font)] font-medium', isActive ? 'text-white' : 'text-[color:var(--text-primary)]')}>
                    {section.label}
                  </span>
                  <span className={cn('mt-1 block text-xs', isActive ? 'text-white/90' : 'text-[var(--text-tertiary)]')}>
                    {section.description}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </nav>

      <PaneFooter>
        <PaneCaret
          side="right"
          label="Hide settings navigation"
          onClick={() => setLeftPaneVisible(false)}
          variant="button"
        />
      </PaneFooter>
    </div>
  ) : (
    <div className="flex h-full w-5 min-w-[20px] max-w-[20px] cursor-pointer items-center justify-center bg-[var(--bg-surface-elevated)] shadow-[1px_0_0_var(--border-subtle)]">
      <PaneCaret
        side="left"
        label="Show settings navigation"
        onClick={() => setLeftPaneVisible(true)}
      />
    </div>
  );

  const centerPane = (
    <ScrollArea className="h-full">
      <div
        ref={handleScrollViewportRef}
        className="mx-auto flex h-full w-full max-w-[var(--settings-content-w)] flex-col gap-10 px-[var(--settings-pad-x,1.5rem)] py-8 lg:px-0"
      >
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
  );

  return (
    <SettingsStateProvider>
      <TriPane
        className="h-full"
        leftWidth={leftPaneVisible ? 'var(--tripane-left-width)' : '20px'}
        left={leftPane}
        center={centerPane}
        leftHeader={
          leftPaneVisible ? (
            <PaneHeader>
              <div className="min-w-0 truncate font-medium text-[color:var(--text-primary)]">Settings</div>
            </PaneHeader>
          ) : undefined
        }
        centerHeader={null}
      />
      <DirtyBar />
    </SettingsStateProvider>
  );
}
