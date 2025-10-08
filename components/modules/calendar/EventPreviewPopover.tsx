import * as React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../ui/alert-dialog';
import { Button } from '../../ui/button';
import { cn } from '../../ui/utils';

type PreviewEvent = {
  id: string;
  title: string;
  calendarName: string;
  allDay?: boolean;
  timeRangeText?: string;
};

type EventPreviewPopoverProps = {
  event: PreviewEvent;
  children: React.ReactElement;
  onEdit: (event: PreviewEvent) => void;
  onConfirmDelete: (event: PreviewEvent) => Promise<void> | void;
};

export function EventPreviewPopover({ event, children, onEdit, onConfirmDelete }: EventPreviewPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const closeReasonRef = React.useRef<'idle' | 'confirm'>('idle');

  const assignTriggerRef = React.useCallback(
    (node: HTMLElement | null) => {
      triggerRef.current = node;
      const childRef = (children as any).ref;
      if (typeof childRef === 'function') {
        childRef(node);
      } else if (childRef && typeof childRef === 'object') {
        (childRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    },
    [children]
  );

  const restoreFocus = React.useCallback(() => {
    requestAnimationFrame(() => {
      triggerRef.current?.focus({ preventScroll: true });
    });
  }, []);

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next) {
        console.log('calendar.event_preview_opened', event.id);
      } else {
        restoreFocus();
      }
    },
    [event.id, restoreFocus]
  );

  const meta = React.useMemo(() => {
    if (event.allDay) {
      return `All day • ${event.calendarName}`;
    }
    if (event.timeRangeText) {
      return `${event.timeRangeText} • ${event.calendarName}`;
    }
    return event.calendarName;
  }, [event.allDay, event.calendarName, event.timeRangeText]);

  const child = React.Children.only(children);
  const clonedTrigger = React.cloneElement(child, {
    ref: assignTriggerRef,
    onClick: (e: React.MouseEvent) => {
      child.props.onClick?.(e);
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      child.props.onKeyDown?.(e);
    },
  });

  async function confirmDelete() {
    try {
      setPendingDelete(true);
      closeReasonRef.current = 'confirm';
      await onConfirmDelete(event);
      console.log('calendar.event_delete_confirmed', event.id);
    } finally {
      setPendingDelete(false);
      setConfirmOpen(false);
      setOpen(false);
      restoreFocus();
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>{clonedTrigger}</PopoverTrigger>
        <PopoverContent
          side="right"
          align="start"
          sideOffset={12}
          role="dialog"
          aria-modal="false"
          aria-labelledby={`event-popover-title-${event.id}`}
          className={cn(
            'bg-[var(--bg-surface-raised)]',
            'border border-[var(--border-emphasis)] ring-1 ring-inset ring-[var(--border-hairline)]',
            'shadow-[var(--elevation-lg)] rounded-[var(--radius-lg)]',
            'w-[min(360px,92vw)] p-[var(--space-4)]',
            'motion-safe:transition motion-safe:duration-[var(--duration-base)] motion-safe:ease-[var(--easing-standard)]',
            'motion-safe:data-[state=open]:animate-[popover-in_var(--duration-base)_var(--easing-standard)_forwards]',
          )}
        >
          <div className="flex items-start justify-between gap-[var(--space-3)]">
            <div className="min-w-0">
              <div className="text-sm text-[color:var(--text-tertiary)] mb-[var(--space-2)]">Events</div>
              <h3
                id={`event-popover-title-${event.id}`}
                className="text-[color:var(--text-primary)] font-medium truncate"
                title={event.title}
              >
                {event.title}
              </h3>
              <div className="text-[color:var(--text-secondary)] mt-[var(--space-1)] text-sm">
                {meta}
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-[var(--space-2)]">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setOpen(false);
                  restoreFocus();
                  console.log('calendar.event_edit_clicked', event.id);
                  onEdit(event);
                }}
                title="Edit"
                aria-label="Edit"
                aria-keyshortcuts="E"
                className="h-9 w-9 rounded-[var(--radius-sm)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                <Pencil style={{ width: 'var(--icon-size-md)', height: 'var(--icon-size-md)' }} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setConfirmOpen(true);
                  closeReasonRef.current = 'idle';
                  console.log('calendar.event_delete_prompted', event.id);
                }}
                title="Delete"
                aria-label="Delete"
                aria-keyshortcuts="Delete"
                className="h-9 w-9 rounded-[var(--radius-sm)] text-[color:var(--text-secondary)] hover:text-[color:var(--destructive)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                <Trash2 style={{ width: 'var(--icon-size-md)', height: 'var(--icon-size-md)' }} />
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(next) => {
          setConfirmOpen(next);
          if (!next) {
            if (closeReasonRef.current !== 'confirm') {
              console.log('calendar.event_delete_cancelled', event.id);
            }
            closeReasonRef.current = 'idle';
            setOpen(false);
            restoreFocus();
          }
        }}
      >
        <AlertDialogContent
          className={cn(
            'bg-[var(--bg-surface)] border border-[var(--border-subtle)]',
            'shadow-[var(--elevation-lg)] rounded-[var(--radius-lg)]',
            'motion-safe:transition-[opacity,transform] motion-safe:duration-[var(--duration-base)] motion-safe:ease-[var(--easing-standard)]',
          )}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event?</AlertDialogTitle>
            <AlertDialogDescription className="text-[color:var(--text-secondary)]">
              This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-[var(--radius-sm)]"
              onClick={() => {
                closeReasonRef.current = 'idle';
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={pendingDelete}
              className="rounded-[var(--radius-sm)] bg-[var(--destructive)] text-[color:var(--destructive-foreground)] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:opacity-60 disabled:pointer-events-none"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
