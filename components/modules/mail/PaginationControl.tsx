import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../ui/utils';

export interface PaginationControlProps {
  currentStart: number;
  currentEnd: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  className?: string;
}

export function PaginationControl({
  currentStart,
  currentEnd,
  total,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  className
}: PaginationControlProps) {
  return (
    <div
      role="navigation"
      aria-label="Pagination"
      className={cn(
  'flex items-center gap-3',
  'text-[length:var(--text-sm)] text-[color:var(--text-secondary)]',
        className
      )}
    >
      <span className="font-[var(--font-weight-normal)]">
        {currentStart}–{currentEnd} of {total}
      </span>

      <PaginationButton
        icon={ChevronLeft}
        label="Previous page"
        onClick={onPrevious}
        disabled={!hasPrevious}
      />

      <PaginationButton
        icon={ChevronRight}
        label="Next page"
        onClick={onNext}
        disabled={!hasNext}
      />
    </div>
  );
}

interface PaginationButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function PaginationButton({ icon: Icon, label, onClick, disabled }: PaginationButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-disabled={disabled}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2',
        disabled
          ? 'cursor-not-allowed text-[color:var(--text-tertiary)] opacity-40'
          : 'text-[color:var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[color:var(--text-primary)]'
      )}
    >
      <Icon className="h-[var(--mail-pagination-arrow-size)] w-[var(--mail-pagination-arrow-size)]" />
    </button>
  );
}
