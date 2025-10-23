# Tasks modularization and refactor plan

_Last updated: 2025-10-23 (see `refactor/sync-service-modularization` branch)_

## Purpose and guardrails

This plan decomposes every large, task-related file called out in the audit while preserving all existing behavior, side effects, and configuration. Every step below:

- Maintains feature parity (no UX or API regressions tolerated).
- Keeps public exports stable until the end of each stage, using shim/barrel files when needed.
- Requires baseline and exit validation (`npm run type-check`, `npm run test`, manual task board/list checks, `cargo fmt`, `cargo clippy`, `cargo test` where applicable).
- Tracks “line coverage” by mapping each current file section to a target module before code moves; the mapping checklist must reach 100 % before deleting legacy code.

## Global sequencing

| Stage | Scope | Dependencies | Exit signals |
|-------|-------|--------------|--------------|
| 0 | Baseline snapshots, annotate each target file with region markers (`// #region` comments) to aid section mapping. | None | Git diff only contains annotations; all tests green. |
| 1 | React UI shells (`TasksModule.tsx`, `TasksBoard.tsx` support pieces, removal of `components/tasks/TaskRow.tsx`). | Stage 0 | Board/list toggles still work; context menu edit opens drawer; `TaskRow` no longer referenced. |
| 2 | Drawer & detail surfaces (`TaskDetailsDrawer.tsx`). | Stage 1 | Drawer renders via new subcomponents; hotkeys/tooltips intact. |
| 3 | State layer (`taskStore.tsx`, selectors, event listeners, tests). | Stage 2 | Store exports identical; optimistic flows verified; tests split but passing. |
| 4 | Calendar integration (`CalendarTasksRail.tsx`). | Stage 3 | Calendar tasks rail uses shared primitives; UI parity confirmed. |
| 5 | Rust command restructuring (`src-tauri/src/commands/tasks.rs`). | Stage 3 | All Tauri commands exported unchanged; `cargo test` passes. |
| 6 | Sync service modularization (`src-tauri/src/sync_service.rs`). | Stage 5 | New modules for token management & reconciler; background sync still emits identical events. |
| 7 | Documentation + cleanup (update roadmap status, deprecate leftover stubs). | Stage 6 | Roadmap references this plan; unused files archived/deleted. |

Each stage can land as its own PR with the described validation checks.

## Stage 1 – `TasksModule.tsx` (1,161 LOC) and board scaffolding

### Current responsibilities inventory

| Region (annotated in Stage 0) | Responsibility |
|-------------------------------|----------------|
| Imports + constants | Launches Quick Assistant, pulls store hooks, defines static helper functions. |
| Top-level state hooks | View mode, filters, dialogs, quick assistant scope. |
| Derived collections | `filteredTasks`, label maps, columns. |
| Header composition | Segmented toggle, filters, sync button, assistant CTA. |
| Board/list split render | `BoardView`, `ListView`, column mapping, list table. |
| Dialogs (delete list etc.) | Inline confirm dialogs and footers. |
| Drawer handoff | `TaskDetailsDrawer` wiring. |

### Target module layout

```
components/modules/tasks/view/
  ├── TasksViewContext.ts (provides shared state for board/list children)
  ├── TasksHeader.tsx (header + filter controls)
  ├── BoardView/
  │     ├── index.tsx (was BoardView component)
  │     └── ColumnAddList.tsx, BoardEmptyState.tsx, etc.
  ├── ListView/
  │     ├── index.tsx
  │     └── ListTable.tsx, ListRow.tsx
  └── dialogs/
        └── DeleteListDialog.tsx
TasksModule.tsx (orchestration shell only)
```

### Sequential tasks

1. **Annotate regions** with `// #region` comments matching the inventory table.
2. **Introduce `TasksViewContext`** that wraps shared state (filters, project scope, search query). Move existing state hooks into this provider.
3. **Extract header** into `TasksHeader.tsx`. Export same props currently wired from `TasksModule`. Ensure segmented toggle + search input retest keyboard interactions.
4. **Split `BoardView` and `ListView`** into `/BoardView/index.tsx` and `/ListView/index.tsx`. Both consume context from step 2.
5. **Lift dialogs** (`DeleteListDialog`, inline add-list form) into `view/dialogs/` and re-export via barrel (`view/dialogs/index.ts`).
6. **Remove `components/tasks/TaskRow.tsx`**; if calendar later needs it, import from new ListView row. Search repo to confirm no references remain.
7. **Update `TasksModule.tsx`** to import the new components, keep only high-level layout and `TaskDetailsDrawer` wiring.
8. **Validation:**
   - `npm run type-check`
   - Manual: switch between board/list, trigger filters, add/delete list, open assistant button.
   - `git grep TaskRow` should return zero results.

## Stage 2 – `TaskDetailsDrawer.tsx` (1,230 LOC)

### Responsibilities inventory

| Region | Responsibility |
|--------|----------------|
| Drawer scaffolding | Radix dialog wrapper, open/close controls. |
| Header | Title editing, completion toggle, meta badges. |
| Metadata panes | Due date, priority, labels, project linkage. |
| Subtasks editor | Lists subtasks, add/edit forms, keyboard shortcuts. |
| Activity feed | Comments, history, attachments. |
| Footer actions | Duplicate, delete, open in board. |
| Hooks/utilities | `useTaskDetails`, data fetching, optimistic updates. |

### Target module layout

```
components/modules/tasks/details/
  ├── TaskDetailsDrawer.tsx (shell)
  ├── header/
  │     ├── TitleEditor.tsx
  │     └── MetaBadges.tsx
  ├── panels/
  │     ├── DatesPanel.tsx
  │     ├── PriorityPanel.tsx
  │     ├── LabelsPanel.tsx
  │     └── ProjectPanel.tsx
  ├── subtasks/
  │     ├── SubtaskList.tsx
  │     ├── SubtaskItem.tsx
  │     └── SubtaskComposer.tsx
  ├── activity/
  │     ├── ActivityFeed.tsx
  │     └── ActivityComposer.tsx
  └── useTaskDetails.ts (shared hook for data + actions)
```

### Sequential tasks

1. Annotate regions and list the exact props/state each consumes.
2. Extract `useTaskDetails` hook (currently inline) into its own module, with unit tests covering optimistic update flows.
3. Create shell `details/TaskDetailsDrawer.tsx` that imports header, panels, subtasks, activity.
4. Move header logic (title editing, completion toggle) into `header/TitleEditor.tsx`; ensure analytics events remain.
5. Move metadata sections into `panels/` components, each accepting strongly typed props. Shared token usage stays consistent.
6. Extract subtasks functionality into dedicated components; ensure keyboard shortcuts and focus retention are tested.
7. Extract activity feed + composer; reuse existing comment rendering.
8. Wire everything back into new shell; delete legacy sections after confirming the mapping checklist.
9. Validation: open drawer from board, edit fields, add subtasks, add comment, duplicate/delete actions. Confirm emitted events identical via console logs (dev mode).

## Stage 3 – `taskStore.tsx` (1,122 LOC) & tests

### Responsibilities inventory

| Section | Responsibility |
|---------|----------------|
| Store creation | Zustand + persist config, default lists. |
| Helpers | ID generation, label/subtask serialization, metadata builder. |
| Actions | `addTask`, `updateTask`, `deleteTask`, `moveTask`, list lifecycle, sync helpers. |
| Event listeners | `TaskStoreProvider` effect registering Tauri events. |
| Selectors/hooks | `useTasks`, `useTaskLists`, `selectSyncStatus`, etc. |

### Target layout

```
components/modules/tasks/store/
  ├── core.ts (store creation + persist options)
  ├── helpers.ts (IDs, serialization, metadata builder)
  ├── actions/
  │     ├── tasks.ts (add/update/delete/move)
  │     ├── lists.ts (create/delete)
  │     └── sync.ts (syncNow, setSyncStatus)
  ├── events.ts (TaskStoreProvider + event handling)
  ├── selectors.ts (selectTasks, selectTaskLists, etc.)
  ├── index.ts (exports compatibles with existing import paths)
  └── __tests__/
         ├── tasks.test.ts
         ├── lists.test.ts
         └── sync.test.ts
```

### Sequential tasks

1. Annotate sections in the current file.
2. Move pure helpers (`createId`, `serializeSubtasks`, etc.) to `helpers.ts` with named exports; update imports within actions.
3. Create `core.ts` containing state shape definition, store initialization, and persist config. Export `taskStoreApi` and `useTaskStore` from here.
4. Split action groups into separate modules; each receives `set`/`get` from store (pass via `createTaskActions(set, get)` pattern). Ensure TypeScript types reused rather than duplicated.
5. Refactor `TaskStoreProvider` into `events.ts`, isolating Tauri listener wiring. Include cleanup logic added earlier.
6. Update existing consumers to import from `tasks/store` barrel that re-exports `taskStoreApi`, hooks, selectors.
7. Break monolithic test into targeted suites aligning with new modules. Ensure tests cover optimistic scenarios, event deduping, sync fallback.
8. Validation: run `npm run test` (or relevant subset) and manual flows (create/update/move tasks, list create/delete, sync now button).

## Stage 4 – `CalendarTasksRail.tsx` (897 LOC)

### Responsibilities inventory

| Region | Responsibility |
|--------|----------------|
| Data fetch | selects tasks/events for day view. |
| Filtering/grouping | groups tasks by due status/time. |
| UI rendering | row layout, empty state, inline composers. |
| Legacy `TaskRow` references | Some blocks commented referencing removed component. |

### Target layout

```
components/modules/calendar/tasks-rail/
  ├── CalendarTasksRail.tsx (container + data selection)
  ├── TaskRailSection.tsx (renders each grouped block)
  ├── TaskRailItem.tsx (shared with tasks ListView if possible)
  ├── EmptyState.tsx
  └── hooks.ts (shared selectors/helpers)
```

### Sequential tasks

1. Document current grouping logic (due today, overdue, upcoming) and ensure equivalence tests.
2. Extract pure selectors/helpers into `hooks.ts` (e.g., `useCalendarTasks`, sorting helpers).
3. Implement `TaskRailSection` to render grouped titles and item lists using shared `TaskRailItem` component (reuse ListView row styles to avoid divergence).
4. Remove remaining references to now-deleted `TaskRow`, ensuring only shared components used.
5. Update Calendar module imports and ensure fallback states remain accessible.
6. Manual validation: Calendar rail shows correct tasks, toggling filters still works; clicking a task opens drawer.

## Stage 5 – `src-tauri/src/commands/tasks.rs` (1,179 LOC)

### Responsibilities inventory

| Block | Responsibility |
|-------|----------------|
| DTOs & deserialization | `TaskUpdates`, label inputs, subtask inputs. |
| Shared helpers | `convert_label_inputs`, `fetch_subtasks_for_tasks`, etc. |
| Command handlers | `create_task`, `update_task_command`, `delete_task`, `queue_move_task`, list commands. |
| Mutation logging + sync queue | Logging to `task_mutation_log`, enqueuing operations. |

### Target layout

```
src-tauri/src/commands/tasks/
  ├── mod.rs (exports, register commands)
  ├── dto.rs (TaskUpdates, TaskLabelInput, helper conversions)
  ├── helpers.rs (metadata diffing, load with subtasks)
  ├── create.rs
  ├── update.rs
  ├── delete.rs
  ├── move.rs
  ├── lists.rs (create/delete list, get lists)
  └── sync.rs (process_sync_queue_only wrapper, shared events)
```

### Sequential tasks

1. Annotate existing code with `// region` comments matching the table.
2. Create new module directory; move DTO definitions into `dto.rs`, ensure `pub use` from `mod.rs` so external imports remain the same.
3. Move helper functions (`fetch_subtasks_for_tasks`, `load_task_with_subtasks`) into `helpers.rs`; reference from command modules.
4. For each command, move implementation into dedicated file exporting `pub async fn ...` functions. Keep Tauri derive macros in `mod.rs`.
5. Update `src-tauri/src/main.rs` `invoke_handler!` import path as needed (likely `commands::tasks::create_task` still valid via re-export).
6. When moving code, run `cargo fmt` and `cargo clippy --workspace` to ensure style/lint parity.
7. Validate: manual smoke (create/update/delete tasks, list operations), integration tests if available.

## Stage 6 – `src-tauri/src/sync_service.rs` (1,370 LOC)

### Responsibilities inventory

| Region | Responsibility |
|--------|----------------|
| Service struct & lifecycle | start loop, spawn tasks. |
| Access token management | `ensure_access_token`, `refresh_access_token`. |
| Queue processing | `process_sync_queue`, event emission. |
| Polling & reconciliation | `poll_google_tasks`, duplicate cleanup, pruning. |
| Event emission | `emit_sync_event`, `emit_queue_event`. |
| Helpers | snapshot persistence, value conversions. |

### Target layout

```
src-tauri/src/sync/
  ├── mod.rs (pub use key structs)
  ├── service.rs (start loop, public interface)
  ├── token.rs (ensure/refresh access tokens)
  ├── queue.rs (process_sync_queue, queue-only API)
  ├── reconciler/
  │     ├── mod.rs
  │     ├── poll.rs
  │     ├── dedupe.rs
  │     └── prune.rs
  ├── events.rs (event payload structs + emitters)
  └── snapshot.rs (persist_workspace_snapshot, helpers)
```

### Sequential tasks

1. Annotate current file regions.
2. Create `sync/` module with files above; move struct definition to `service.rs` keeping `SyncService` API identical.
3. Move token logic into `token.rs`, exposing minimal interface consumed by `service.rs` and `queue.rs`.
4. Relocate queue-only logic into `queue.rs`, leveraging existing `process_queue_only` function.
5. Extract polling/reconciliation (Phase P4 requirement) into `reconciler/` modules, keeping functionality identical but splitting by concern.
6. Move event payload structs and emitters (`emit_sync_event`, `emit_queue_event`) into `events.rs`; import where needed.
7. Ensure `mod.rs` re-exports `SyncService`, `SyncEventPayload`, etc., so external callers (`main.rs`) remain unchanged.
8. Run `cargo test`, `cargo fmt`, `cargo clippy --workspace`; manually trigger sync (via app) to verify events fire.

## Stage 7 – Tests & cleanup (`components/modules/tasks/__tests__/taskStore.test.ts`, docs)

1. Split current 714-line test file into `tasks.test.ts`, `lists.test.ts`, `sync.test.ts` under `store/__tests__/` aligning with Stage 3 modules.
2. Add regression test covering context-menu “Edit” action to ensure drawer opens after Stage 1 changes.
3. Remove `components/tasks/TaskRow.tsx` (already done Stage 1) and ensure no orphan CSS tokens.
4. Update docs:
   - Add reference to this plan in `docs/roadmap/Unified-Workspace-Roadmap.md` under the Google Tasks refactor section.
   - Document new module structure in `docs/guidelines/Guidelines.md` (Task module section) once code lands.

## Validation checklist per stage

- [ ] `npm run type-check`
- [ ] `npm run test` (include new suites once split)
- [ ] Manual task board smoke (board/list toggles, drawer editing, context menu edit, sync button)
- [ ] Manual calendar rail smoke (tasks appear, open drawer)
- [ ] `cargo fmt`
- [ ] `cargo clippy --workspace`
- [ ] `cargo test`
- [ ] Manual sync cycle (watch log for `tasks:sync:complete` and `tasks:sync:queue-processed`)

## Communication & tracking

- Each stage should land via dedicated PR referencing this plan and the roadmap.
- Update the roadmap “Next Critical Action” checklist as stages complete.
- Coordinate with QA to run regression sweeps after Stage 4 (UI) and Stage 6 (backend).

## Appendix – Line mapping template

Before moving any code, copy the table below into the PR description (or an inline doc) and fill in the destination for every region to guarantee nothing is lost.

| Legacy file & region | Destination module/component | Status |
|----------------------|-------------------------------|--------|
| `TasksModule.tsx` – Imports | `TasksModule.tsx` (shell) | ☐ |
| `TasksModule.tsx` – Header | `view/TasksHeader.tsx` | ☐ |
| `TasksModule.tsx` – BoardView` | `view/BoardView/index.tsx` | ☐ |
| … | … | ☐ |

Duplicate this table for each large file (drawer, store, rail, commands, sync service, tests).

---

Questions or updates? Drop notes in `docs/implementation/tasks-modularization-plan.md` and notify the team in standup.
