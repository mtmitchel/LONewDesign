import React from 'react';
import { FileText, Tag, CheckSquare, CalendarPlus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../../ui/button';
import { cn } from '../../ui/utils';
import { PaneCaret, PaneFooter } from '../../dev/PaneCaret';
import { PaneColumn } from '../../layout/PaneColumn';
import { PaneHeader } from '../../layout/PaneHeader';
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
  const [activeTab, setActiveTab] = React.useState<'context' | 'settings'>('context');

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
              <p>Use the assistant to capture follow-ups or share transcripts.</p>
              <p className="mt-[var(--space-2)] text-xs text-[color:var(--text-tertiary)]" aria-hidden>
                Press ⌘/Ctrl+K to add
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-[color:var(--text-primary)] mb-[var(--space-4)]">
                Related items
              </h4>
              {relatedItems.length ? (
                <div className="space-y-[var(--space-2)]">
                  {relatedItems.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleRelatedItemSelect(item.id)}
                      className="group w-full rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-[var(--space-3)] py-[var(--space-3)] text-left shadow-none transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)] hover:bg-[var(--bg-surface-elevated)] hover:shadow-[var(--elevation-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]"
                    >
                      <div className="flex items-center gap-[var(--space-3)]">
                        <span className="grid size-8 place-items-center rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)] text-[color:var(--primary)] opacity-80 group-hover:opacity-100">
                          <item.icon className="size-4" aria-hidden="true" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm font-medium text-[color:var(--text-primary)]">
                            {item.label}
                          </div>
                          <div className="mt-[var(--space-1)] truncate text-xs text-[color:var(--text-secondary)]">
                            {item.description}
                          </div>
                        </div>
                        <span className="text-xs font-medium text-[color:var(--primary)] opacity-0 transition-opacity duration-[var(--duration-fast)] group-hover:opacity-100">
                          View
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-[var(--space-8)]">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-[color:var(--text-secondary)] opacity-30" />
                  <h4 className="text-sm font-medium text-[color:var(--text-primary)] mb-2">
                    No related items
                  </h4>
                  <p className="text-xs text-[color:var(--text-secondary)] leading-relaxed">
                    Select a conversation to see related items
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
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
        </div>
      )}

      <PaneFooter>
        <PaneCaret
          side="right"
          label="Hide assistant info"
          ariaKeyshortcuts="\\"
          onClick={() => {
            console.debug('chat:pane:right:toggle', { visible: false, source: 'footer' });
            onHidePane();
          }}
          variant="button"
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
          'pointer-events-none absolute left-0 right-0 -bottom-1 rounded-full transition-opacity duration-[var(--duration-fast)] ease-[var(--easing-standard)]',
          active ? 'bg-[var(--primary)] opacity-100' : 'bg-transparent opacity-0'
        )}
        style={{ height: 'var(--border-strong)' }}
      />
    </button>
  );
}