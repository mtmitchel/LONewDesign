import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Separator } from '../../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../ui/accordion';
import { DirtyBar } from './_parts/DirtyBar';
import { SettingsAgents } from './_parts/SettingsAgents';
import { SettingsAssistant } from './_parts/SettingsAssistant';
import { SettingsProviders } from './_parts/SettingsProviders';
import { SettingsAccount } from './_parts/SettingsAccount';
import { SettingsStateProvider } from './_parts/SettingsState';
import { useMediaQuery } from './_parts/useMediaQuery';
import { reportSettingsEvent } from './_parts/analytics';

interface SectionDescriptor {
  id: string;
  label: string;
  keywords: string;
  render: React.ComponentType<{
    id: string;
    filter: (text: string) => boolean;
    registerSection: (node: HTMLElement | null) => void;
  }>;
}

type LayoutMode = 'desktop' | 'tablet' | 'mobile';

const SECTIONS: SectionDescriptor[] = [
  {
    id: 'agents',
    label: 'Agents and models',
    keywords: 'agents models ollama local defaults server',
    render: SettingsAgents,
  },
  {
    id: 'assistant',
    label: 'AI writing assistant',
    keywords: 'assistant writing defaults provider model confidence history',
    render: SettingsAssistant,
  },
  {
    id: 'providers',
    label: 'Cloud providers',
    keywords: 'cloud providers api keys vault base url',
    render: SettingsProviders,
  },
  {
    id: 'account',
    label: 'Account',
    keywords: 'account google integrations calendar mail tasks',
    render: SettingsAccount,
  },
];

export default function SettingsV2(): JSX.Element {
  const [query, setQuery] = useState('');
  const desktop = useMediaQuery('(min-width: 1280px)');
  const tablet = useMediaQuery('(min-width: 768px)');
  const layout: LayoutMode = desktop ? 'desktop' : tablet ? 'tablet' : 'mobile';
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0]?.id ?? 'agents');
  const searchReportedRef = useRef<string>('');
  const lastViewedSection = useRef<string>('');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  const matches = useCallback(
    (text: string) => text.toLowerCase().includes(query.trim().toLowerCase()),
    [query],
  );

  const sectionsToRender = useMemo(() => {
    if (!query.trim()) return SECTIONS;
    return SECTIONS.filter((section) => matches(section.keywords));
  }, [matches, query]);

  useEffect(() => {
    if (!query.trim()) return;
    if (searchReportedRef.current === query.trim()) return;
    searchReportedRef.current = query.trim();
    reportSettingsEvent('settings.search_used', { query: query.trim(), length: query.trim().length });
  }, [query]);

  useEffect(() => {
    if (layout !== 'desktop') {
      observerRef.current?.disconnect();
      return;
    }

    observerRef.current?.disconnect();
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!visible?.target.id) return;
        setActiveSection(visible.target.id);
        if (lastViewedSection.current !== visible.target.id) {
          lastViewedSection.current = visible.target.id;
          reportSettingsEvent('settings.section_view', { id: visible.target.id });
        }
      },
      { rootMargin: '-30% 0px -50% 0px', threshold: [0.2, 0.4, 0.6] },
    );

    sectionsToRender.forEach((section) => {
      const node = sectionRefs.current[section.id];
      if (node) observer.observe(node);
    });

    observerRef.current = observer;
    return () => observer.disconnect();
  }, [layout, sectionsToRender]);

  useEffect(() => {
    if (!sectionsToRender.some((section) => section.id === activeSection)) {
      setActiveSection(sectionsToRender[0]?.id ?? '');
    }
  }, [activeSection, sectionsToRender]);

  const registerSection = useCallback(
    (id: string) => (node: HTMLElement | null) => {
      sectionRefs.current[id] = node;
    },
    [],
  );

  const handleNavClick = useCallback(
    (id: string) => {
      const target = sectionRefs.current[id];
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    },
    [],
  );

  const renderSection = useCallback(
    (descriptor: SectionDescriptor, register: (node: HTMLElement | null) => void) => {
      const Component = descriptor.render;
      return <Component id={descriptor.id} filter={matches} registerSection={register} />;
    },
    [matches],
  );

  const renderDesktop = () => {
    const rendered = sectionsToRender
      .map((section) => ({ id: section.id, element: renderSection(section, registerSection(section.id)) }))
      .filter((entry) => Boolean(entry.element));

    return (
      <div
        className="grid items-start"
        style={{ gridTemplateColumns: 'minmax(0, var(--settings-nav-w)) 1fr', gap: 'var(--settings-card-gap)' }}
      >
        <aside className="sticky top-0 h-[100dvh] border-r border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]">
          <div className="space-y-4 p-4">
            <Input
              placeholder="Search settings"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search settings"
            />
            <nav aria-label="Settings sections" className="space-y-1">
              {rendered.length === 0 && (
                <p className="rounded-[var(--radius-md)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-secondary)]">
                  No sections match your search.
                </p>
              )}
              {sectionsToRender.map((section) => (
                <Button
                  key={section.id}
                  type="button"
                  variant={activeSection === section.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start rounded-[var(--radius-md)] text-sm"
                  onClick={() => handleNavClick(section.id)}
                  aria-current={activeSection === section.id ? 'page' : undefined}
                >
                  {section.label}
                </Button>
              ))}
            </nav>
          </div>
        </aside>
  <main className="mx-auto w-full max-w-[var(--settings-content-w)] space-y-[var(--settings-card-gap)] px-6 pt-8 pb-[7rem]">
          {rendered.length === 0 ? (
            <p className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-6 text-center text-sm text-[var(--text-secondary)]">
              Try a different search. We couldn’t find settings that match.
            </p>
          ) : (
            rendered.map((entry, index) => (
              <React.Fragment key={entry.id}>
                {entry.element}
                {index < rendered.length - 1 && <Separator />}
              </React.Fragment>
            ))
          )}
        </main>
      </div>
    );
  };

  const [tabValue, setTabValue] = useState<string>(sectionsToRender[0]?.id ?? '');
  useEffect(() => {
    if (!sectionsToRender.length) {
      setTabValue('');
      return;
    }
    if (sectionsToRender.every((section) => section.id !== tabValue)) {
      setTabValue(sectionsToRender[0].id);
    }
  }, [sectionsToRender, tabValue]);

  const renderTablet = () => {
    const rendered = sectionsToRender
      .map((section) => ({ id: section.id, element: renderSection(section, () => undefined) }))
      .filter((entry) => Boolean(entry.element));

    return (
  <div className="mx-auto w-full max-w-[var(--settings-content-w)] space-y-6 px-4 pt-6 pb-[6.5rem]">
        <Input
          placeholder="Search settings"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search settings"
        />
        {rendered.length === 0 ? (
          <p className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-6 text-center text-sm text-[var(--text-secondary)]">
            Try a different search. We couldn’t find settings that match.
          </p>
        ) : (
          <Tabs value={tabValue} onValueChange={setTabValue} className="space-y-6">
            <TabsList className="flex flex-wrap gap-2">
              {rendered.map((entry) => (
                <TabsTrigger key={entry.id} value={entry.id} className="rounded-[var(--radius-md)] px-4 py-2">
                  {SECTIONS.find((section) => section.id === entry.id)?.label ?? entry.id}
                </TabsTrigger>
              ))}
            </TabsList>
            {rendered.map((entry) => (
              <TabsContent key={entry.id} value={entry.id} className="space-y-[var(--settings-card-gap)]">
                {entry.element}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    );
  };

  const renderMobile = () => {
    const rendered = sectionsToRender
      .map((section) => ({ id: section.id, element: renderSection(section, () => undefined) }))
      .filter((entry) => Boolean(entry.element));

    return (
  <div className="space-y-4 px-3 pt-4 pb-[6.5rem]">
        <Input
          placeholder="Search settings"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search settings"
        />
        {rendered.length === 0 ? (
          <p className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-6 text-center text-sm text-[var(--text-secondary)]">
            Try a different search. We couldn’t find settings that match.
          </p>
        ) : (
          <Accordion
            type="single"
            collapsible
            className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]"
          >
            {rendered.map((entry) => (
              <AccordionItem key={entry.id} value={entry.id} className="border-none">
                <AccordionTrigger className="px-4 text-base font-semibold text-[var(--text-primary)]">
                  {SECTIONS.find((section) => section.id === entry.id)?.label ?? entry.id}
                </AccordionTrigger>
                <AccordionContent className="space-y-[var(--settings-card-gap)] px-2">
                  {entry.element}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    );
  };

  return (
    <SettingsStateProvider>
  <div className="relative flex h-full min-h-screen flex-1 flex-col bg-[var(--bg-canvas, var(--bg-surface))]">
        <div className="flex-1 overflow-y-auto">
          {layout === 'desktop'
            ? renderDesktop()
            : layout === 'tablet'
            ? renderTablet()
            : renderMobile()}
        </div>
        <DirtyBar />
      </div>
    </SettingsStateProvider>
  );
}
