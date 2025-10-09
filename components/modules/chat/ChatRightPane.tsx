import React from 'react';
import { FileText, Tag, CheckSquare, CalendarPlus, Lightbulb, Link } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../../ui/button';
import { ContextPanel, ContextSection, ContextListItem } from '../context';
import type { Conversation } from './types';

interface ChatRightPaneProps {
  onHidePane: () => void;
  className?: string;
  mode?: 'inline' | 'overlay';
  selectedModel?: string;
  selectedModelLabel?: string;
  conversation?: Conversation | null;
}

type RelatedItem = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export function ChatRightPane({
  onHidePane,
  className,
  mode = 'inline',
  selectedModel = 'gpt-4',
  selectedModelLabel,
  conversation = null,
}: ChatRightPaneProps) {
  const [activeTab, setActiveTab] = React.useState<'insights' | 'settings'>('insights');

  const formattedUpdatedAt = React.useMemo(() => {
    if (!conversation?.updatedAt) return null;
    try {
      return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(conversation.updatedAt));
    } catch {
      return null;
    }
  }, [conversation?.updatedAt]);

  const relatedItems = React.useMemo<RelatedItem[]>(() => {
    if (!conversation) return [];
    const others = (conversation.participants ?? []).filter(name => name.toLowerCase() !== 'you');
    const participantCount = conversation.participants?.length ?? 1;
    const participantLabel = `${participantCount} participant${participantCount === 1 ? '' : 's'}`;
    return [
      {
        id: `${conversation.id}-summary`,
        label: `${conversation.title} summary`,
        description: formattedUpdatedAt ? `Note · Updated ${formattedUpdatedAt}` : 'Note · Draft in progress',
        icon: FileText,
      },
      {
        id: `${conversation.id}-follow-up`,
        label: 'Follow-up task',
        description: others.length ? `Task · Assign to ${others[0]}` : 'Task · Assign an owner',
        icon: CheckSquare,
      },
      {
        id: `${conversation.id}-calendar`,
        label: 'Schedule recap call',
        description: 'Event · Block 30 minutes next week',
        icon: CalendarPlus,
      },
      {
        id: `${conversation.id}-labels`,
        label: 'Conversation tags',
        description: participantLabel,
        icon: Tag,
      },
    ];
  }, [conversation, formattedUpdatedAt]);

  const handleRelatedItemSelect = React.useCallback(
    (itemId: string) => {
      if (!conversation) return;
      console.debug('chat:related-item:open', { conversationId: conversation.id, itemId });
    },
    [conversation]
  );

  const handleTabChange = React.useCallback((tabId: string) => {
    if (tabId === 'insights' || tabId === 'settings') {
      setActiveTab(tabId);
    }
  }, []);

  const handleCollapse = React.useCallback(() => {
    console.debug('chat:pane:right:toggle', { visible: false, source: 'footer' });
    onHidePane();
  }, [onHidePane]);

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
                {relatedItems.length ? (
                  <div className="space-y-[var(--row-gap)]">
                    {relatedItems.map((item) => (
                      <ContextListItem
                        key={item.id}
                        title={item.label}
                        description={item.description}
                        icon={<item.icon className="size-4" aria-hidden="true" />}
                        actionLabel="View"
                        onClick={() => handleRelatedItemSelect(item.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-[length:var(--text-sm)] text-[color:var(--text-secondary)] italic">
                    No recent related items.
                  </p>
                )}
              </section>
            </div>
          ),
        },
        settings: {
          content: (
            <div className="space-y-[var(--space-6)]">
              <div>
                <h4 className="text-sm font-medium text-[color:var(--text-primary)] mb-[var(--space-4)]">
                  Model settings
                </h4>
                <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-[var(--space-3)]">
                  <div className="text-sm text-[color:var(--text-primary)] font-medium">
                    {selectedModelLabel ?? selectedModel}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-[color:var(--text-primary)] mb-[var(--space-4)]">
                  System prompt
                </h4>
                <div className="space-y-[var(--space-2)]">
                  <textarea
                    className="w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-[var(--space-3)] py-[var(--space-2)] text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] resize-none"
                    rows={6}
                    placeholder="Enter system prompt..."
                    defaultValue="You are a helpful assistant."
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[color:var(--text-secondary)]">180/2000</span>
                    <Button variant="outline" size="sm">
                      Clear
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-[color:var(--text-primary)] mb-[var(--space-4)]">
                  Model behavior
                </h4>
                <div className="space-y-[var(--space-4)]">
                  <div className="space-y-[var(--space-2)]">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-[color:var(--text-primary)]">Creativity</label>
                      <span className="text-sm text-[color:var(--text-primary)]">0.7</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      defaultValue="0.7"
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-[color:var(--text-secondary)]">
                      <span>Precise</span>
                      <span>Creative</span>
                    </div>
                  </div>

                  <div className="space-y-[var(--space-2)]">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-[color:var(--text-primary)]">Max response — tokens</label>
                    </div>
                    <input
                      type="number"
                      defaultValue="2000"
                      className="w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-[var(--space-3)] py-[var(--space-2)] text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-[color:var(--text-primary)] mb-[var(--space-4)]">
                  Actions
                </h4>
                <div className="space-y-[var(--space-2)]">
                  <Button variant="outline" className="w-full justify-start">
                    Save as default for gemma3n:e4b
                  </Button>
                  <div className="grid grid-cols-2 gap-[var(--space-2)]">
                    <Button variant="outline" className="justify-center">
                      Reset session
                    </Button>
                    <Button variant="outline" className="justify-center">
                      Reset model defaults
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
      }}
      onCollapse={handleCollapse}
      collapseLabel="Hide assistant info"
      collapseVariant="button"
    />
  );
}