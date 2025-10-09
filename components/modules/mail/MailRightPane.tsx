import React from 'react';
import { FileText } from 'lucide-react';
import { ContextPanel, ContextSection } from '../context';
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
  const [activeTab, setActiveTab] = React.useState<'insights' | 'settings'>('insights');
  const [settings, setSettings] = React.useState<MailSettings>(DEFAULT_MAIL_SETTINGS);
  const handleTabChange = React.useCallback((tabId: string) => {
    if (tabId === 'insights' || tabId === 'settings') {
      setActiveTab(tabId);
    }
  }, []);

  return (
    <ContextPanel
      className={className}
      tabs={[
        { id: 'insights', label: 'Insights' },
        { id: 'settings', label: 'Settings' },
      ]}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      panels={{
        insights: {
          content: (
            <div className="space-y-[var(--space-6)]">
              <section className="space-y-[var(--space-4)]">
                <div className="flex items-center gap-[var(--space-2)]">
                  <FileText className="size-4 text-[color:var(--text-primary)]" aria-hidden="true" />
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
                  <svg className="size-4 text-[color:var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <h4 className="text-[length:var(--text-sm)] text-[color:var(--text-primary)] font-semibold">Related items</h4>
                </div>
                <p className="text-[length:var(--text-sm)] text-[color:var(--text-secondary)] italic">
                  No recent related items.
                </p>
              </section>
            </div>
          ),
        },
        settings: {
          padding: 'none',
          content: (
            <RightContextSettings
              value={settings}
              onChange={setSettings}
              onResetDefaults={() => setSettings({ ...DEFAULT_MAIL_SETTINGS })}
              onRestoreRecommended={() => setSettings({ ...RECOMMENDED_MAIL_SETTINGS })}
              className="px-[var(--panel-pad-x)] pb-[var(--space-8)]"
            />
          ),
        },
      }}
      onCollapse={onHidePane}
    />
  );
}