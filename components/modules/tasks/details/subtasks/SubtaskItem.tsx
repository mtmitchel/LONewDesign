
import * as React from 'react';
import { CheckSquare, Edit, Copy, Trash, Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../../../../ui/popover';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '../../../../ui/context-menu';
import { Calendar as CalendarComponent } from '../../../../ui/calendar';
import { cn } from '../../../../ui/utils';
import { format } from 'date-fns';
import type { Subtask } from '../../types';

const SUBTASK_ROW_STYLE: React.CSSProperties = {
  gridTemplateColumns: 'auto minmax(0, 1fr) auto',
  columnGap: 'var(--list-row-gap)',
  minHeight: 'var(--list-row-min-h)',
  paddingLeft: 'var(--list-row-pad-x)',
  paddingRight: 'var(--list-row-pad-x)',
};

const TASK_META_CHIP_CLASS =
  'h-[var(--chip-height)] rounded-[var(--radius-sm)] px-[var(--chip-px)] text-[length:var(--chip-text)] font-medium shadow-[inset_0_0_0_1px_var(--chip-border)] transition-colors';

interface SubtaskItemProps {
  subtask: Subtask;
  subtaskInputRefs: React.RefObject<Map<string, HTMLInputElement>>;
  activeSubtaskDatePicker: string | null;
  setActiveSubtaskDatePicker: (id: string | null) => void;
  handleToggleSubtaskCompletion: (subtaskId: string, isCompleted: boolean) => void;
  handleUpdateSubtaskDueDate: (subtaskId: string, dueDate: string | undefined) => void;
  handleDeleteSubtask: (subtaskId: string) => void;
  handleSubtaskTitleChange: (subtaskId: string, title: string) => void;
  handleSubtaskTitleCommit: () => void;
  openSubtaskComposer: () => void;
  focusSubtaskInput: (subtaskId: string) => void;
  handleSubtaskDueDateSelection: (subtaskId: string, date: Date | undefined) => void;
  handleClearSubtaskDueDate: (subtaskId: string) => void;
  handleDuplicateSubtask: (subtaskId: string) => void;
}

export function SubtaskItem({ subtask, subtaskInputRefs, activeSubtaskDatePicker, setActiveSubtaskDatePicker, handleToggleSubtaskCompletion, handleUpdateSubtaskDueDate, handleDeleteSubtask, handleSubtaskTitleChange, handleSubtaskTitleCommit, openSubtaskComposer, focusSubtaskInput, handleSubtaskDueDateSelection, handleClearSubtaskDueDate, handleDuplicateSubtask }: SubtaskItemProps) {
  const rawDue = (subtask.dueDate ?? '').trim();
  const parsedDueDate = rawDue ? new Date(rawDue) : null;
  const hasValidDue = parsedDueDate && !Number.isNaN(parsedDueDate.getTime());
  const isDueToday =
    hasValidDue && format(parsedDueDate as Date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const isDueOverdue = hasValidDue && (parsedDueDate as Date).getTime() < Date.now() && !isDueToday;

  let dueChipState: 'none' | 'scheduled' | 'today' | 'overdue';
  let dueChipLabel: string;
  let showDueIcon = false;

  if (hasValidDue) {
    dueChipState = isDueOverdue ? 'overdue' : isDueToday ? 'today' : 'scheduled';
    dueChipLabel = format(parsedDueDate as Date, 'MMM d');
  } else if (rawDue) {
    dueChipState = 'scheduled';
    dueChipLabel = rawDue;
  } else {
    dueChipState = 'none';
    dueChipLabel = '';
    showDueIcon = true;
  }

  const dueButtonLabel =
    dueChipState === 'none'
      ? 'Choose subtask due date'
      : `Change subtask due date (${dueChipLabel})`;
  const dueButtonClass = cn(
    TASK_META_CHIP_CLASS,
    'justify-center focus-visible:ring-offset-[var(--bg-surface)] transition-colors',
    (dueChipState === 'none' || dueChipState === 'scheduled') &&
      'bg-[color:var(--chip-neutral-bg)] text-[color:var(--text-secondary)] hover:bg-[var(--hover-bg)] border-[color:var(--chip-border)]',
    dueChipState === 'none' && 'px-[var(--space-1_5)]',
  );

  return (
    <ContextMenu key={subtask.id}>
      <ContextMenuTrigger>
        <div
          className="group grid items-center hover:bg-[var(--hover-bg)] motion-safe:transition-colors duration-[var(--duration-fast)]"
          style={SUBTASK_ROW_STYLE}
        >
          <div className="flex items-center justify-center py-[var(--list-row-pad-y)]">
            <button
              type="button"
              onMouseDown={(event) => {
                if (event.button !== 0) return;
                event.preventDefault();
                handleToggleSubtaskCompletion(subtask.id, !subtask.isCompleted);
              }}
              onKeyDown={(event) => {
                if (event.key === ' ' || event.key === 'Enter') {
                  event.preventDefault();
                  handleToggleSubtaskCompletion(subtask.id, !subtask.isCompleted);
                }
              }}
              className="grid place-items-center shrink-0 size-[var(--check-size)] rounded-[var(--radius-full)] border border-[var(--check-ring)] bg-[var(--check-idle-bg)] motion-safe:transition-[background-color,border-color] duration-[var(--duration-base)] hover:border-[var(--check-hover-ring)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2"
              aria-pressed={subtask.isCompleted}
              aria-label={subtask.isCompleted ? 'Mark subtask incomplete' : 'Mark subtask complete'}
            >
              <svg viewBox="0 0 20 20" className="size-[calc(var(--check-size)-4px)]" aria-hidden="true">
                <circle
                  cx="10"
                  cy="10"
                  r="10"
                  className={`motion-safe:transition-opacity duration-[var(--duration-base)] ${subtask.isCompleted ? 'opacity-100 fill-[var(--check-active-bg)]' : 'opacity-0 fill-[var(--check-active-bg)]'}`}
                />
                <path
                  d="M5 10.5l3 3 7-7"
                  fill="none"
                  strokeWidth="2"
                  className={`motion-safe:transition-[stroke,opacity] duration-[var(--duration-base)] ${subtask.isCompleted ? 'stroke-[var(--check-active-check)] opacity-100' : 'stroke-[var(--check-idle-check)] opacity-80'}`}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <div className="py-[var(--list-row-pad-y)] pr-[var(--space-3)]">
            <input
              ref={(element) => {
                if (element) {
                  subtaskInputRefs.current?.set(subtask.id, element);
                } else {
                  subtaskInputRefs.current?.delete(subtask.id);
                }
              }}
              type="text"
              value={subtask.title}
              onChange={(event) => handleSubtaskTitleChange(subtask.id, event.target.value)}
              onBlur={handleSubtaskTitleCommit}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  const inputEl = event.currentTarget as HTMLInputElement;
                  inputEl.blur();
                  requestAnimationFrame(() => {
                    openSubtaskComposer();
                  });
                }
                if (event.key === 'Escape') {
                  event.preventDefault();
                  event.currentTarget.blur();
                }
              }}
              placeholder="Untitled subtask"
              className={cn(
                'w-full border-0 bg-transparent text-[length:var(--list-row-font)] text-[color:var(--text-primary)] focus:outline-none focus:ring-0',
                subtask.isCompleted && 'line-through text-[color:var(--text-tertiary)] opacity-60',
              )}
            />
          </div>
          <div className="flex items-center justify-end py-[var(--list-row-pad-y)]">
            <Popover
              open={activeSubtaskDatePicker === subtask.id}
              onOpenChange={(open: boolean) => setActiveSubtaskDatePicker(open ? subtask.id : null)}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  data-due-state={dueChipState}
                  className={dueButtonClass}
                  aria-label={dueButtonLabel}
                >
                  {showDueIcon ? <Calendar className="size-[var(--icon-sm)]" aria-hidden /> : null}
                  {dueChipLabel ? <span>{dueChipLabel}</span> : null}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={subtask.dueDate ? new Date(subtask.dueDate) : undefined}
                  onSelect={(date) => handleSubtaskDueDateSelection(subtask.id, date)}
                  initialFocus
                />
                {subtask.dueDate ? (
                  <div className="border-t border-[var(--border-subtle)]">
                    <button
                      type="button"
                      className="w-full px-[var(--space-3)] py-[var(--space-2)] text-left text-[length:var(--text-xs)] text-[color:var(--text-tertiary)] hover:text-[color:var(--text-secondary)]"
                      onClick={() => handleClearSubtaskDueDate(subtask.id)}
                    >
                      Clear due date
                    </button>
                  </div>
                ) : null}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="min-w-[220px] z-[100]">
        <ContextMenuItem
          onSelect={() => handleToggleSubtaskCompletion(subtask.id, !subtask.isCompleted)}
        >
          <CheckSquare className="size-4" />
          {subtask.isCompleted ? 'Mark as not completed' : 'Mark completed'}
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => focusSubtaskInput(subtask.id)}>
          <Edit className="size-4" />
          Edit
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => handleDuplicateSubtask(subtask.id)}>
          <Copy className="size-4" />
          Duplicate
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          variant="destructive"
          onSelect={() => handleDeleteSubtask(subtask.id)}
        >
          <Trash className="size-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
