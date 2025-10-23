
import * as React from 'react';
import { Plus, Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../../../../ui/popover';
import { Button } from '../../../../ui/button';
import { Calendar as CalendarComponent } from '../../../../ui/calendar';
import { cn } from '../../../../ui/utils';
import { format } from 'date-fns';

interface SubtaskComposerProps {
  isSubtaskComposerOpen: boolean;
  newSubtaskTitle: string;
  setNewSubtaskTitle: (title: string) => void;
  newSubtaskDueDate: string | undefined;
  setNewSubtaskDueDate: (date: string | undefined) => void;
  newSubtaskDateOpen: boolean;
  setNewSubtaskDateOpen: (open: boolean) => void;
  newSubtaskInputRef: React.RefObject<HTMLInputElement>;
  handleAddSubtask: () => void;
  handleCancelNewSubtask: () => void;
  handleNewSubtaskDateSelection: (date: Date | undefined) => void;
  openSubtaskComposer: () => void;
}

export function SubtaskComposer(props: SubtaskComposerProps) {
  const newSubtaskSelectedDate = props.newSubtaskDueDate ? new Date(props.newSubtaskDueDate) : undefined;

  if (props.isSubtaskComposerOpen) {
    return (
      <div className="border-t border-[var(--border-divider)]">
        <div className="flex flex-col gap-[var(--space-2)] px-[var(--list-row-pad-x)] py-[var(--space-3)]">
          <div className="flex items-center gap-[var(--space-2)]">
            <div
              className="grid size-[var(--check-size)] place-items-center rounded-[var(--radius-full)] border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
              aria-hidden
            />
            <input
              ref={props.newSubtaskInputRef}
              type="text"
              value={props.newSubtaskTitle}
              onChange={(event) => props.setNewSubtaskTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  props.handleAddSubtask();
                } else if (event.key === 'Escape') {
                  event.preventDefault();
                  props.handleCancelNewSubtask();
                }
              }}
              placeholder="Write a task name"
              className="flex-1 border-0 bg-transparent text-[length:var(--text-sm)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)] focus:outline-none"
              aria-label="New subtask name"
              onContextMenu={(event) => event.preventDefault()}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-[var(--space-2)]">
            <div className="flex items-center gap-[var(--space-2)]">
              <Popover open={props.newSubtaskDateOpen} onOpenChange={props.setNewSubtaskDateOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'grid size-8 place-items-center rounded-[var(--radius-sm)] transition-colors',
                      props.newSubtaskDueDate
                        ? 'bg-[var(--bg-surface-elevated)] text-[color:var(--text-primary)]'
                        : 'text-[color:var(--text-tertiary)] hover:bg-[var(--hover-bg)] hover:text-[color:var(--text-secondary)]',
                    )}
                    aria-label={
                      props.newSubtaskDueDate
                        ? `Change due date (${props.newSubtaskDueDate})`
                        : 'Choose subtask due date'
                    }
                    onContextMenu={(event) => event.preventDefault()}
                  >
                    <Calendar className="size-4" aria-hidden />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={newSubtaskSelectedDate}
                    onSelect={props.handleNewSubtaskDateSelection}
                    initialFocus
                  />
                  {props.newSubtaskDueDate ? (
                    <div className="border-t border-[var(--border-subtle)]">
                      <button
                        type="button"
                        className="w-full px-[var(--space-3)] py-[var(--space-2)] text-left text-[length:var(--text-xs)] text-[color:var(--text-tertiary)] hover:text-[color:var(--text-secondary)]"
                        onClick={() => {
                          props.setNewSubtaskDueDate(undefined);
                          props.setNewSubtaskDateOpen(false);
                        }}
                      >
                        Clear due date
                      </button>
                    </div>
                  ) : null}
                </PopoverContent>
              </Popover>
              {props.newSubtaskDueDate ? (
                <span className="inline-flex items-center gap-[var(--space-1)] rounded-[var(--radius-sm)] bg-[var(--bg-surface-elevated)] px-[var(--space-2)] py-[var(--space-1_5)] text-[length:var(--text-xs)] text-[color:var(--text-secondary)]">
                  <Calendar className="size-3" aria-hidden />
                  {format(newSubtaskSelectedDate ?? new Date(props.newSubtaskDueDate), 'MMM d')}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-[var(--space-2)]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={props.handleCancelNewSubtask}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={props.handleAddSubtask}
                disabled={!props.newSubtaskTitle.trim()}
              >
                Add subtask
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-[var(--border-divider)]">
      <button
        type="button"
        className="flex w-full items-center gap-[var(--space-2)] px-[var(--list-row-pad-x)] py-[var(--space-3)] text-left text-[length:var(--text-sm)] text-[color:var(--text-tertiary)] hover:bg-[var(--hover-bg)] hover:text-[color:var(--text-primary)]"
        onClick={props.openSubtaskComposer}
      >
        <Plus className="size-4" aria-hidden />
        Add subtask...
      </button>
    </div>
  );
}
