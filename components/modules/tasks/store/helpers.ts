import type { Task, TaskList } from '../types';
import { DEFAULT_TASK_LISTS } from '../constants';
import {
  normalizePriority as normalizeMetadataPriority,
  normalizeLabels as normalizeMetadataLabels,
  normalizeDueDate as normalizeMetadataDueDate,
  type TaskMetadata as SharedTaskMetadata,
} from '../../../../lib/metadata';

type SubtaskItem = NonNullable<Task['subtasks']>[number];

export const DEFAULT_LABEL_COLOR = 'var(--label-blue)';

export function createId(prefix = 'task') {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function hydrateDefaultLists(): { listsById: Record<string, TaskList>; listOrder: string[] } {
  const listsById: Record<string, TaskList> = {};
  const listOrder: string[] = [];
  DEFAULT_TASK_LISTS.forEach((list) => {
    listsById[list.id] = list;
    listOrder.push(list.id);
  });
  return { listsById, listOrder };
}

export function deserializeLabels(raw: unknown): Task['labels'] {
  if (raw == null) return [];
  let current: unknown = raw;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (typeof current === 'string') {
      try {
        current = JSON.parse(current);
        continue;
      } catch {
        break;
      }
    }
    break;
  }

  if (!Array.isArray(current)) return [];

  const entries = current as Task['labels'];

  return entries
    .map((label) => {
      if (typeof label === 'string') {
        const name = label.trim();
        return name ? { name, color: DEFAULT_LABEL_COLOR } : null;
      }
      if (label && typeof label === 'object' && 'name' in label) {
        const rawName = (label as { name?: string }).name;
        const nameValue = typeof rawName === 'string' ? rawName.trim() : '';
        if (!nameValue) return null;
        const rawColor = (label as { color?: string }).color;
        const colorValue = typeof rawColor === 'string' && rawColor.trim().length > 0
          ? rawColor
          : DEFAULT_LABEL_COLOR;
        return { name: nameValue, color: colorValue };
      }
      return null;
    })
    .filter((entry): entry is { name: string; color: string } => entry !== null);
}

export function buildLabelColorMapFromLabels(labels: Task['labels'] | undefined) {
  const map = new Map<string, string>();
  if (!labels) {
    return map;
  }

  labels.forEach((label) => {
    if (typeof label === 'string') {
      const name = label.trim();
      if (name) {
        map.set(name.toLowerCase(), DEFAULT_LABEL_COLOR);
      }
      return;
    }

    if (label && typeof label.name === 'string') {
      const normalizedName = label.name.trim().toLowerCase();
      if (!normalizedName) {
        return;
      }
      const color = typeof label.color === 'string' && label.color.trim().length > 0
        ? label.color
        : DEFAULT_LABEL_COLOR;
      map.set(normalizedName, color);
    }
  });

  return map;
}

export function deserializeSubtasks(raw: unknown): Task['subtasks'] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((value, index) => {
      if (!value || typeof value !== 'object') {
        return null;
      }

      const idValue = (() => {
        const maybeId = (value as { id?: unknown }).id;
        if (typeof maybeId === 'string' && maybeId.trim().length > 0) {
          return maybeId;
        }
        return createId('subtask');
      })();

      const titleValue = (() => {
        const maybeTitle = (value as { title?: unknown }).title;
        if (typeof maybeTitle === 'string') {
          const trimmed = maybeTitle.trim();
          return trimmed || null;
        }
        return null;
      })();

      if (!titleValue) {
        return null;
      }

      const completedValue = (() => {
        const maybeCompleted = (value as { is_completed?: unknown; isCompleted?: unknown }).is_completed ?? (value as { isCompleted?: unknown }).isCompleted;
        return Boolean(maybeCompleted);
      })();

      const dueDateValue = (() => {
        const maybeDue = (value as { due_date?: unknown; dueDate?: unknown }).due_date ?? (value as { dueDate?: unknown }).dueDate;
        return typeof maybeDue === 'string' ? maybeDue : undefined;
      })();

      const positionValue = (() => {
        const maybePosition = (value as { position?: unknown }).position;
        if (typeof maybePosition === 'number' && Number.isFinite(maybePosition)) {
          return maybePosition;
        }
        return index;
      })();

      const googleIdValue = (() => {
        const maybeGoogleId = (value as { google_id?: unknown; googleId?: unknown }).google_id
          ?? (value as { googleId?: unknown }).googleId;
        if (typeof maybeGoogleId === 'string' && maybeGoogleId.trim().length > 0) {
          return maybeGoogleId;
        }
        return undefined;
      })();

      const parentGoogleIdValue = (() => {
        const maybeParentGoogleId = (value as { parent_google_id?: unknown; parentGoogleId?: unknown }).parent_google_id
          ?? (value as { parentGoogleId?: unknown }).parentGoogleId;
        if (typeof maybeParentGoogleId === 'string' && maybeParentGoogleId.trim().length > 0) {
          return maybeParentGoogleId;
        }
        return undefined;
      })();

      return {
        id: idValue,
        googleId: googleIdValue,
        parentGoogleId: parentGoogleIdValue,
        title: titleValue,
        isCompleted: completedValue,
        dueDate: dueDateValue,
        position: positionValue,
      } as SubtaskItem;
    })
    .filter((entry): entry is SubtaskItem => entry !== null);
}

export function serializeSubtasksForBackend(subtasks: Task['subtasks'] | undefined) {
  if (!Array.isArray(subtasks)) {
    return [];
  }

  return subtasks
    .map((subtask, index) => {
      const title = (subtask.title || '').trim();
      if (!title) {
        return null;
      }

      const payload: Record<string, unknown> = {
        title,
        is_completed: Boolean(subtask.isCompleted),
        position: typeof subtask.position === 'number' ? subtask.position : index,
      };

      if (subtask.id) {
        payload.id = subtask.id;
      }

      if (subtask.googleId) {
        payload.google_id = subtask.googleId;
      }

      if (subtask.parentGoogleId) {
        payload.parent_google_id = subtask.parentGoogleId;
      }

      if (subtask.dueDate) {
        payload.due_date = subtask.dueDate;
      }

      return payload;
    })
    .filter((entry): entry is Record<string, unknown> => entry !== null);
}

// Normalize metadata before pushing through the Tauri create command.
export function buildMetadataPayload(input: {
  title: string;
  priority?: Task['priority'];
  labels?: Task['labels'];
  dueDate?: string | null;
  isCompleted?: boolean;
  status?: string;
  notes?: string | null;
  description?: string | null;
  time_block?: null;
}, title: string): SharedTaskMetadata {
  const normalizedLabels = normalizeMetadataLabels(
    (input.labels ?? []).map((label) => {
      if (typeof label === 'string') {
        return { name: label.trim(), color: DEFAULT_LABEL_COLOR };
      }
      const name = typeof label.name === 'string' ? label.name.trim() : '';
      const color = typeof label.color === 'string' ? label.color : DEFAULT_LABEL_COLOR;
      return { name, color };
    }),
  );

  const status = input.isCompleted === true || input.status === 'completed'
    ? 'completed'
    : 'needsAction';
  const rawNotes = input.notes ?? input.description ?? null;
  const normalizedNotes =
    typeof rawNotes === 'string' ? rawNotes.trim() : '';

  return {
    title,
    priority: normalizeMetadataPriority(input.priority ?? 'none'),
    labels: normalizedLabels,
    due_date: normalizeMetadataDueDate(input.dueDate ?? null),
    status,
    notes: normalizedNotes,
    time_block: null,
  };
}