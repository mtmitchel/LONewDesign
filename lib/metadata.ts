/**
 * Shared metadata normalization and hash calculation for task metadata
 * This module ensures consistent metadata handling between frontend and backend
 */

export type Priority = 'high' | 'medium' | 'low' | 'none';

export interface Label {
  name: string;
  color: string;
}

export interface TaskMetadata {
  title: string;
  priority: Priority;
  labels: Label[];
  due_date: string | null; // YYYY-MM-DD format
  status: 'needsAction' | 'completed';
  notes: string | null;
  time_block: string | null;
}

/**
 * Normalize priority - validate and provide fallback
 */
export function normalizePriority(priority: unknown): Priority {
  const validPriorities: Priority[] = ['high', 'medium', 'low', 'none'];
  
  if (typeof priority === 'string' && validPriorities.includes(priority as Priority)) {
    return priority as Priority;
  }
  
  return 'none';
}

/**
 * Normalize labels - deduplicate, sort by name, validate colors
 */
export function normalizeLabels(labels: unknown): Label[] {
  if (!Array.isArray(labels)) {
    return [];
  }
  
  // Filter valid labels, dedupe by name, sort
  const validLabels: Label[] = [];
  const seen = new Set<string>();
  
  for (const item of labels) {
    if (
      item &&
      typeof item === 'object' &&
      'name' in item &&
      'color' in item &&
      typeof item.name === 'string' &&
      typeof item.color === 'string' &&
      item.name.trim() !== ''
    ) {
      const name = item.name.trim();
      if (!seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        validLabels.push({
          name,
          color: item.color,
        });
      }
    }
  }
  
  // Sort by name for deterministic ordering
  return validLabels.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Normalize due date - validate YYYY-MM-DD format
 */
export function normalizeDueDate(due_date: unknown): string | null {
  if (due_date === null || due_date === undefined || due_date === '') {
    return null;
  }
  
  if (typeof due_date !== 'string') {
    return null;
  }
  
  // Validate YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(due_date)) {
    return null;
  }
  
  // Validate it's a real date
  const date = new Date(due_date + 'T00:00:00.000Z');
  if (isNaN(date.getTime())) {
    return null;
  }
  
  return due_date;
}

/**
 * Format date for storage - convert Date to YYYY-MM-DD
 */
export function formatDateForStorage(date: Date | null): string | null {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return null;
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Parse date from storage - convert YYYY-MM-DD to Date
 */
export function parseDateFromStorage(dateStr: string | null): Date | null {
  if (!dateStr) {
    return null;
  }
  
  const normalized = normalizeDueDate(dateStr);
  if (!normalized) {
    return null;
  }
  
  return new Date(normalized + 'T00:00:00.000Z');
}

/**
 * Calculate metadata hash for change detection
 * Uses SHA-256 with deterministic JSON serialization
 */
export async function calculateMetadataHash(metadata: Partial<TaskMetadata>): Promise<string> {
  // Create ordered object to ensure deterministic hash
  const ordered = {
    title: metadata.title || '',
    priority: metadata.priority || 'none',
    labels: metadata.labels || [],
    due_date: metadata.due_date || null,
    status: metadata.status || 'needsAction',
    notes: metadata.notes || null,
    time_block: metadata.time_block || null,
  };
  
  const jsonString = JSON.stringify(ordered);
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);
  
  // Use SubtleCrypto for SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Serialize metadata for Google Tasks API
 * Encodes custom fields (priority, labels, time_block) into notes field as JSON
 */
export function serializeForGoogle(metadata: TaskMetadata): {
  title: string;
  status: string;
  due?: string;
  notes?: string;
} {
  const googleTask: {
    title: string;
    status: string;
    due?: string;
    notes?: string;
  } = {
    title: metadata.title,
    status: metadata.status,
  };
  
  // Convert due_date to RFC3339 format for Google
  if (metadata.due_date) {
    googleTask.due = `${metadata.due_date}T00:00:00.000Z`;
  }
  
  // Encode custom metadata in notes
  const customMeta = {
    priority: metadata.priority !== 'none' ? metadata.priority : undefined,
    labels: metadata.labels.length > 0 ? metadata.labels : undefined,
    time_block: metadata.time_block || undefined,
  };
  
  const notesPayload = {
    meta: customMeta,
    body: metadata.notes || '',
  };
  
  googleTask.notes = JSON.stringify(notesPayload);
  
  return googleTask;
}

/**
 * Deserialize metadata from Google Tasks API
 * Extracts custom fields from notes JSON
 */
export function deserializeFromGoogle(googleTask: {
  id?: string;
  title?: string;
  status?: string;
  due?: string;
  notes?: string;
  updated?: string;
}): Partial<TaskMetadata> {
  const metadata: Partial<TaskMetadata> = {
    title: googleTask.title || 'Untitled',
    status: googleTask.status === 'completed' ? 'completed' : 'needsAction',
  };
  
  // Parse due date from RFC3339 to YYYY-MM-DD
  if (googleTask.due) {
    const dueDate = new Date(googleTask.due);
    if (!isNaN(dueDate.getTime())) {
      metadata.due_date = formatDateForStorage(dueDate);
    }
  }
  
  // Parse custom metadata from notes
  if (googleTask.notes) {
    try {
      const notesPayload = JSON.parse(googleTask.notes);
      if (notesPayload.meta) {
        if (notesPayload.meta.priority) {
          metadata.priority = normalizePriority(notesPayload.meta.priority);
        }
        if (notesPayload.meta.labels) {
          metadata.labels = normalizeLabels(notesPayload.meta.labels);
        }
        if (notesPayload.meta.time_block) {
          metadata.time_block = notesPayload.meta.time_block;
        }
      }
      if (notesPayload.body) {
        metadata.notes = notesPayload.body;
      }
    } catch (e) {
      // If notes aren't JSON, treat as plain text
      metadata.notes = googleTask.notes;
    }
  }
  
  // Apply defaults for missing fields
  if (!metadata.priority) {
    metadata.priority = 'none';
  }
  if (!metadata.labels) {
    metadata.labels = [];
  }
  
  return metadata;
}
