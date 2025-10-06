import React from 'react';
import { Button } from '../../ui/button';
import { Plus } from 'lucide-react';

interface TaskAddButtonProps {
  onClick: () => void;
}

export function TaskAddButton({ onClick }: TaskAddButtonProps) {
  return (
    <Button 
      variant="ghost"
      className="w-full justify-start items-center gap-2 h-8 px-2 border border-dashed border-[var(--border-subtle)] hover:border-[var(--primary)] hover:bg-[var(--primary-tint-5)] text-[var(--text-secondary)] hover:text-[var(--primary)] mb-3"
      onClick={onClick}
    >
      <Plus className="w-4 h-4" />
      <span className="text-sm font-medium">Add task</span>
    </Button>
  );
}