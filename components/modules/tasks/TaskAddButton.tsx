import React from 'react';
import { Button } from '../../ui/button';
import { Plus } from 'lucide-react';

interface TaskAddButtonProps {
  onClick: () => void;
}

export function TaskAddButton({ onClick }: TaskAddButtonProps) {
  return (
    <Button 
      className="w-full inline-flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-md)] text-[length:var(--text-sm)] font-[var(--font-weight-medium)] bg-[var(--btn-ghost-bg)] text-[var(--btn-ghost-text)] border border-[var(--btn-ghost-border)] hover:bg-[var(--btn-ghost-hover)] motion-safe:transition-colors duration-[var(--duration-fast)] mb-3"
      onClick={onClick}
    >
      <Plus className="w-4 h-4" />
      <span className="text-sm font-medium">Add task</span>
    </Button>
  );
}