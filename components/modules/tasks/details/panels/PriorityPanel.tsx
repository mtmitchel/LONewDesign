
import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../../../../ui/popover';
import { Button } from '../../../../ui/button';
import { Flag, Check } from 'lucide-react';
import { cn } from '../../../../ui/utils';
import { badgeVariants } from '../../../../ui/badge';
import { TASK_META_CHIP_CLASS } from '../../taskChipStyles';
import type { Task } from '../../types';

const EMPTY_TILE_BUTTON_CLASS =
  'h-8 w-8 rounded-[var(--radius-md)] flex items-center justify-center bg-[color:var(--bg-surface-elevated)] text-[color:var(--text-tertiary)] transition-colors hover:bg-[color:color-mix(in_oklab,var(--bg-surface-elevated)_92%,transparent)] hover:text-[color:var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-[var(--focus-offset)] focus-visible:ring-offset-[color:var(--bg-panel)]';

interface PriorityPanelProps {
  priority: Task['priority'];
  priorityOpen: boolean;
  setPriorityOpen: (open: boolean) => void;
  handleSave: (updates: { priority: Task['priority'] }) => void;
}

export function PriorityPanel({ priority, priorityOpen, setPriorityOpen, handleSave }: PriorityPanelProps) {
  const priorityLabel = priority !== 'none' ? priority[0].toUpperCase() + priority.slice(1) : '';
  const priorityTone = priority === 'high' ? 'high' : priority === 'medium' ? 'medium' : priority === 'low' ? 'low' : undefined;

  const renderPriorityChip = React.useCallback((value: Task['priority']) => {
    if (value === 'none') return null;
    const tone = value === 'high' ? 'high' : value === 'medium' ? 'medium' : 'low';
    return (
      <span
        className={cn(
          badgeVariants({ variant: 'soft', tone, size: 'sm' }),
          TASK_META_CHIP_CLASS,
        )}
      >
        <Flag className="size-[var(--icon-md)]" aria-hidden />
        <span>{value[0].toUpperCase() + value.slice(1)}</span>
      </span>
    );
  }, []);

  return (
    <div className="grid grid-cols-[var(--task-drawer-label-col)_1fr] gap-x-[var(--space-8)] gap-y-[var(--space-3)]">
      <span className='text-[length:var(--text-sm)] font-medium text-[color:var(--text-secondary)] leading-[var(--line-tight)] flex items-center'>Priority</span>
      <div className='flex items-center min-h-[var(--row-min-h)] w-full text-[color:var(--text-primary)] gap-[var(--chip-gap)]'>
        <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
          <PopoverTrigger asChild>
            {priority === 'none' || !priorityTone ? (
              <button
                type="button"
                aria-label="Choose priority"
                className={EMPTY_TILE_BUTTON_CLASS}
              >
                <Flag className="h-[var(--icon-md)] w-[var(--icon-md)]" strokeWidth={1.25} aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                aria-label={`Choose priority (${priorityLabel})`}
                className={cn(
                  badgeVariants({ variant: 'soft', tone: priorityTone, size: 'sm' }),
                  TASK_META_CHIP_CLASS,
                  'hover:border-[color:var(--border-strong)] focus-visible:border-[color:var(--border-strong)] focus-visible:ring-offset-[var(--bg-panel)]',
                  priorityOpen && 'border-[color:var(--border-strong)]'
                )}
              >
                <Flag className="h-[var(--icon-sm)] w-[var(--icon-sm)]" strokeWidth={1.25} aria-hidden />
                <span>{priorityLabel}</span>
              </button>
            )}
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={8}
            className="w-[min(260px,100vw)] rounded-[var(--radius-md)] border border-[var(--section-border)] bg-[var(--bg-surface-elevated)] p-[var(--space-2)] shadow-[var(--elevation-lg)]"
          >
            <div className="flex flex-col gap-[var(--space-1)]">
              {(['high', 'medium', 'low'] as Task['priority'][]).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={cn(
                    'flex w-full items-center justify-between rounded-[var(--radius-sm)] px-[var(--space-2)] py-[var(--space-1_5)] text-left text-[length:var(--text-sm)] hover:bg-[var(--bg-surface)]',
                    priority === value && 'bg-[color-mix(in_oklab,var(--primary)_10%,transparent)]',
                  )}
                  onClick={() => {
                    handleSave({ priority: value });
                    setPriorityOpen(false);
                  }}
                >
                  <span className="flex items-center gap-[var(--space-2)]">
                    {renderPriorityChip(value)}
                  </span>
                  {priority === value && <Check className="size-4 text-[var(--primary)]" aria-hidden />}
                </button>
              ))}
              <button
                type="button"
                className={cn(
                  'flex w-full items-center justify-between rounded-[var(--radius-sm)] px-[var(--space-2)] py-[var(--space-1_5)] text-left text-[length:var(--text-sm)] text-[color:var(--text-tertiary)] hover:bg-[var(--bg-surface)]',
                  priority === 'none' && 'bg-[color-mix(in_oklab,var(--primary)_6%,transparent)]',
                )}
                onClick={() => {
                  handleSave({ priority: 'none' });
                  setPriorityOpen(false);
                }}
              >
                <span className="inline-flex h-[28px] w-[32px] items-center justify-center">—</span>
                {priority === 'none' && <Check className="size-4 text-[var(--primary)]" aria-hidden />}
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
