import React from 'react';
import { FileText } from 'lucide-react';
import { cn } from '../../ui/utils';
import { PaneCaret, PaneFooter } from '../../dev/PaneCaret';
import { PaneColumn } from '../../layout/PaneColumn';
import { PaneHeader } from '../../layout/PaneHeader';
import RightContextSettings, {
  DEFAULT_MAIL_SETTINGS,
  MailSettings,
  RECOMMENDED_MAIL_SETTINGS
} from './RightContextSettings';

interface MailRightPaneProps {
  onHidePane: () => void;
  className?: string;
}

export function MailRightPane({ onHidePane, className }: MailRightPaneProps) {
  const [activeTab, setActiveTab] = React.useState<'context' | 'settings'>('context');
  const [settings, setSettings] = React.useState<MailSettings>(DEFAULT_MAIL_SETTINGS);
  return (
    <PaneColumn className={`h-full ${className || ''}`} showLeftDivider showRightDivider={false}>
      <PaneHeader role="tablist" className="gap-[var(--space-6)] px-[var(--panel-pad-x)]">
        <PaneTabButton
          label="Context"
          active={activeTab === 'context'}
          onClick={() => setActiveTab('context')}
        />
        <PaneTabButton
          label="Settings"
          active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
        />
      </PaneHeader>

      {activeTab === 'context' ? (
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <div className="space-y-[var(--space-6)]">
            <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-[var(--space-4)] text-sm text-[color:var(--text-secondary)]">
              <p>Capture follow-ups from anywhere with the assistant.</p>
              <p className="mt-[var(--space-2)] text-xs text-[color:var(--text-tertiary)]" aria-hidden>
                Press ⌘/Ctrl+K to add
              </p>
            </div>

            <div className="py-[var(--space-8)] text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-[color:var(--text-secondary)] opacity-30" />
              <h4 className="mb-2 text-sm font-medium text-[color:var(--text-primary)]">
                No related items
              </h4>
              <p className="text-xs text-[color:var(--text-secondary)] leading-relaxed">
                Select a message to see related items
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <RightContextSettings
            value={settings}
            onChange={setSettings}
            onResetDefaults={() => setSettings({ ...DEFAULT_MAIL_SETTINGS })}
            onRestoreRecommended={() => setSettings({ ...RECOMMENDED_MAIL_SETTINGS })}
            className="pb-[var(--space-8)]"
          />
        </div>
      )}

      <PaneFooter>
        <PaneCaret
          direction="right"
          onClick={onHidePane}
          tooltipText="Hide context"
          shortcut="\\"
        />
      </PaneFooter>
    </PaneColumn>
  );
}

function PaneTabButton({
  label,
  active,
  onClick
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
        active
          ? 'text-[color:var(--text-primary)]'
          : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'
      )}
    >
      {label}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute left-0 right-0 -bottom-1 h-0.5 rounded-full transition-opacity',
          active ? 'bg-[var(--primary)] opacity-100' : 'bg-transparent opacity-0'
        )}
      />
    </button>
  );
}