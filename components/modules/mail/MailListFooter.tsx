import React from 'react';
import { Button } from '../../ui/button';
import { PaneFooter } from '../../dev/PaneCaret';

interface MailListFooterProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  rangeStart: number;
  rangeEnd: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export function MailListFooter({
  currentPage,
  totalPages,
  totalCount: _totalCount,
  rangeStart: _rangeStart,
  rangeEnd: _rangeEnd,
  hasPreviousPage,
  hasNextPage,
  onPreviousPage,
  onNextPage,
}: MailListFooterProps) {
  const clampedTotalPages = Math.max(totalPages, 1);
  const clampedCurrentPage = Math.min(Math.max(currentPage, 1), clampedTotalPages);

  return (
    <PaneFooter className="sticky bottom-0 z-10 w-full justify-between gap-[var(--space-3)] px-[var(--space-4)]">
      <Button
        variant="outline"
        size="sm"
        onClick={onPreviousPage}
        disabled={!hasPreviousPage}
        aria-label="Previous page"
        className="shrink-0"
      >
        Previous
      </Button>

  <span className="flex-1 text-center text-[length:var(--text-sm)] font-[var(--font-weight-medium)] text-[color:var(--text-secondary)]">
        Page {clampedCurrentPage} of {clampedTotalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={onNextPage}
        disabled={!hasNextPage}
        aria-label="Next page"
        className="shrink-0"
      >
        Next
      </Button>
    </PaneFooter>
  );
}
