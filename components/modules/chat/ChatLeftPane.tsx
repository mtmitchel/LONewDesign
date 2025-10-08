import * as React from 'react';
import { Input } from '../../ui/input';
import { PaneCaret, PaneFooter } from '../../dev/PaneCaret';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../../ui/context-menu';
import { FileText, FileType, Pencil, Pin, PinOff, Trash2, Braces, Search } from 'lucide-react';
import { cn } from '../../ui/utils';
import type { Conversation, ConversationAction } from './types';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';

interface ChatLeftPaneProps {
  conversations?: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onHidePane?: () => void;
  className?: string;
  onConversationAction?: (id: string, action: ConversationAction) => void;
  isLoading?: boolean;
}

export type ChatLeftPaneHandle = {
  focusSearch: () => void;
};

export const ChatLeftPane = React.forwardRef<ChatLeftPaneHandle, ChatLeftPaneProps>(function ChatLeftPane(
  {
    conversations = [],
    activeId,
    onSelect,
    onHidePane,
    className,
    onConversationAction,
    isLoading = false,
  },
  ref
) {
  const [query, setQuery] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const itemRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const searchRef = React.useRef<HTMLInputElement | null>(null);

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

  const handleAction = React.useCallback(
    (conversationId: string, action: ConversationAction) => {
      console.debug('chat:conversation:action', { conversationId, action });
      onConversationAction?.(conversationId, action);
    },
    [onConversationAction]
  );

  React.useImperativeHandle(ref, () => ({
    focusSearch: () => {
      searchRef.current?.focus();
      searchRef.current?.select();
    },
  }));

  const renderSkeleton = () => (
    <div className="space-y-[var(--space-2)] px-[var(--space-4)] py-[var(--space-3)]">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`chat-skeleton-${index}`}
          className="rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)]/80 animate-pulse"
        >
          <div className="h-[var(--list-row-min-h)]" />
        </div>
      ))}
    </div>
  );

  return (
    <div className={cn('flex h-full flex-col bg-[var(--bg-surface)]', className)}>
      <div className="px-[var(--space-4)] pt-[var(--space-3)] pb-[var(--space-2)]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-[var(--space-3)] top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-tertiary)]" />
          <Input
            ref={searchRef}
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search conversations"
            className="h-[var(--field-height)] bg-[var(--bg-surface)] border border-[var(--border-default)] pl-10 placeholder:text-[color:var(--text-tertiary)] focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary-tint-10)]"
          />
        </div>
      </div>
      <div
        ref={listRef}
        role="listbox"
        aria-label="Conversation list"
        aria-activedescendant={filtered[activeIndex] ? `chat-conversation-${filtered[activeIndex].id}` : undefined}
        className="flex-1 overflow-y-auto"
        onKeyDown={handleKeyDown}
      >
        {isLoading ? renderSkeleton() : null}
        {filtered.map((conversation, index) => {
          const isActive = conversation.id === activeId;
          const isFocused = index === activeIndex;
          const pinAction = conversation.pinned ? 'unpin' : 'pin';
          return (
            <ContextMenu key={conversation.id}>
              <ContextMenuTrigger asChild>
                <div
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
                  onContextMenu={() => focusRow(index)}
                  className={cn(
                    'group relative grid min-h-[var(--list-row-min-h)] grid-cols-[var(--chat-rail-w)_1fr] items-start px-[var(--list-row-pad-x)] py-[var(--list-row-pad-y)]',
                    'cursor-pointer motion-safe:transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]',
                    isActive
                      ? 'bg-[color-mix(in_oklab,var(--primary-tint-5) 55%, transparent)] text-[color:var(--text-primary)]'
                      : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)]'
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'block h-full w-full rounded-l-[var(--radius-md)] transition-colors duration-[var(--duration-fast)] ease-[var(--easing-standard)]',
                      isActive ? 'bg-[var(--primary)]' : 'bg-transparent'
                    )}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-[var(--space-2)]">
                      <div className="flex min-w-0 items-center gap-[var(--space-2)]">
                        <div className="truncate text-[length:var(--list-row-font)] font-medium text-[color:var(--text-primary)]">
                          {conversation.title}
                        </div>
                        {conversation.pinned ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center text-[color:var(--text-tertiary)]">
                                <Pin className="h-3.5 w-3.5" aria-hidden="true" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top">Pinned</TooltipContent>
                          </Tooltip>
                        ) : null}
                      </div>
                      {!isActive && conversation.unread ? (
                        <span
                          aria-hidden="true"
                          className="mt-[var(--space-1)] inline-flex shrink-0 rounded-full bg-[var(--primary-tint-5)] opacity-60"
                          style={{ width: 'var(--space-2)', height: 'var(--space-2)' }}
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-48">
                <ContextMenuItem onSelect={() => handleAction(conversation.id, pinAction)}>
                  {conversation.pinned ? (
                    <PinOff className="mr-2 h-4 w-4" />
                  ) : (
                    <Pin className="mr-2 h-4 w-4" />
                  )}
                  {conversation.pinned ? 'Unpin' : 'Pin'}
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => handleAction(conversation.id, 'rename')}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onSelect={() => handleAction(conversation.id, 'export-text')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export as Text
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => handleAction(conversation.id, 'export-markdown')}>
                  <FileType className="mr-2 h-4 w-4" />
                  Export as Markdown
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => handleAction(conversation.id, 'export-json')}>
                  <Braces className="mr-2 h-4 w-4" />
                  Export as JSON
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => handleAction(conversation.id, 'export-pdf')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export as PDF
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  onSelect={() => handleAction(conversation.id, 'delete')}
                  variant="destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
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
            variant="button"
          />
        </PaneFooter>
      )}
    </div>
  );
});
