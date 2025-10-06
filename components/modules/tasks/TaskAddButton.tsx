import React from 'react';
import { Plus } from 'lucide-react';

interface TaskAddButtonProps {
  onClick: () => void;
}

export function TaskAddButton({ onClick }: TaskAddButtonProps) {
  return (
    <button 
      className="w-full inline-flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] motion-safe:transition-colors duration-[var(--duration-fast)]"
      onClick={onClick}
    >
      <Plus className="w-4 h-4" />
      <span>Add task</span>
    </button>
  );
}