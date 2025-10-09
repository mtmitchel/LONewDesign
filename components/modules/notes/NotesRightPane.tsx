import React from 'react';
import { FileText, Lightbulb, Link } from 'lucide-react';
import { cn } from '../../ui/utils';
import { PaneCaret, PaneFooter } from '../../dev/PaneCaret';
import { PaneColumn } from '../../layout/PaneColumn';
import { PaneHeader } from '../../layout/PaneHeader';
import { NotesContextPanel } from './NotesContextPanel';
import type { NotesSettings } from './types';

interface NotesRightPaneProps {
  onHidePane: () => void;
  className?: string;
  settings: NotesSettings;
  onSettingsChange: (updates: Partial<NotesSettings>) => void;
}

export function NotesRightPane({ onHidePane, className, settings, onSettingsChange }: NotesRightPaneProps) {
  const [activeTab, setActiveTab] = React.useState<'insights' | 'settings'>('insights');

  return (
    <PaneColumn className={`h-full ${className || ''}`} showLeftDivider showRightDivider={false}>
      <PaneHeader role="tablist" className="gap-[var(--space-6)] px-[var(--panel-pad-x)]">
        <PaneTabButton label="Insights" active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} />
        <PaneTabButton label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </PaneHeader>

      {activeTab === 'insights' ? (
        <div className="flex-1 min-h-0 overflow-y-auto p-[var(--panel-pad-x)] py-[var(--panel-pad-y)]">
                    <div className="space-y-[var(--space-6)]">
            <section className="space-y-[var(--space-4)]">
              <div className="flex items-center gap-[var(--space-2)]">
                <Lightbulb className="size-4 text-[color:var(--text-primary)]" aria-hidden="true" />
                <h4 className="text-[length:var(--text-sm)] text-[color:var(--text-primary)] font-semibold">AI insights</h4>
              </div>
              <p className="text-[length:var(--text-sm)] text-[color:var(--text-secondary)] italic">
                Nothing to surface right now.
              </p>
            </section>

            <section className="space-y-[var(--space-4)]">
              <div className="flex items-center gap-[var(--space-2)]">
                <svg className="size-4 text-[color:var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <h4 className="text-[length:var(--text-sm)] text-[color:var(--text-primary)] font-semibold">Reminders</h4>
              </div>
              <p className="text-[length:var(--text-sm)] text-[color:var(--text-secondary)] italic">
                No reminders.
              </p>
            </section>

            <section className="space-y-[var(--space-4)]">
              <div className="flex items-center gap-[var(--space-2)]">
                <Link className="size-4 text-[color:var(--text-primary)]" aria-hidden="true" />
                <h4 className="text-[length:var(--text-sm)] text-[color:var(--text-primary)] font-semibold">Related items</h4>
              </div>
              <p className="text-[length:var(--text-sm)] text-[color:var(--text-secondary)] italic">
                No recent related items.
              </p>
            </section>

            <section className="space-y-[var(--space-4)]">
              <div className="flex items-center gap-[var(--space-2)]">
                <FileText className="size-4 text-[color:var(--text-primary)]" aria-hidden="true" />
                <h4 className="text-[length:var(--text-sm)] text-[color:var(--text-primary)] font-semibold">Linked notes</h4>
              </div>
              <p className="text-[length:var(--text-sm)] text-[color:var(--text-secondary)] italic">
                No linked notes.
              </p>
            </section>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <NotesContextPanel
            note={null}
            settings={settings}
            onSettingsChange={onSettingsChange}
            showSections={{ details: false, tags: false, view: true, sort: true, actions: false, footer: false }}
            isSaving={false}
            onTagAdd={() => {}}
            onTagRemove={() => {}}
            onToggleStar={() => {}}
            onDuplicate={() => {}}
            onDelete={() => {}}
          />
        </div>
      )}

      <PaneFooter>
        <PaneCaret direction="right" onClick={onHidePane} tooltipText="Hide context" shortcut="\\" />
      </PaneFooter>
    </PaneColumn>
  );
}

function PaneTabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'relative pb-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]',
        active ? 'text-[color:var(--text-primary)]' : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]',
      )}
    >
      {label}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute left-0 right-0 -bottom-1 h-0.5 rounded-full transition-opacity',
          active ? 'bg-[var(--primary)] opacity-100' : 'bg-transparent opacity-0',
        )}
      />
    </button>
  );
}
