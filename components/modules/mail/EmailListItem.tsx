import React from 'react';
import {
  AlarmClock,
  Archive,
  BellOff,
  Check,
  ExternalLink,
  Forward,
  Paperclip,
  Reply,
  ReplyAll,
  Search,
  SquareCheck,
  Star,
  Tag,
  Trash,
  MailOpen,
  Folder
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent
} from '../../ui/context-menu';
import { cn } from '../../ui/utils';
import { Email, Label } from './types';

interface EmailListItemProps {
  email: Email;
  labels: Label[];
  isSelected: boolean;
  isChecked: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onCheckboxToggle: (e: React.MouseEvent) => void;
  onOpenEmail: () => void;
}

export function EmailListItem({
  email,
  labels,
  isSelected,
  isChecked,
  onClick,
  onDoubleClick,
  onCheckboxToggle,
  onOpenEmail
}: EmailListItemProps) {
  const menuItemClass = 'gap-[var(--space-3)]';

  const moveDestinations = React.useMemo(
    () => [
      { id: 'inbox', name: 'Inbox' },
      { id: 'starred', name: 'Starred' },
      { id: 'snoozed', name: 'Snoozed' },
      { id: 'important', name: 'Important' },
      { id: 'archive', name: 'Archive' },
      { id: 'trash', name: 'Trash' }
    ],
    []
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          role="row"
          aria-selected={isSelected}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          className={cn(
            'flex h-[var(--mail-row-height)] w-full items-center border-b border-[var(--border-divider)]',
            'bg-[var(--bg-surface)] px-[var(--mail-row-padding-x)] text-left transition-colors cursor-pointer',
            'hover:bg-[var(--mail-row-hover-bg)]',
            isChecked && 'bg-[var(--primary-tint-5)]',
            isSelected && 'ring-1 ring-[var(--primary)] bg-[var(--primary-tint-10)]'
          )}
        >
          <div
            className="flex h-full w-[52px] shrink-0 items-center justify-start"
            onClick={(e) => {
              e.stopPropagation();
              onCheckboxToggle(e);
            }}
          >
            <span
              className={cn(
                'flex h-[var(--checkbox-size)] w-[var(--checkbox-size)] items-center justify-center rounded-sm border',
                'border-[var(--border-default)] bg-[var(--bg-surface)] transition-all',
                isChecked && 'border-[var(--primary)] bg-[var(--primary)]'
              )}
            >
              {isChecked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
            </span>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-3 pr-[var(--mail-row-padding-x)]">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] transition-colors hover:bg-[var(--bg-surface-elevated)]"
              onClick={(e) => {
                e.stopPropagation();
              }}
              aria-label={email.starred ? 'Unstar' : 'Star'}
            >
              <Star
                className={cn(
                  'h-4 w-4 transition-colors',
                  email.starred
                    ? 'fill-[var(--accent-coral)] text-[color:var(--accent-coral)]'
                    : 'text-[color:var(--text-tertiary)] hover:text-[color:var(--text-secondary)]'
                )}
              />
            </button>

            <div className="w-[180px] shrink-0 truncate text-[length:var(--text-sm)] text-[color:var(--text-primary)]">
              {email.sender}
            </div>

            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span
                className={cn(
                  'truncate text-[length:var(--text-sm)]',
                  email.unread
                    ? 'font-[var(--font-weight-medium)] text-[color:var(--text-primary)]'
                    : 'text-[color:var(--text-secondary)]'
                )}
              >
                {email.subject}
              </span>
              <span className="truncate text-[length:var(--text-sm)] text-[color:var(--text-tertiary)]">
                {email.preview}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {email.hasAttachment && (
                <Paperclip className="h-4 w-4 text-[color:var(--text-tertiary)]" />
              )}
              {email.labels.length > 0 && (
                <div className="flex items-center gap-1">
                  {email.labels.slice(0, 2).map((labelId) => {
                    const label = labels.find((l) => l.id === labelId);
                    return label ? (
                      <span
                        key={label.id}
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                    ) : null;
                  })}
                </div>
              )}
              <span className="min-w-[64px] text-right text-[length:var(--text-xs)] text-[color:var(--text-tertiary)]">
                {email.time}
              </span>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem className={menuItemClass}>
          <Reply className="w-4 h-4" />
          Reply
        </ContextMenuItem>
        <ContextMenuItem className={menuItemClass}>
          <ReplyAll className="w-4 h-4" />
          Reply all
        </ContextMenuItem>
        <ContextMenuItem className={menuItemClass}>
          <Forward className="w-4 h-4" />
          Forward
        </ContextMenuItem>
        <ContextMenuItem disabled className={menuItemClass}>
          <Forward className="w-4 h-4" />
          Forward as attachment
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className={menuItemClass}>
          <Archive className="w-4 h-4" />
          Archive
        </ContextMenuItem>
        <ContextMenuItem variant="destructive" className={menuItemClass}>
          <Trash className="w-4 h-4" />
          Delete
        </ContextMenuItem>
        <ContextMenuItem className={menuItemClass}>
          <MailOpen className="w-4 h-4" />
          Mark as read
        </ContextMenuItem>
        <ContextMenuItem className={menuItemClass}>
          <AlarmClock className="w-4 h-4" />
          Snooze
        </ContextMenuItem>
        <ContextMenuItem className={menuItemClass}>
          <SquareCheck className="w-4 h-4" />
          Add to Tasks
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger className={menuItemClass}>
            <Folder className="w-4 h-4" />
            Move to
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            {moveDestinations.map((destination) => (
              <ContextMenuItem key={destination.id} className={menuItemClass}>
                {destination.name}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSub>
          <ContextMenuSubTrigger className={menuItemClass}>
            <Tag className="w-4 h-4" />
            Label as
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            {labels.length ? (
              labels.map((label) => (
                <ContextMenuItem key={label.id} className={menuItemClass}>
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                </ContextMenuItem>
              ))
            ) : (
              <ContextMenuItem disabled className={menuItemClass}>
                No labels
              </ContextMenuItem>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuItem className={menuItemClass}>
          <BellOff className="w-4 h-4" />
          Mute
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className={menuItemClass}>
          <Search className="w-4 h-4" />
          {`Find emails from ${email.sender}`}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onOpenEmail} className={menuItemClass}>
          <ExternalLink className="w-4 h-4" />
          Open in new window
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}