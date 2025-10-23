import React from 'react';
import { Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '../../ui/utils';

export type DueState = 'none' | 'scheduled' | 'today' | 'overdue';

export interface DueMeta {
  label: string;
  state: DueState;
}

export const DUE_PILL_BASE_CLASS =
  'inline-flex items-center gap-[var(--space-1)] h-[var(--chip-height)] rounded-[var(--radius-md)] px-[var(--space-2)] text-[length:var(--text-sm)] font-medium transition-colors shadow-[inset_0_0_0_1px_var(--border-subtle)]';

export const DUE_TONE_CLASSES: Record<DueState, string> = {
  none: 'bg-transparent text-[color:var(--text-tertiary)]',
  scheduled: 'bg-[color:var(--chip-neutral-bg)] text-[color:var(--text-secondary)]',
  today:
    'bg-[color-mix(in_oklab,var(--due-today)_12%,transparent)] text-[color:color-mix(in_oklab,var(--due-today)_60%,var(--text-secondary))] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--due-today)_35%,transparent)]',
  overdue:
    'bg-[color-mix(in_oklab,var(--due-overdue)_12%,transparent)] text-[color:color-mix(in_oklab,var(--due-overdue)_60%,var(--text-secondary))] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--due-overdue)_35%,transparent)]',
};

export const getDueMeta = (dueDate?: string | null): DueMeta => {
  const trimmed = dueDate?.trim();
  if (!trimmed) {
    return { label: '', state: 'none' };
  }

  let parsed: Date | null = null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    parsed = parseISO(trimmed);
  } else {
    const candidate = new Date(trimmed);
    parsed = Number.isNaN(candidate.getTime()) ? null : candidate;
  }

  if (!parsed || Number.isNaN(parsed.getTime())) {
    return {
      label: trimmed,
      state: 'scheduled',
    };
  }

  const label = format(parsed, 'MMM d');
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const parsedKey = format(parsed, 'yyyy-MM-dd');
  const isToday = parsedKey === todayKey;
  const isOverdue = parsed.getTime() < Date.now() && !isToday;

  return {
    label,
    state: isOverdue ? 'overdue' : isToday ? 'today' : 'scheduled',
  };
};

interface DueDateChipProps {
  dueDate?: string | null;
  meta?: DueMeta;
  className?: string;
}

export const DueDateChip: React.FC<DueDateChipProps> = ({ dueDate, meta: providedMeta, className }) => {
  const meta = providedMeta ?? getDueMeta(dueDate ?? undefined);
  if (!meta.label) {
    return null;
  }

  return (
    <span data-due-state={meta.state} className={cn(DUE_PILL_BASE_CLASS, DUE_TONE_CLASSES[meta.state], className)}>
      <Calendar className="h-[var(--icon-sm)] w-[var(--icon-sm)]" strokeWidth={1.25} aria-hidden />
      <span>{meta.label}</span>
    </span>
  );
};
