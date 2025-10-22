> **⚠️ Architecture change (2025-01-13, consolidated 2025-10-15):**  
> This guide captures the **legacy frontend-heavy pattern**. For the active backend-heavy approach (local-first SQLite + Rust-owned sync) refer to the unified roadmap section titled **"Google Tasks Local‑First Sync Refactor"** in `docs/roadmap/Unified-Workspace-Roadmap.md`.  
>  
> **See also:**  
> - Roadmap: `docs/roadmap/Unified-Workspace-Roadmap.md` (search heading above)  
> - Executable tasks (historical): `docs/implementation/backend-sync-refactor-tasks.json`  
> - Architectural spec (archived): `docs/archive/source-plans/TASK_METADATA_CRUD_PLAN.md`  
> - Memory graph: Search "Backend-Heavy Architecture Pattern"  
>
> **Current patterns still apply to:** UI-only state, non-synced features, general Zustand usage

---

0) Tech/Runtime Baseline

Runtime/UI: React 18, Vite 5, TypeScript 5, Tailwind 3.4, Radix UI, lucide-react, react-resizable-panels, react-day-picker, recharts, Konva (canvas).

Desktop shell: Tauri v2 (@tauri-apps/api, plugins: dialog, fs, deep-link/http if used).

State: Zustand v5 + immer (⚠️ mutation queues deprecated, see above), persist (whitelist + partialize).

Tests: Vitest (+ @testing-library/react, jsdom).

Validation: zod (keep in/out boundaries honest).

1) Project Layout (authoritative)
/src
  /app                 # App shell, routing, providers (QueryClient, Theme, Stores)
  /components          # Reusable presentational primitives (no business logic)
  /features            # Feature bundles (ui + hooks + store usage + services wiring)
    /tasks
    /calendar
    /gmail
    /chat
    /dashboard
  /stores              # Zustand stores (feature-scoped or cross-cutting)
  /services            # I/O & platform: Google*, Gmail*, LLM, FS, OAuth, Sync
    /google
  /types               # Domain & API types (zod schemas + TS types)
  /lib                 # Utilities: logger, time, id, env, tauri-invoke wrapper
  /styles              # Tailwind base + tokens mapping (CSS variables)
  /hooks               # Cross-cutting React hooks (useOnline, useAborter, etc.)
  /tests               # Integration/unit tests colocated or here


Rules:

Features own their UI and orchestration; services do I/O only; stores hold state only; components are dumb.

No component calls fetch/invoke directly—only services.

No service mutates stores directly—features call store actions.

2) State Management (Zustand v5)
2.1 Store template (with immer + persist and safe rehydration)
// src/stores/tasksStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Task } from '@/types/task';
import { shallow } from 'zustand/shallow';

type TasksState = {
  tasks: Record<string, Task>;
  lastSyncAt?: number;
  add(task: Task): void;
  upsertMany(list: Task[], source: 'local' | 'google'): void;
  markSynced(ids: string[], at: number): void;
  remove(id: string): void;
  clear(): void;
};

export const useTasksStore = create<TasksState>()(
  persist(
    immer((set) => ({
      tasks: {},
      add: (t) => set(s => { s.tasks[t.id] = t; }),
      upsertMany: (list, source) => set(s => {
        for (const t of list) s.tasks[t.id] = { ...t, source };
      }),
      markSynced: (ids, at) => set(s => {
        s.lastSyncAt = at;
        for (const id of ids) if (s.tasks[id]) s.tasks[id].syncState = 'synced';
      }),
      remove: (id) => set(s => { delete s.tasks[id]; }),
      clear: () => set({ tasks: {}, lastSyncAt: undefined }),
    })),
    {
      name: 'tasks-store',
      // Persist only non-sensitive, deterministic slices:
      partialize: (s) => ({ tasks: s.tasks, lastSyncAt: s.lastSyncAt }),
      version: 1,
      migrate: (persisted, ver) => persisted,
      onRehydrateStorage: () => (state) => {
        // No side-effects here; only shape/compat checks if needed
      },
    }
  )
);

// Usage: const task = useTasksStore(s => s.tasks[id], shallow)


Best practices:

Selectors everywhere to minimize re-renders.

No sensitive data in persist. Tokens live in Tauri secure storage (see §3).

Deterministic shape: normalize collections to Record<ID, Entity>.

2.2 Session/secure store bridge

Create secureSessionStore that holds only a non-sensitive envelope (isConnected, accountIds) in Zustand; back it with a rehydration effect that loads full account/token details from Tauri secure storage into memory variables (not persisted).

3) Platform & Security (Tauri v2)

OAuth: Use PKCE + deep links; receive code → exchange via Tauri command → store tokens in Tauri secure storage.

Never write tokens/refresh tokens to localStorage/IndexDB.

Sanitize any HTML with DOMPurify before rendering (dependency already present).

Min scopes: request only what each feature needs (Tasks/Calendar/Gmail separately).

Error redaction: logger must scrub PII and tokens before output.

4) Services Layer (authoritative patterns)
4.1 Tauri invoke wrapper
// src/lib/invoke.ts
import { invoke } from '@tauri-apps/api/core';

export type InvokeOpts = { signal?: AbortSignal };
export async function call<T>(cmd: string, args?: Record<string, unknown>, opts?: InvokeOpts): Promise<T> {
  // Optionally add timeout/cancellation with AbortSignal
  return invoke<T>(cmd, args);
}

4.2 HTTP via Tauri plugin-http (optional)

Use @tauri-apps/plugin-http for cross-origin Google REST calls from Rust side if needed, or keep all HTTP in Rust commands and expose only typed commands to the UI.

4.3 Google services (Calendar/Tasks/Gmail)
// src/services/google/googleCalendarService.ts
import { call } from '@/lib/invoke';
import { CalendarEventZ, CalendarEvent } from '@/types/google';

export const googleCalendarService = {
  async listEvents(params: { calendarId: string; timeMin: string; timeMax: string; }): Promise<CalendarEvent[]> {
    const res = await call<unknown>('google_list_events', params);
    const arr = Array.isArray(res) ? res : [];
    return arr.map((e) => CalendarEventZ.parse(e));
  },
  async insertEvent(params: { calendarId: string; event: CalendarEvent }): Promise<CalendarEvent> {
    const res = await call<unknown>('google_insert_event', params);
    return CalendarEventZ.parse(res);
  },
  // ... patch/delete etc.
};


Rules:

All service inputs/outputs are validated with zod at boundaries.

No store touching here. Services return data; features decide how to update stores.

Normalize errors to a single shape:

// src/lib/errors.ts
export type AppError = {
  code: 'NETWORK' | 'AUTH' | 'RATE_LIMIT' | 'VALIDATION' | 'UNKNOWN';
  message: string;
  cause?: unknown;
};
export const asAppError = (e: unknown): AppError => {
  // translate OS/HTTP/Tauri errors into AppError; scrub PII
  return { code: 'UNKNOWN', message: 'Unexpected error', cause: e };
};

5) Sync Engine (polling + mutations)

Implement a lightweight SyncEngine per integration that:

Subscribes to auth/session and online status.

Runs poll loops with exponential backoff and jitter.

Maintains a mutation queue with idempotent ops and retry.

// src/services/sync/tasksSync.ts
import { useTasksStore } from '@/stores/tasksStore';
import { googleTasksService } from '@/services/google/googleTasksService';
import { getOnline } from '@/hooks/useOnline';

export function startTasksAutoSync() {
  let stopped = false;
  let timer: number | undefined;

  async function tick() {
    if (stopped) return;
    try {
      if (getOnline() && sessionIsConnected()) {
        const incoming = await googleTasksService.listAll();
        useTasksStore.getState().upsertMany(incoming, 'google');
        useTasksStore.getState().markSynced(incoming.map(t => t.id), Date.now());
        await flushMutationQueue(); // push local pending to Google
      }
    } catch (e) {
      // log asAppError(e)
    } finally {
      timer = window.setTimeout(tick, nextIntervalMs()); // backoff or steady
    }
  }

  tick();
  return () => { stopped = true; if (timer) clearTimeout(timer); };
}


Conflict policy:

Use updatedAt comparison; prefer newest; mark conflicted tasks with syncState:'conflict' and (once the redesigned affordance ships) surface a resolve UI—current builds intentionally hide the badge until the new flow is ready.

6) Server-State Option (TanStack Query)

You can keep Zustand-only, or introduce TanStack Query for all remote reads:

Zustand: UI state + local entities + mutation queue.

React Query: remote reads (listEvents, listTasks), retries, stale-time, background refresh.

Use queryKeys like ['googleTasks', accountId, listId].

Mutations: optimistic add/update/delete with rollback; on settle, reconcile to store.

If you add it:

// src/app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const client = new QueryClient({ defaultOptions: { queries: { retry: 2, staleTime: 30_000 } } });

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

7) Types & Validation

Single source of truth in /src/types.

Pair zod schemas with inferred TS types.

// src/types/google.ts
import { z } from 'zod';
export const CalendarEventZ = z.object({
  id: z.string(),
  summary: z.string().default(''),
  start: z.object({ dateTime: z.string() }),
  end: z.object({ dateTime: z.string() }),
  updated: z.string().optional(),
  // ...
});
export type CalendarEvent = z.infer<typeof CalendarEventZ>;


For Tasks, include: id, title, notes, due, priority, labels[], source: 'local'|'google', syncState: 'pending'|'synced'|'error'|'conflict', updatedAt.

8) UI System

Tailwind + tokens: use CSS variables for color/length; no magic numbers.

Sentence case for UI chrome; user/content verbatim where applicable.

Radix primitives for A11y; lucide-react for icons.

Composition > props explosion. Keep components presentational; lift side-effects out.

Example token mapping in CSS:

/* src/styles/tokens.css */
:root {
  --surface: 0 0% 100%;
  --ink-1: 222 10% 96%;
  --radius: 12px;
}
/* Usage: className="bg-[hsl(var(--surface))] rounded-[var(--radius)]" */

9) Error UX & Logging

Standard toast for recoverable errors; inline banners for blocking errors.

Show last sync time and retry affordance on failure.

Centralized logger with PII redaction; debug-only verbose logs.

10) Testing

Unit: store reducers/actions (pure logic), service response parsing (zod).

Integration: feature flows with @testing-library/react + jsdom.

Mock Tauri invoke and Google responses with a lightweight stub layer.

Example store test:

import { describe, it, expect } from 'vitest';
import { useTasksStore } from '@/stores/tasksStore';
it('adds a task', () => {
  const { add, tasks } = useTasksStore.getState();
  add({ id: 't1', title: 'A', source: 'local', syncState: 'pending' });
  expect(useTasksStore.getState().tasks['t1'].title).toBe('A');
});

11) Build & Scripts

pnpm dev or npm run dev → Vite dev.

npm run tauri:dev → desktop shell.

npm run type-check → gate CI.

npm run test:run → CI tests; npm run test:coverage for thresholds.

CI gates (recommended):

type-check passes

tests pass (min coverage on stores/services)

lint passes (add ESLint + Prettier if not present)

no circular deps (use madge in CI)

12) Implementation Checklist (copy/paste)

Providers: wrap app with Theme, QueryClient (if adopted), and ErrorBoundary.

Stores: tasksStore, calendarStore, settingsStore, secureSessionStore. Persist only non-sensitive slices.

Services: googleCalendarService, googleTasksService, gmailService, oauthService, llmProviders. All I/O through Tauri commands; zod-validated.

Sync: tasksSync, calendarSync, gmailSync with start/stop handles; poll with backoff; mutation queue + retries.

UI: Radix primitives, lucide icons, tokenized Tailwind. No magic numbers.

Security: PKCE + deep-link; tokens only in secure storage; sanitize HTML.

Testing: unit (stores/services) + integration (feature flows).

Logging: centralized; PII redaction; debug switches.

Docs: short READMEs in each feature folder describing data flow: service → feature → store → UI.

13) Code Stubs (drop-in)

Mutation queue item

// src/types/mutation.ts
export type MutationOp =
  | { kind: 'task.create'; payload: Task }
  | { kind: 'task.update'; payload: Partial<Task> & { id: string } }
  | { kind: 'task.delete'; payload: { id: string } };

export type MutationItem = {
  id: string;
  op: MutationOp;
  attempts: number;
  lastError?: string;
  enqueuedAt: number;
};


Offline/online hook

// src/hooks/useOnline.ts
import { useEffect, useSyncExternalStore } from 'react';
let online = navigator.onLine;
const subs = new Set<() => void>();
const emit = () => subs.forEach(fn => fn());

window.addEventListener('online',  () => { online = true;  emit(); });
window.addEventListener('offline', () => { online = false; emit(); });

export function useOnline() {
  return useSyncExternalStore(
    (cb) => { subs.add(cb); return () => subs.delete(cb); },
    () => online,
    () => true
  );
}
export const getOnline = () => online;


Provider bootstrap

// src/app/AppProviders.tsx
import { ThemeProvider } from 'next-themes';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
// import QueryClientProvider if using React Query

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AppErrorBoundary>
        {children}
      </AppErrorBoundary>
    </ThemeProvider>
  );
}

14) Performance Notes

Virtualize long lists (react-window) for tasks and mail.

Selector discipline in Zustand; avoid broad state => state.

Memoize heavy derived views; avoid unstable inline lambdas as props.

Batch updates (immer already helps); coalesce sync payloads.

15) Accessibility & UX Guardrails

Radix + proper roles/labels; keyboard first.

Visible but calm focus rings; no color-only cues; prefers-reduced-motion respected.

Announce sync errors and completions via aria-live region.

16) What NOT to do

Don’t store tokens/Google account objects in persisted Zustand slices.

Don’t call services from components.

Don’t mutate store state outside set/immer producers.

Don’t bypass zod at external boundaries.