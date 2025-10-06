import React from 'react';
import { MoreHorizontal, ArrowUpDown, Check } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../../ui/dropdown-menu';
import type { SortOption } from './types';

interface TaskColumnHeaderProps {
  title: string;
  taskCount: number;
  isHidingCompleted: boolean;
  onToggleHideCompleted: () => void;
  onRename: () => void;
  onDelete: () => void;
  sortOption?: SortOption;
  onSortChange?: (option: SortOption) => void;
}

export function TaskColumnHeader({
  title,
  taskCount,
  isHidingCompleted,
  onToggleHideCompleted,
  onRename,
  onDelete,
  sortOption = 'created',
  onSortChange
}: TaskColumnHeaderProps) {
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'created', label: 'Date created' },
    { value: 'dueDate', label: 'Due date' },
    { value: 'title', label: 'Title' },
    { value: 'priority', label: 'Priority' }
  ];
  return (
    <div className="border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-[var(--space-3)] py-[var(--space-2)] mb-[var(--space-3)] bg-[var(--bg-surface)] group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[var(--space-2)]">
          <h3
            className="text-[var(--text-base)] text-[var(--text-primary)]"
            style={{ fontWeight: 'var(--font-weight-medium)' }}
          >
            {title}
          </h3>
          <Badge
            variant="secondary"
            className="h-5 gap-[var(--space-1)] rounded-full bg-[var(--primary-tint-10)] px-2 text-xs text-[var(--primary)]"
            aria-label={`${taskCount} tasks in ${title}`}
          >
            {taskCount}
          </Badge>
        </div>
        {/* Hover-only controls */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 motion-safe:transition-opacity duration-[var(--duration-fast)]">
          {onSortChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-[var(--text-tertiary)] hover:bg-[var(--primary-tint-5)] hover:text-[var(--primary)]"
                  aria-label={`Sort ${title} tasks`}
                >
                  <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => onSortChange(option.value)}
                    className="flex items-center justify-between"
                  >
                    {option.label}
                    {sortOption === option.value && (
                      <Check className="h-3 w-3 text-[var(--primary)]" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-[var(--text-tertiary)] hover:bg-[var(--primary-tint-5)] hover:text-[var(--primary)]"
                aria-label={`Column options for ${title}`}
              >
                <MoreHorizontal className="h-3 w-3" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onToggleHideCompleted}>
                {isHidingCompleted ? 'Show completed tasks' : 'Hide completed tasks'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRename}>Rename list</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-[var(--danger)] focus:text-[var(--danger)]" onClick={onDelete}>
                Delete list
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
