// #region Utility functions
import { format, parseISO, isValid } from 'date-fns';

export function parseDueDate(value?: string) {
  if (!value) return undefined;
  const parsed = parseISO(value);
  if (isValid(parsed)) return parsed;
  const fallback = new Date(value);
  return isValid(fallback) ? fallback : undefined;
}

export function formatHumanDate(date: Date) {
  return format(date, 'EEE, MMM d');
}

export function emitAnalytics(event: string, payload?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('task:instrument', { detail: { event, payload } }));
  }
  if (process.env.NODE_ENV !== 'production') {
    console.debug(`[task-rail] ${event}`, payload ?? {});
  }
}
// #endregion Utility functions