import React from 'react';
import { Plus } from 'lucide-react';

interface TaskAddButtonProps {
  onClick: () => void;
  className?: string;
}

export function TaskAddButton({ onClick, className }: TaskAddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-keyshortcuts="A"
      title="Add task"
      className={[
        "inline-flex w-full items-center gap-[var(--space-2)]",
        "rounded-[var(--radius-sm)] px-[var(--space-3)] py-[var(--space-2)]",
        "text-[length:var(--text-sm)] font-[var(--font-weight-medium)] text-[color:var(--text-tertiary)]",
        "hover:text-[color:var(--text-primary)] hover:bg-[color-mix(in_oklab,var(--bg-surface)_35%,transparent)]",
        "motion-safe:transition-colors duration-[var(--duration-fast)]",
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Plus className="w-4 h-4" />
      <span>Add task</span>
    </button>
  );
}