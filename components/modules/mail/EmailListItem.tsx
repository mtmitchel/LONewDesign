import React from 'react';
import {
  AlarmClock,
  Archive,
  BellOff,
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
import { Checkbox } from '../../ui/checkbox';
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
      <ContextMenuTrigger>
        <div
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          className={`w-full py-2 px-[var(--space-4)] text-left hover:bg-[var(--border-divider)] transition-colors cursor-pointer ${
            isChecked ? 'bg-[var(--primary-tint-5)]' : ''
          } ${
            isSelected ? 'ring-1 ring-[var(--primary)] bg-[var(--primary-tint-10)]' : ''
          }`}
          style={{ minHeight: '60px' }}
        >
          <div className="flex items-start gap-[var(--space-3)] py-1">
            <Checkbox 
              checked={isChecked}
              onChange={(e) => onCheckboxToggle(e as any)}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-sm ${email.unread ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
                  {email.sender}
                </span>
                <div className="flex items-center gap-[var(--space-2)]">
                  {email.hasAttachment && <Paperclip className="w-3 h-3 text-[var(--text-secondary)]" />}
                  {email.starred && <Star className="w-3 h-3 fill-[var(--accent-coral)] text-[var(--accent-coral)]" />}
                  <span className="text-xs text-[var(--text-secondary)]">{email.time}</span>
                </div>
              </div>
              <div className={`text-sm mb-0.5 ${email.unread ? 'font-medium text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>
                {email.subject}
              </div>
              <div className="text-sm text-[var(--text-secondary)] truncate">
                {email.preview}
              </div>
              {email.labels.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {email.labels.slice(0, 2).map(labelId => {
                    const label = labels.find(l => l.id === labelId);
                    return label ? (
                      <div
                        key={labelId}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                    ) : null;
                  })}
                </div>
              )}
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