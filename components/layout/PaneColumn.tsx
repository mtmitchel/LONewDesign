import * as React from 'react';
import { cn } from '../ui/utils';

type PaneColumnProps = React.HTMLAttributes<HTMLElement> & {
  showRightDivider?: boolean;
  showLeftDivider?: boolean;
};

export function PaneColumn({
  className,
  children,
  showRightDivider = true,
  showLeftDivider = false,
  ...rest
}: PaneColumnProps) {
  return (
    <section
      {...rest}
      className={cn('relative flex min-h-0 min-w-0 flex-col bg-[var(--bg-surface)]', className)}
      data-pane-column=""
    >
      {children}
      {showLeftDivider && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[var(--pane-divider-w)] bg-[var(--pane-divider-color)]"
        />
      )}
      {showRightDivider && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-[var(--pane-divider-w)] bg-[var(--pane-divider-color)]"
        />
      )}
    </section>
  );
}
