import { z } from 'zod';

import { isTauriRuntime } from '../isTauri';
import type { GoogleTokenResponse } from '../oauth/google';
import { refreshGoogleAccessToken } from '../oauth/google';

const GOOGLE_TASKS_BASE_URL = 'https://tasks.googleapis.com/tasks/v1';

const googleTokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number().optional(),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
  token_type: z.string().optional(),
  id_token: z.string().optional(),
});

const commandResponseSchema = z.object({
  data: z.unknown().optional(),
  updated_token: googleTokenResponseSchema.optional(),
});

const googleTaskListSchema = z.object({
  kind: z.string().optional(),
  id: z.string(),
  title: z.string(),
  updated: z.string().optional(),
  selfLink: z.string().optional(),
  etag: z.string().optional(),
});

const googleTaskLinkSchema = z.object({
  type: z.string(),
  description: z.string().optional(),
  link: z.string().optional(),
});

const googleTaskSchema = z.object({
  kind: z.string().optional(),
  id: z.string(),
  title: z.string().default(''),
  status: z.string().optional(),
  updated: z.string().optional(),
  due: z.string().optional(),
  completed: z.string().optional(),
  notes: z.string().optional(),
  deleted: z.boolean().optional(),
  hidden: z.boolean().optional(),
  parent: z.string().optional(),
  position: z.string().optional(),
  etag: z.string().optional(),
  links: z.array(googleTaskLinkSchema).optional(),
});

const listTasklistsResponseSchema = z.object({
  kind: z.string().optional(),
  etag: z.string().optional(),
  items: z.array(googleTaskListSchema).optional().default([]),
  nextPageToken: z.string().optional(),
  nextSyncToken: z.string().optional(),
});

const listTasksResponseSchema = z.object({
  kind: z.string().optional(),
  etag: z.string().optional(),
  items: z.array(googleTaskSchema).optional().default([]),
  nextPageToken: z.string().optional(),
  nextSyncToken: z.string().optional(),
});

type CommandResult<T> = {
  data: T;
  updatedToken?: GoogleTokenResponse;
};

export type GoogleTaskList = z.infer<typeof googleTaskListSchema>;
export type GoogleTask = z.infer<typeof googleTaskSchema>;
export type GoogleTasklistsResponse = z.infer<typeof listTasklistsResponseSchema>;
export type GoogleTasksListResponse = z.infer<typeof listTasksResponseSchema>;

export type GoogleTasksAuthContext = {
  accessToken: string;
  refreshToken?: string | null;
  clientId?: string | null;
  clientSecret?: string | null;
};

function buildTasksUrl(segments: string[], query?: Record<string, string | undefined>): URL {
  const url = new URL(GOOGLE_TASKS_BASE_URL);
  const basePath = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
  url.pathname = [basePath, ...segments].join('/');
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    }
  }
  return url;
}

function normaliseAuth(auth: GoogleTasksAuthContext): Record<string, unknown> {
  const next: Record<string, unknown> = {
    accessToken: auth.accessToken,
  };
  if (auth.refreshToken != null) {
    next.refreshToken = auth.refreshToken;
  }
  if (auth.clientId != null) {
    next.clientId = auth.clientId;
  }
  if (auth.clientSecret != null) {
    next.clientSecret = auth.clientSecret;
  }
  return next;
}

async function invokeTauriCommand<T>(
  command: string,
  payload: Record<string, unknown>,
  schema: z.ZodType<T>,
): Promise<CommandResult<T>> {
  const { invoke } = await import('@tauri-apps/api/core');
  const raw = await invoke<unknown>(command, { payload });
  const parsed = commandResponseSchema.parse(raw);
  const data = schema.parse(parsed.data ?? undefined);
  return {
    data,
    updatedToken: parsed.updated_token,
  };
}

async function fetchGoogleTasks<T>(
  options: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    segments: string[];
    query?: Record<string, string | undefined>;
    body?: unknown;
    schema: z.ZodType<T>;
    auth: GoogleTasksAuthContext;
  },
): Promise<CommandResult<T>> {
  const { method, segments, query, body, schema, auth } = options;
  let accessToken = auth.accessToken;
  let updatedToken: GoogleTokenResponse | undefined;

  for (let attempt = 0; attempt <= 1; attempt += 1) {
    const url = buildTasksUrl(segments, query);
    const response = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (
      response.status === 401 &&
      attempt === 0 &&
      auth.refreshToken &&
      auth.clientId
    ) {
      const refreshed = await refreshGoogleAccessToken({
        refreshToken: auth.refreshToken,
        clientId: auth.clientId,
        clientSecret: auth.clientSecret ?? undefined,
      });
      updatedToken = refreshed;
      accessToken = refreshed.access_token;
      continue;
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`Google Tasks API returned ${response.status}: ${errorBody}`);
    }

    const payload = response.status === 204 ? undefined : await response.json();
    const data = schema.parse(payload);
    return {
      data,
      updatedToken,
    };
  }

  throw new Error('Google Tasks request retry limit exceeded');
}

export async function listTasklists(options: {
  auth: GoogleTasksAuthContext;
  maxResults?: number;
  pageToken?: string;
  fields?: string;
}): Promise<CommandResult<GoogleTasklistsResponse>> {
  const { auth, maxResults, pageToken, fields } = options;
  const schema = listTasklistsResponseSchema;

  if (isTauriRuntime()) {
    return invokeTauriCommand('google_tasks_list_tasklists', {
      auth: normaliseAuth(auth),
      ...(maxResults != null ? { maxResults } : {}),
      ...(pageToken ? { pageToken } : {}),
      ...(fields ? { fields } : {}),
    }, schema);
  }

  return fetchGoogleTasks({
    method: 'GET',
    segments: ['users', '@me', 'lists'],
    query: {
      maxResults: maxResults != null ? String(maxResults) : undefined,
      pageToken,
      fields,
    },
    schema,
    auth,
  });
}

export async function listTasks(options: {
  auth: GoogleTasksAuthContext;
  listId: string;
  pageToken?: string;
  syncToken?: string;
  showCompleted?: boolean;
  showDeleted?: boolean;
  showHidden?: boolean;
  maxResults?: number;
  updatedMin?: string;
  dueMin?: string;
  dueMax?: string;
  fields?: string;
}): Promise<CommandResult<GoogleTasksListResponse>> {
  const {
    auth,
    listId,
    pageToken,
    syncToken,
    showCompleted,
    showDeleted,
    showHidden,
    maxResults,
    updatedMin,
    dueMin,
    dueMax,
    fields,
  } = options;
  const schema = listTasksResponseSchema;

  if (isTauriRuntime()) {
    return invokeTauriCommand('google_tasks_list_tasks', {
      auth: normaliseAuth(auth),
      listId,
      ...(pageToken ? { pageToken } : {}),
      ...(syncToken ? { syncToken } : {}),
      ...(showCompleted != null ? { showCompleted } : {}),
      ...(showDeleted != null ? { showDeleted } : {}),
      ...(showHidden != null ? { showHidden } : {}),
      ...(maxResults != null ? { maxResults } : {}),
      ...(updatedMin ? { updatedMin } : {}),
      ...(dueMin ? { dueMin } : {}),
      ...(dueMax ? { dueMax } : {}),
      ...(fields ? { fields } : {}),
    }, schema);
  }

  return fetchGoogleTasks({
    method: 'GET',
    segments: ['lists', listId, 'tasks'],
    query: {
      pageToken,
      syncToken,
      showCompleted: showCompleted != null ? String(showCompleted) : undefined,
      showDeleted: showDeleted != null ? String(showDeleted) : undefined,
      showHidden: showHidden != null ? String(showHidden) : undefined,
      maxResults: maxResults != null ? String(maxResults) : undefined,
      updatedMin,
      dueMin,
      dueMax,
      fields,
    },
    schema,
    auth,
  });
}

export async function insertTask(options: {
  auth: GoogleTasksAuthContext;
  listId: string;
  task: Record<string, unknown>;
  parent?: string;
  previous?: string;
  fields?: string;
}): Promise<CommandResult<GoogleTask>> {
  const { auth, listId, task, parent, previous, fields } = options;
  const schema = googleTaskSchema;

  if (isTauriRuntime()) {
    return invokeTauriCommand('google_tasks_insert_task', {
      auth: normaliseAuth(auth),
      listId,
      task,
      ...(parent ? { parent } : {}),
      ...(previous ? { previous } : {}),
      ...(fields ? { fields } : {}),
    }, schema);
  }

  return fetchGoogleTasks({
    method: 'POST',
    segments: ['lists', listId, 'tasks'],
    query: {
      parent,
      previous,
      fields,
    },
    body: task,
    schema,
    auth,
  });
}

export async function patchTask(options: {
  auth: GoogleTasksAuthContext;
  listId: string;
  taskId: string;
  updates: Record<string, unknown>;
  fields?: string;
}): Promise<CommandResult<GoogleTask>> {
  const { auth, listId, taskId, updates, fields } = options;
  const schema = googleTaskSchema;

  if (isTauriRuntime()) {
    return invokeTauriCommand('google_tasks_patch_task', {
      auth: normaliseAuth(auth),
      listId,
      taskId,
      updates,
      ...(fields ? { fields } : {}),
    }, schema);
  }

  return fetchGoogleTasks({
    method: 'PATCH',
    segments: ['lists', listId, 'tasks', taskId],
    query: {
      fields,
    },
    body: updates,
    schema,
    auth,
  });
}

export async function deleteTask(options: {
  auth: GoogleTasksAuthContext;
  listId: string;
  taskId: string;
}): Promise<CommandResult<void>> {
  const { auth, listId, taskId } = options;
  const schema = z.void();

  if (isTauriRuntime()) {
    return invokeTauriCommand('google_tasks_delete_task', {
      auth: normaliseAuth(auth),
      listId,
      taskId,
    }, schema);
  }

  return fetchGoogleTasks({
    method: 'DELETE',
    segments: ['lists', listId, 'tasks', taskId],
    schema,
    auth,
  });
}

export async function moveTask(options: {
  auth: GoogleTasksAuthContext;
  listId: string;
  taskId: string;
  parent?: string;
  previous?: string;
  fields?: string;
}): Promise<CommandResult<GoogleTask>> {
  const { auth, listId, taskId, parent, previous, fields } = options;
  const schema = googleTaskSchema;

  if (isTauriRuntime()) {
    return invokeTauriCommand('google_tasks_move_task', {
      auth: normaliseAuth(auth),
      listId,
      taskId,
      ...(parent ? { parent } : {}),
      ...(previous ? { previous } : {}),
      ...(fields ? { fields } : {}),
    }, schema);
  }

  return fetchGoogleTasks({
    method: 'POST',
    segments: ['lists', listId, 'tasks', taskId, 'move'],
    query: {
      parent,
      previous,
      fields,
    },
    schema,
    auth,
  });
}

export const googleTasksService = {
  listTasklists,
  listTasks,
  insertTask,
  patchTask,
  deleteTask,
  moveTask,
};
