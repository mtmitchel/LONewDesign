import * as React from 'react';

export function CollapsedBar({
  side,
  onOpen,
  ariaLabel,
  ariaKeyShortcuts,
}: {
  side: 'left' | 'right';
  onOpen: () => void;
  ariaLabel: string;
  ariaKeyShortcuts?: string;
}) {
  const caret = side === 'left' ? '›' : '‹';
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen();
    }
  };
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-keyshortcuts={ariaKeyShortcuts}
      onKeyDown={handleKey}
      onClick={onOpen}
      className="group h-full w-2 flex items-center justify-center select-none cursor-pointer bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] border-l border-r focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
      title={ariaLabel}
    >
  <span className="text-[color:var(--text-secondary)] group-hover:text-[color:var(--text-primary)]">{caret}</span>
    </div>
  );
}
