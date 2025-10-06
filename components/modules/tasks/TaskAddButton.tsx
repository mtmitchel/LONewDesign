import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../ui/button';

interface TaskAddButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}

export function TaskAddButton({ onClick, disabled, label = 'Add task' }: TaskAddButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-full justify-start gap-[var(--space-2)] h-8 px-[var(--space-3)] border border-dashed border-[var(--border-subtle)] hover:border-[var(--primary)] hover:bg-[var(--primary-tint-5)] text-[var(--text-secondary)] hover:text-[var(--primary)] motion-safe:transition-all duration-[var(--duration-fast)] rounded-[var(--radius-md)]"
    >
      <Plus className="h-4 w-4" aria-hidden="true" />
      {label}
    </Button>
  );
}
