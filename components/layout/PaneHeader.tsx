import * as React from 'react';
import { cn } from '../ui/utils';

type PaneHeaderProps = React.HTMLAttributes<HTMLDivElement> & {
  label?: string;
  tabs?: React.ReactNode;
  actions?: React.ReactNode;
};

export function PaneHeader({
  label,
  tabs,
  actions,
  children,
  className,
  role = 'toolbar',
  ...props
}: PaneHeaderProps) {
  const hasStructuredContent = Boolean(label || tabs || actions);

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
    >
      {hasStructuredContent ? (
        <>
          <div className="min-w-0 flex flex-1 items-center gap-[var(--space-3)] truncate">
            {label ? <span className="text-sm text-[var(--text-secondary)] truncate">{label}</span> : null}
            {tabs}
          </div>
          {actions ? <div className="flex items-center gap-[var(--space-2)]">{actions}</div> : null}
          {children}
        </>
      ) : (
        children
      )}
    </div>
  );
}
