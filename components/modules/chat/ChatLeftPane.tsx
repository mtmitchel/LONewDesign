import * as React from 'react';
import { Input } from '../../ui/input';
import { PaneCaret, PaneFooter } from '../../dev/PaneCaret';
import { cn } from '../../ui/utils';
import type { Conversation } from './types';

interface ChatLeftPaneProps {
  conversations?: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onHidePane?: () => void;
  className?: string;
}

export function ChatLeftPane({
  conversations = [],
  activeId,
  onSelect,
  onHidePane,
  className,
}: ChatLeftPaneProps) {
  const [query, setQuery] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const itemRefs = React.useRef<Array<HTMLDivElement | null>>([]);

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    return conversations.filter(c =>
      c.title.toLowerCase().includes(q) || c.lastMessageSnippet.toLowerCase().includes(q)
    );
  }, [conversations, query]);

  React.useEffect(() => {
    const nextIndex = filtered.length ? Math.max(0, filtered.findIndex(c => c.id === activeId)) : 0;
    setActiveIndex(nextIndex === -1 ? 0 : nextIndex);
  }, [activeId, filtered]);

  React.useEffect(() => {
    const node = itemRefs.current[activeIndex];
    if (node && node !== document.activeElement) {
      node.focus();
    }
  }, [activeIndex, filtered.length]);

  const focusRow = React.useCallback(
    (nextIndex: number) => {
      const clamped = Math.max(0, Math.min(nextIndex, filtered.length - 1));
      setActiveIndex(clamped);
    },
    [filtered.length]
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!filtered.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusRow(activeIndex + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusRow(activeIndex - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusRow(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusRow(filtered.length - 1);
    } else if (event.key === 'Enter') {
      const item = filtered[activeIndex];
      if (item) {
        console.debug('chat:conversation:open', { id: item.id, via: 'keyboard' });
        onSelect(item.id);
      }
    }
  };

  return (
    <div className={cn('flex h-full flex-col bg-[var(--bg-surface)]', className)}>
      <div className="px-[var(--space-4)] pt-[var(--space-3)] pb-[var(--space-2)]">
        <Input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search conversations"
          className="h-[var(--field-height)]"
        />
      </div>
      <div
        ref={listRef}
        role="listbox"
        aria-label="Conversation list"
        aria-activedescendant={filtered[activeIndex] ? `chat-conversation-${filtered[activeIndex].id}` : undefined}
        className="flex-1 overflow-y-auto"
        onKeyDown={handleKeyDown}
      >
        {filtered.map((conversation, index) => {
          const isActive = conversation.id === activeId;
          const isFocused = index === activeIndex;
          return (
            <div
              key={conversation.id}
              id={`chat-conversation-${conversation.id}`}
              role="option"
              aria-selected={isActive}
              tabIndex={isFocused ? 0 : -1}
              ref={node => {
                itemRefs.current[index] = node;
              }}
              onFocus={() => focusRow(index)}
              onClick={() => {
                focusRow(index);
                console.debug('chat:conversation:open', { id: conversation.id, via: 'pointer' });
                onSelect(conversation.id);
              }}
              className={cn(
                'min-h-[var(--list-row-min-h)] px-[var(--list-row-pad-x)] py-[var(--list-row-pad-y)]',
                'border-b border-[var(--border-subtle)] cursor-pointer motion-safe:transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]',
                isActive
                  ? 'bg-[color-mix(in_oklab,var(--primary-tint-5) 55%, transparent)] text-[var(--text-primary)]'
                  : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)]'
              )}
            >
              <div className="flex items-center justify-between gap-[var(--space-2)]">
                <div className="font-medium text-[var(--text-primary)] truncate">{conversation.title}</div>
                {conversation.unread && (
                  <span
                    aria-hidden="true"
                    className="inline-flex shrink-0 rounded-full bg-[var(--primary-tint-5)]"
                    style={{ width: 'var(--space-2)', height: 'var(--space-2)' }}
                  />
                )}
              </div>
              <div className="mt-[var(--space-1)] text-sm text-[var(--text-tertiary)] truncate">
                {conversation.lastMessageSnippet}
              </div>
            </div>
          );
        })}
      </div>
      {onHidePane && (
        <PaneFooter>
          <PaneCaret
            side="left"
            label="Hide conversations"
            ariaKeyshortcuts="["
            onClick={onHidePane}
          />
        </PaneFooter>
      )}
    </div>
  );
}
