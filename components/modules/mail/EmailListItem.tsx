import React from 'react';
import { Star, Paperclip, Mail, Reply, Forward, Archive, Trash, Tag } from 'lucide-react';
import { Checkbox } from '../../ui/checkbox';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from '../../ui/context-menu';
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
            <Avatar className="w-7 h-7">
              <AvatarFallback className="bg-[var(--primary-tint-15)] text-[var(--primary)] text-sm">
                {email.sender.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
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
      <ContextMenuContent>
        <ContextMenuItem onClick={onOpenEmail}>
          <Mail className="w-4 h-4" />
          Open Email
        </ContextMenuItem>
        <ContextMenuItem>
          <Reply className="w-4 h-4" />
          Reply
        </ContextMenuItem>
        <ContextMenuItem>
          <Forward className="w-4 h-4" />
          Forward
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>
          <Star className="w-4 h-4" />
          {email.starred ? 'Remove Star' : 'Add Star'}
        </ContextMenuItem>
        <ContextMenuItem>
          <Tag className="w-4 h-4" />
          Add Label
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>
          <Archive className="w-4 h-4" />
          Archive
        </ContextMenuItem>
        <ContextMenuItem className="text-[var(--danger)]">
          <Trash className="w-4 h-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}