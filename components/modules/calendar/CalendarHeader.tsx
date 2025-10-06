import { useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '../../ui/button';
import { ToggleGroup, ToggleGroupItem } from '../../ui/toggle-group';
import type { CalendarView } from './types';
import { formatRangeLabel } from './useCalendarEngine';

const VIEWS: CalendarView[] = ['month', 'week', 'day'];
const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA']);

export type CalendarHeaderProps = {
  view: CalendarView;
  date: Date;
  onViewChange: (view: CalendarView) => void;
  onNavigate: (direction: 'prev' | 'next', granularity?: 'day' | 'week' | 'month') => void;
  onToday: () => void;
  onNew: () => void;
};

export function CalendarHeader({ view, date, onViewChange, onNavigate, onToday, onNew }: CalendarHeaderProps) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (INPUT_TAGS.has(target.tagName) || target.isContentEditable)) {
        return;
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        const direction = event.key === 'ArrowRight' ? 'next' : 'prev';
        const granularity = event.shiftKey ? 'week' : view === 'day' ? 'day' : view === 'week' ? 'week' : 'month';
        onNavigate(direction, granularity);
      }

      if (event.key.toLowerCase() === 't') {
        onToday();
      }

      if (event.key.toLowerCase() === 'n') {
        onNew();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [view, onNavigate, onToday, onNew]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-[var(--space-6)] py-[var(--space-4)]">
      <div className="flex items-center gap-[var(--space-3)]">
        <CalendarIcon className="text-[var(--text-primary)]" size={20} aria-hidden="true" />
  <h1 className="text-[length:var(--text-2xl)] font-[var(--font-weight-semibold)] text-[color:var(--text-primary)]">Calendar</h1>
      </div>

      <div className="flex items-center gap-[var(--space-3)]">
        <div className="flex items-center gap-[var(--space-2)]">
          <Button variant="ghost" size="icon" onClick={() => onNavigate('prev')} title="Previous">
            <ChevronLeft size={18} />
          </Button>
          <div className="min-w-[180px] text-center text-[length:var(--text-lg)] font-[var(--font-weight-semibold)] text-[color:var(--text-primary)]">
            {formatRangeLabel(view, date)}
          </div>
          <Button variant="ghost" size="icon" onClick={() => onNavigate('next')} title="Next">
            <ChevronRight size={18} />
          </Button>
          <Button variant="outline" onClick={onToday} title="Jump to today">
            Today
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-[var(--space-3)]">
        <ToggleGroup type="single" value={view} onValueChange={(value) => value && onViewChange(value as CalendarView)} aria-label="Select calendar view">
          {VIEWS.map((option) => (
            <ToggleGroupItem key={option} value={option} className="capitalize">
              {option}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Button className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]" onClick={onNew} title="New event" aria-keyshortcuts="N">
          <Plus size={16} className="mr-2" />
          New event
        </Button>
      </div>
    </div>
  );
}
