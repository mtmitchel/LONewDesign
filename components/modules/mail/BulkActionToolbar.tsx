import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../../ui/dropdown-menu';
import { cn } from '../../ui/utils';
import {
  Archive,
  Check,
  ChevronDown,
  Clock,
  FolderInput,
  Mail,
  RefreshCw,
  Star,
  Trash2
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PaginationControl } from './PaginationControl';

export interface BulkActionToolbarProps {
  selectedCount: number;
  totalCount: number;
  currentStart: number;
  currentEnd: number;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onSelectRead: () => void;
  onSelectUnread: () => void;
  onSelectStarred: () => void;
  onSelectUnstarred: () => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  onRefresh?: () => void;
  onMarkRead?: () => void;
  onMarkUnread?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onMove?: () => void;
  onSnooze?: () => void;
  onStar?: () => void;
  className?: string;
}

export function BulkActionToolbar({
  selectedCount,
  totalCount,
  currentStart,
  currentEnd,
  onSelectAll,
  onSelectNone,
  onSelectRead,
  onSelectUnread,
  onSelectStarred,
  onSelectUnstarred,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  onRefresh,
  onMarkRead,
  onMarkUnread,
  onArchive,
  onDelete,
  onMove,
  onSnooze,
  onStar,
  className
}: BulkActionToolbarProps) {
  const hasSelection = selectedCount > 0;
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className={cn(
        'flex items-center h-[var(--toolbar-height)] border-b border-[var(--border-default)] bg-[var(--bg-surface)]',
        className
      )}
    >
      <div className="flex items-center gap-[var(--toolbar-gap)] px-[var(--toolbar-padding-x)]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Select messages"
              className={cn(
                'flex items-center gap-1 h-8 px-2 -ml-2 rounded-[var(--radius-sm)]',
                'text-[length:var(--text-sm)] text-[color:var(--text-primary)]',
                'transition-colors hover:bg-[var(--bg-surface-elevated)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2'
              )}
            >
              <span
                className={cn(
                  'flex h-[var(--checkbox-size)] w-[var(--checkbox-size)] items-center justify-center rounded-sm border',
                  'border-[var(--border-default)] bg-[var(--bg-surface)] transition-colors',
                  allSelected && 'border-[var(--primary)] bg-[var(--primary)] text-white',
                  !allSelected && hasSelection && 'border-[var(--primary)] bg-[var(--primary)]'
                )}
              >
                {allSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                {!allSelected && hasSelection && (
                  <span className="h-0.5 w-2 rounded-sm bg-white" />
                )}
              </span>
              <ChevronDown className="h-4 w-4 text-[color:var(--text-secondary)]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            sideOffset={4}
            className={cn(
              'min-w-[var(--mail-dropdown-min-w)] rounded-[var(--mail-dropdown-radius)] border-[var(--mail-dropdown-border)]',
              'bg-[var(--mail-dropdown-bg)] p-1 shadow-[var(--mail-dropdown-elevation)]'
            )}
          >
            <DropdownItem onSelect={onSelectAll}>All</DropdownItem>
            <DropdownItem onSelect={onSelectNone}>None</DropdownItem>
            <DropdownMenuSeparator className="my-1 h-px bg-[var(--border-divider)]" />
            <DropdownItem onSelect={onSelectRead}>Read</DropdownItem>
            <DropdownItem onSelect={onSelectUnread}>Unread</DropdownItem>
            <DropdownItem onSelect={onSelectStarred}>Starred</DropdownItem>
            <DropdownItem onSelect={onSelectUnstarred}>Unstarred</DropdownItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {onRefresh && (
          <ToolbarButton icon={RefreshCw} label="Refresh" onClick={onRefresh} />
        )}

        {hasSelection && onMarkRead && (
          <ToolbarButton icon={Check} label="Mark as read" onClick={onMarkRead} />
        )}

        {hasSelection && onMarkUnread && (
          <ToolbarButton icon={Mail} label="Mark as unread" onClick={onMarkUnread} />
        )}

        {hasSelection && onArchive && (
          <ToolbarButton icon={Archive} label="Archive" onClick={onArchive} />
        )}

        {hasSelection && onDelete && (
          <>
            <span className="h-5 w-px bg-[var(--border-divider)]" aria-hidden />
            <ToolbarButton icon={Trash2} label="Delete" onClick={onDelete} variant="destructive" />
          </>
        )}

        {hasSelection && onMove && (
          <ToolbarButton icon={FolderInput} label="Move to" onClick={onMove} />
        )}

        {hasSelection && onSnooze && (
          <ToolbarButton icon={Clock} label="Snooze" onClick={onSnooze} />
        )}

        {hasSelection && onStar && (
          <ToolbarButton icon={Star} label="Star" onClick={onStar} />
        )}

        {hasSelection && (
          <span className="text-[length:var(--text-sm)] text-[color:var(--text-secondary)]">
            {selectedCount} selected
          </span>
        )}
      </div>

      <div className="ml-auto pr-[var(--toolbar-padding-x)]">
        <PaginationControl
          currentStart={currentStart}
          currentEnd={currentEnd}
          total={totalCount}
          onPrevious={onPrevious}
          onNext={onNext}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
        />
      </div>
    </div>
  );
}

interface ToolbarButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}

function ToolbarButton({ icon: Icon, label, onClick, variant = 'default', disabled }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        variant === 'default'
          ? 'text-[color:var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[color:var(--text-primary)] focus:ring-[var(--primary)]'
          : 'text-[color:var(--text-secondary)] hover:bg-[var(--accent-coral-tint-10)] hover:text-[color:var(--danger)] focus:ring-[var(--danger)]',
        disabled && 'cursor-not-allowed opacity-40'
      )}
    >
      <Icon className="h-[var(--toolbar-icon-size)] w-[var(--toolbar-icon-size)]" />
    </button>
  );
}

function DropdownItem({ children, onSelect }: { children: React.ReactNode; onSelect: () => void }) {
  return (
    <DropdownMenuItem
      onSelect={onSelect}
      className={cn(
        'flex h-[var(--mail-dropdown-item-height)] items-center rounded-[var(--radius-sm)]',
  'px-[var(--mail-dropdown-item-padding-x)] text-[length:var(--text-sm)] text-[color:var(--text-primary)]',
        'transition-colors hover:bg-[var(--bg-surface-elevated)] focus:bg-[var(--bg-surface-elevated)]'
      )}
    >
      {children}
    </DropdownMenuItem>
  );
}
