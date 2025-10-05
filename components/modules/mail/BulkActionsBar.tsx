import React from 'react';
import { Archive, Trash, Tag, X } from 'lucide-react';
import { Button } from '../../ui/button';

interface BulkActionsBarProps {
  selectedCount: number;
  onArchive: () => void;
  onDelete: () => void;
  onLabel: () => void;
  onClear: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onArchive,
  onDelete,
  onLabel,
  onClear
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-[var(--space-3)] p-[var(--space-4)] bg-[var(--primary-tint-5)] border-b border-[var(--border-default)]">
      <span className="text-sm text-[var(--text-primary)]">
        {selectedCount} selected
      </span>
      <Button variant="ghost" size="sm" onClick={onArchive}>
        <Archive className="w-4 h-4" />
        Archive
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-[var(--accent-coral)] hover:text-[var(--accent-coral-hover)] hover:bg-[var(--accent-coral-tint-10)]"
        onClick={onDelete}
      >
        <Trash className="w-4 h-4" />
        Delete
      </Button>
      <Button variant="ghost" size="sm" onClick={onLabel}>
        <Tag className="w-4 h-4" />
        Label
      </Button>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={onClear}
      >
        <X className="w-4 h-4" />
        Clear
      </Button>
    </div>
  );
}