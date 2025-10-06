import * as React from 'react';
import { cn } from '../ui/utils';

type PaneHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export function PaneHeader({ className, role = 'toolbar', ...props }: PaneHeaderProps) {
  return (
    <div
      role={role}
      className={cn(
        'relative flex h-[var(--pane-header-h)] items-center gap-[var(--space-3)]',
        'border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-[var(--pane-header-px)]',
        'flex-shrink-0',
        className
      )}
      data-pane-header=""
      {...props}
    />
  );
}
