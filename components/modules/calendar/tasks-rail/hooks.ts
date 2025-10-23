import { useMemo } from 'react';
import { startOfDay, endOfWeek, isSameDay, isAfter, isBefore } from 'date-fns';
import type { Task } from '../../tasks/types';
import { parseDueDate } from '../utils';
import type { TaskFilterKey } from '../types';

type SortMode = 'date-created' | 'due-date' | 'title' | 'priority';

export function useFilteredTasks(
  tasks: Task[],
  filter: TaskFilterKey,
  sortBy: SortMode
) {
  const now = useMemo(() => startOfDay(new Date()), []);
  const weekEnd = useMemo(() => endOfWeek(now, { weekStartsOn: 0 }), [now]);

  return useMemo(() => {
    const filtered = tasks.filter((task) => {
      // Handle list-based filtering
      if (filter.startsWith('list:')) {
        const listId = filter.replace('list:', '');
        return task.listId === listId;
      }
      
      if (filter === 'completed') {
        return task.isCompleted;
      }

      if (filter === 'today' || filter === 'this-week') {
        const due = parseDueDate(task.dueDate);
        if (!due) return false;
        if (filter === 'today') {
          return isSameDay(due, now);
        }
        return isAfter(due, now) && isBefore(due, weekEnd);
      }

      return true;
    });
    
    // Apply sorting: completed tasks always sink to bottom
    return filtered.sort((a, b) => {
      // 1) Bucket by completion status: incomplete first, completed last
      const bucketA = a.isCompleted ? 1 : 0;
      const bucketB = b.isCompleted ? 1 : 0;
      if (bucketA !== bucketB) return bucketA - bucketB;

      // 2) Within each bucket, apply the selected sort mode
      let inner = 0;
      switch (sortBy) {
        case 'due-date': {
          const dateA = parseDueDate(a.dueDate);
          const dateB = parseDueDate(b.dueDate);
          if (!dateA && !dateB) inner = 0;
          else if (!dateA) inner = 1;
          else if (!dateB) inner = -1;
          else inner = dateA.getTime() - dateB.getTime();
          break;
        }
        case 'title':
          inner = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
          break;
        case 'priority': {
          const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 };
          const orderA = priorityOrder[a.priority] ?? 3;
          const orderB = priorityOrder[b.priority] ?? 3;
          inner = orderA - orderB;
          break;
        }
        case 'date-created':
        default: {
          const dateA = new Date(a.createdAt || a.dateCreated || 0);
          const dateB = new Date(b.createdAt || b.dateCreated || 0);
          inner = dateB.getTime() - dateA.getTime(); // Newest first
          break;
        }
      }
      if (inner !== 0) return inner;

      // 3) Stable tie-breaker by ID
      return a.id.localeCompare(b.id);
    });
  }, [tasks, filter, sortBy, now, weekEnd]);
}
