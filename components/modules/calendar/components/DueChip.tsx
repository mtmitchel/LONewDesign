import { CalendarDays } from 'lucide-react';
import { cn } from '../../../ui/utils';
import { parseDueDate } from '../utils';
import type { DueState } from '../types';

function computeDueState(dueDate: Date, isCompleted: boolean): { text: string; tone: DueState } {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  if (isCompleted) {
    return { text: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), tone: 'default' };
  }

  if (due.getTime() === now.getTime()) {
    return { text: 'Today', tone: 'today' };
  }

  if (due < now) {
    return { text: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), tone: 'overdue' };
  }

  return { text: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), tone: 'default' };
}

interface DueChipProps {
  isoDate: string;
  isCompleted: boolean;
}

export function DueChip({ isoDate, isCompleted }: DueChipProps) {
  const date = parseDueDate(isoDate);
  if (!date) return null;

  const { text, tone } = computeDueState(date, isCompleted);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs leading-tight',
        tone === 'overdue' && 'text-red-600',
        tone === 'today' && 'text-blue-600',
        tone === 'default' && 'text-gray-600'
      )}
      title={date.toDateString()}
    >
      <CalendarDays className="h-3 w-3" aria-hidden="true" />
      {text}
    </span>
  );
}