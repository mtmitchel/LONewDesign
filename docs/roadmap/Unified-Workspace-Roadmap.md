# Unified workspace roadmap (v2)

> **Last comprehensive audit: 2025-10-22** — Phase completion percentages, status markers, and implementation notes updated to reflect current codebase state. All outdated January 2025 status snapshots replaced with October 2025 snapshot. Major updates: P1-P3 now complete, saga orchestration shipped, conflict surfacing end-to-end operational, completed-count parity fix landed.

> **This is the single authoritative source** for what's being built, what's in progress, and what's complete. All engineers should reference this roadmap when planning work. For coding conventions and setup, see `../guidelines/Guidelines.md`.

> Formerly `Unified-UI-Redesign.md`; this living roadmap now covers the unified UI redesign and the Google Workspace (Mail · Calendar · Tasks) integration workstreams.

**Status legend:**
- ✅ **Complete** — Shipped and verified working
- 🔄 **In progress** — Active development, PRs open or work underway
- ⏳ **Pending** — Planned but not yet started, may have dependencies
- 🛠️ **Blocked** — Waiting on external dependency or decision

**How to use this roadmap:**
1. Find your assigned section or search for relevant keywords
2. Check status markers to see what's available to work on
3. Read task descriptions and check for implementation plan references
4. Mark items 🔄 when you start, ✅ when complete, update notes as needed
5. Keep status current — this is the source of truth for project progress

## Scope overview

* Deliver a cohesive redesign that unifies capture, navigation, project context, scheduling, and knowledge management.
* **One assistant** entry: capture, writing tools, and open-ended AI, with natural-language intent routing.
* Reuse modal, pane, and tokenized UI primitives to avoid duplicating patterns.
* Prioritize incremental delivery with clear gates so new experiences can ship progressively.

---

## Google Workspace integration (Mail · Calendar · Tasks)

### Architecture (Backend-Heavy Approach)

**Decision (2025-01-13):** After encountering Immer proxy revocation issues with frontend mutation queues, we've adopted a **backend-heavy architecture** inspired by proven Tauri app patterns:

* **Rust backend owns ALL sync logic** - Google API polling, mutation execution, retry logic, token refresh
* **SQLite database for persistence** - Task metadata (priority/labels), projects, notes, chats stored locally
* **Frontend simplified** - React/Zustand manages only UI state, calls Tauri commands via `invoke()`
* **No mutation queue in frontend** - Backend handles queueing, execution, and state transitions
* **localStorage for cache only** - Fast startup with Google API responses, not authoritative data

This architecture provides better reliability, offline support, state persistence across app restarts, and eliminates complex frontend state management issues.

### Google Tasks Local‑First Sync Refactor (Consolidated)

> Source documents consolidated here (2025-10-15): former standalone master plan (now `Sync-Refactor-Master-Plan-Stub.md`) + archived source plans. This section is the **single authoritative reference** for the task metadata + sync engine refactor. All engineering work tracking the local-first Google Tasks implementation should link to the subsections below instead of standalone plans.

#### 🎯 Objective
Provide a bulletproof, local-first, conflict-aware Google Tasks synchronization layer where **SQLite is canonical**, the **Rust backend owns all mutations + polling**, and the **React layer is read-only/event-driven** for task entities.

#### 📊 Phase Status Dashboard (Engineering Sync Refactor)

| Phase | Scope | Status | Complete | Notes |
|-------|-------|--------|----------|-------|
| P1 | Database Infrastructure | ✅ Complete | 6/6 | All migrations landed (001–006); saga tables operational |
| P2 | Command Module Extraction | ✅ Complete | 11/11 | `main.rs` slimmed to ~170 LOC; all commands modularized |
| P3 | Metadata CRUD Enhancements | ✅ Complete | 11/11 | Metadata normalizer, hashing, move saga, conflict detection shipped |
| P4 | Sync Engine Overhaul | 🟡 In Progress | 7/8 | Queue worker operational; conflict surfacing complete; reconciler module extraction pending |
| P5 | Frontend Read‑Only + Testing | 🟡 In Progress | 2/8 | Store partially optimistic; conflict events wired; property/integration tests pending |

**Next Critical Action:** With `docs/implementation/tasks-modularization-plan.md` fully executed and verified (UI split, drawer hook tests, list/store coverage, docs updated), focus shifts to extracting the remaining reconciler logic from `sync/service.rs`, completing the read-only store migration, and adding Rust property tests for normalization/CRUD/conflict paths.

#### 🧱 Architecture Layers
```
React UI (read-only task views, conflict banners)
└─ Zustand Task Store (event-driven mirror, no optimistic writes)
	└─ Tauri IPC (invoke + event emitters)
		└─ Rust Commands (CRUD, validation, mutation logging)
			└─ SQLite (tasks_metadata, task_mutation_log, sync_queue, task_lists)
				└─ Sync Service (queue worker + poller + reconciler)
					└─ Google Tasks API
```

#### ✅ Implemented Highlights
* **Enhanced schema (migrations 001–006)**: `metadata_hash`, `dirty_fields`, soft deletes, mutation log, sync queue, conflict tracking, subtask tables, saga orchestration tables (saga_logs, operation_idempotency, task_backups, operation_locks, saga_subtask_progress).
* **Task metadata normalizer** + deterministic SHA‑256 hashing + Google notes metadata packing (label color preservation end-to-end).
* **CRUD commands**: `create_task`, `update_task_command`, `delete_task`, `queue_move_task`, `get_tasks` populate queue + mutation log; all exported via `commands/tasks.rs`.
* **Background polling** + manual `sync_tasks_now` trigger operational (60s cadence).
* **Saga-based task moves (2025-10-22)**: Production-ready saga state machine with distributed transactions, idempotency (24h window), distributed locking, backup-before-delete, resumable operations, and progress tracking. Replaces direct API calls to prevent data loss and ensure consistency. Subtasks now survive list-to-list moves in both web app and desktop app.
* **Tasks board completed summary (2025-10-22)**: Now mirrors Google Tasks counts, showing only completed parent tasks instead of summing subtasks (`Completed (n)` parity fix).
* **Conflict surfacing (end-to-end complete, 2025-10-22)**:
  - Backend: `sync_service.rs` detects conflicts when local is dirty and hashes mismatch, marks `has_conflict=true`, sets `sync_state='conflict'`, blocks pending queue mutations via `mark_pending_queue_conflict`, and emits `tasks::conflict` events with local/remote snapshots plus dirty field diffs.
  - Backend: `commands/tasks.rs` clears conflict flags (`has_conflict = 0`) when authors re-edit a task, allowing next sync to resolve cleanly.
	- Frontend: `taskStore.tsx` still hydrates conflict payloads, but UI surfaces are temporarily disabled while we redesign the badge experience (no `syncState` presentation in cards).
  - Frontend: `types.ts` includes `'conflict'` in the `TaskSyncState` enum and `hasConflict?: boolean` in the `Task` interface.
  - Sync service preserves `has_conflict` state and blocks conflicting queue entries until authors resolve.

#### 🔄 Outstanding (High Priority)
1. **Reconciler module extraction**: `sync_service.rs` currently ~1,500 LOC; extract polling + reconciliation logic into `sync/reconciler.rs` module.
2. **Read‑only taskStore refactor**: Shift from optimistic updates to event-only hydration for all task mutations (partial: create/delete still optimistic; update now backend-first).
3. **Property + integration tests (Rust)**: Normalization determinism, CRUD idempotency, conflict detection paths, queue worker retry/backoff, saga move scenarios.
4. **Frontend store tests**: Event application, conflict UI flows, no direct writes validation.

#### 🧪 Testing Strategy (Snapshot)
| Layer | Tests (Planned) | Status |
|-------|-----------------|--------|
| Metadata Normalizer | Determinism, whitespace, label ordering | Pending |
| CRUD Commands | Create/update/delete/move idempotency | Partial |
| Queue Worker | Retry/backoff, conflict marking, idempotency | Pending |
| Poller/Reconciler | Field merge scenarios, soft delete pruning | Pending |
| Frontend Store | Event application, no direct writes | Pending |

#### 🔗 Cross References
* Assistant & broader product phases: see sections 1–16 below.
* State patterns: `state-and-sync-guide.md` (legacy notes + pointer here).
* Changelog: latest sync backend refinements recorded under "Google Tasks Sync Backend" and related headings; unresolved items here become Known Issues until closed.

#### 🗃️ Archival note
The full historical narrative (rationale, step-by-step task list) now lives in `docs/archive/Sync-Refactor-Master-Plan-2025-10-15.md` for provenance. Only update this consolidated section going forward.

---

### Objectives

* Provide a single Google OAuth connection that powers mail triage, calendar sync, and bidirectional task management.
* Keep the Tasks module, project boards, and calendar rail in lockstep with Google Task lists while supporting drag/drop ergonomics.
* Store all local-first data (Projects, Notes, Chats) in SQLite for proper desktop app persistence.
* Ensure shared providers, telemetry, and docs stay aligned with the broader unified UI milestones.

### Key deliverables

* `settings` integration card for Google Workspace (OAuth, secure storage, per-module toggles).
* **SQLite database foundation** with migrations for tasks_metadata, projects, notes, chats tables.
* **Rust sync service** managing Google Tasks API polling, mutation execution, token refresh, and conflict resolution.
* Simplified frontend taskStore calling Tauri commands only (`create_task`, `update_task`, `delete_task`, `sync_tasks`).
* Shared task list metadata and filters across Tasks module, calendar rail, and project boards.
* Local-first Projects/Notes/Chats persistence via Rust CRUD commands and SQLite.
* Updated roadmap/docs (`Guidelines.md`, Assistant roadmap) and instrumentation for Google sync health.

### Execution sequence (Revised 2025-01-13)

**PHASE 1: SQLite Foundation** (1-2 days)
1. Add `sqlx` dependency to `Cargo.toml` with SQLite + migrations features
2. Create database initialization system using Tauri's `app_data_dir()`
3. Create initial migration `001_create_core_tables.sql` (tasks_metadata, projects, phases, milestones)
4. Add Tauri command `init_database()` for first-time setup
5. Test cross-platform database paths (Windows/Mac/Linux)

**PHASE 2: Tasks Backend Refactor** (3-5 days, **CRITICAL PATH**)
6. Create `src-tauri/src/sync_service.rs` with `SyncService` struct
7. Implement Google Tasks sync loop (5-min polling, mutation execution, token refresh)
8. Add Rust commands: `create_task`, `update_task`, `delete_task`, `move_task`, `sync_tasks`, `get_tasks`
9. Remove `googleTasksSyncService.ts` from frontend
10. Simplify `taskStore.tsx` - remove mutation queue, keep only UI state, add invoke() wrappers
11. Update TasksModule, CalendarTasksRail, QuickAssistant to use new API
12. Add localStorage caching for fast startup (Google API responses only)
13. Test bidirectional sync: app→Google and Google→app

**PHASE 3: Projects Persistence** (2-3 days)
14. Create migration `002_create_projects_tables.sql`
15. Add Rust CRUD commands for projects/phases/milestones
16. Replace mock data in `ProjectsModule.tsx` with Tauri calls
17. Create `projectStore.tsx` for UI state management
18. Wire Dashboard and Context Panel to real project data

**PHASE 4: Notes & Chats Persistence** (2-3 days)
19. Create migration `003_create_notes_chats_tables.sql`
20. Add Rust commands for notes and chat history
21. Update NotesModule and ChatModule to persist data
22. Implement search functionality using SQLite FTS5

**PHASE 5: Mail & Calendar (Future)**
23. Implement backend polling for Gmail API (similar to tasks, localStorage cache only)
24. Implement backend polling for Google Calendar API
25. Reuse OAuth token manager from tasks sync service

**LEGACY TASKS** (lower priority, decoupled from backend refactor)
- Kanban drag/drop & ordering
- Context Panel rollout and Project Insights
- Command palette & global search
- Dashboard data wiring
- Documentation & tokens updates
- Testing & instrumentation
- Cleanup & follow-ups

#### Status – 2025-10-22 (Current State)

> **See also:**  
> - Executable tasks: `docs/implementation/backend-sync-refactor-tasks.json`  
> - Memory graph: Search "Backend-Heavy Architecture Pattern" in Factory AI  
> - Breaking changes: Update `CHANGELOG.md` when shipping

**Completed (Core Architecture)**
- ✅ Google Workspace provider card & shared settings store scaffolded (Settings → Accounts)
- ✅ OAuth PKCE flow working on desktop (loopback listener + token exchange)
- ✅ Calendar tasks rail consuming shared task list selector
- ✅ Task store with Zustand + normalized entities
- ✅ **Phase 1: SQLite Foundation** - sqlx + database initialization landed, migrations seeded (001–006 complete)
- ✅ **Phase 2: Tasks Backend Refactor** - Sync service owns polling/mutations; saga-based moves; conflict surfacing end-to-end
- ✅ **Queue worker**: `sync/queue_worker.rs` extracted and operational with retry logic, idempotency checks, conflict marking
- ✅ **Saga orchestration**: `sync/saga.rs` + `sync/saga_move.rs` provide distributed transaction pattern with resumable operations
- ✅ **Task list lifecycle**: Create/delete task lists with SQLite reconciliation; orphan cleanup; 60s polling cadence

**Deprecated (Frontend-Heavy Approach)**
- ❌ Frontend mutation queue with Immer → **ABANDONED** due to proxy revocation issues
- ❌ `googleTasksSyncService.ts` → **REMOVED** in Phase 2
- ❌ Complex frontend sync state management → **MOVED TO RUST BACKEND**

**Current Focus (Remaining Refactor Work)**
- 🔄 **Reconciler extraction**: Move polling/reconciliation logic from `sync_service.rs` (~1,500 LOC) into `sync/reconciler.rs` module
- 🔄 **Read-only store migration**: Remove remaining optimistic updates from `taskStore.tsx` (create/delete still optimistic; update already backend-first)
- ⏳ **Phase 3: Projects Persistence** - SQLite storage for projects/phases/milestones
- ⏳ **Phase 4: Notes & Chats** - Local-first persistence
- ⏳ **Testing**: Property tests (Rust) for normalization, CRUD, conflict paths; integration tests for queue worker, saga moves
- 🔄 **Canvas stabilization plan**: Track 1 (canonical geometry) & Track 2 (reactive bounds) are complete; Track 3 modularisation, Track 4 spatial indexing, and Track 5 command-pattern history are staged below.

#### Canvas Stabilization Plan · Progress Snapshot (2025-10-24)

| Step | Scope | Status | Notes |
|------|-------|--------|-------|
| **1. Canonical geometry alignment** | Anchor connector groups at canonical centres, convert child points to group-local coordinates, update `ElementSynchronizer` to write only via canonical geometry, integration test for marquee drag | ✅ Complete | Landed with Track 1 work; confirmed via mixed-selection drag tests. Any new renderer must now derive from canonical geometry schema. |
| **2. Reactive store & memoised bounds** | Expose `geometry.getElementBounds/getUnionBounds` selectors, remove renderer `selectBounds` caches, add metrics logging & throttle hooks | ✅ Complete | Implemented in Track 2; debugging hooks available at `window.__logGeometryMetrics()`. |
| **3. Selection stack modularisation** | Extract subscription, transformer, connector, and mindmap managers from `SelectionModule`; finish keyboard + shortcut regression tests; decide on lightweight event bus | 🔄 In progress | Subscription, transformer, and connector orchestrators are merged; mindmap orchestrator landed (2025-10-24). Remaining: tests for new managers, optional event bus shim, final teardown of legacy paths. |
| **4. Spatial indexing & offscreen culling** | Prototype quadtree/STR-tree, integrate with canonical bounds, defer reinserts until transform end, expose `queryVisible` API | ⏳ Pending | Dependent on completion of selection modularisation so index updates have a single entry point. |
| **5. Command-pattern snapshots & history** | Define command interface, capture canonical snapshots per interaction, expand undo/redo coverage | ⏳ Pending | Must consume the same canonical geometry used in Steps 1–3; planning doc to follow once modularisation stabilises. |

**Near-term canvas action items**
1. Finish Step 3 by covering the new managers with unit tests and deciding on the minimal event bus interface before removing legacy SelectionModule branches.
2. Draft the spatial index prototype (Step 4) using selector-driven bounds, ensuring drag/transform handlers defer reinserts until interaction end.
3. Outline the command-pattern history work (Step 5) so snapshot semantics align with the canonical geometry already in place.

##### Plan details & documentation links

- **Step 1 – Canonical geometry alignment (✅)**
	- **What shipped:** Connector groups now anchor to store-derived centres; endpoints render in group-local coordinates; `ElementSynchronizer` writes only via canonical geometry DTOs. Mixed marquee drag verified via test plan; automation `CanvasSelection.mixedMarqueeKeepsConnectorsInsideTransformer` scheduled for Track 3 test sweep.
	- **Documentation:** `docs/guidelines/CanvasRefactorPlan.md` (Track 1 section) + `docs/guidelines/Geometry.md` schema reference. Update both when adding new element types.
	- **Risks mitigated:** `Konva.Transformer` misalignment, connector drift, inaccurate `getClientRect()` during collab patches.

- **Step 2 – Reactive store & memoised bounds (✅)**
	- **What shipped:** Zustand selectors `geometry.getElementBounds` / `geometry.getUnionBounds` now expose memoised canonical bounds; renderers/selection flow no longer cache `selectBounds`; logging + throttle hooks (`geometryMetrics.log()`) available for heavy sync bursts.
	- **Documentation:** `docs/guidelines/CanvasRefactorPlan.md` (Track 2) with usage examples; instrumentation notes captured in `docs/guidelines/Geometry.md`.
	- **Guardrails:** Selectors are read-only; mutation paths remain isolated in synchronizers to avoid observer loops.

- **Step 3 – Selection stack modularisation (🔄)**
	- **Scope:** Finalise `ConnectorSelectionManager`, `SelectionSubscriptionManager`, `TransformerSelectionManager`, and `MindmapSelectionOrchestrator`; optional `SelectionEventBus` façade for inter-manager signals; retire legacy branches in `SelectionModule`.
	- **Todo:**
		1. Add **minimal** unit tests with fake store/stage fixtures per manager (cover keyboard shortcuts, connector drags, mindmap reroutes). Keep scope to high-risk flows so suite stays fast.
		2. Decide on lightweight event bus contract (likely typed emitter) before unhooking remaining inline callbacks.
		3. Update integration tests covering marquee multi-select, additive select, connector + node transforms.
	- **Deliverables:** Updated `components/modules/Canvas/runtime/features/renderer/selection/managers/README.md`, refreshed `docs/guidelines/CanvasRefactorPlan.md` Track 3 notes, passing test suite.
		- **Risks:** Temporary duplication between managers and legacy module—introduce feature flag `CANVAS_SELECTION_MANAGERS_V2` before removing legacy paths to control rollout.

- **Step 4 – Spatial indexing & offscreen culling (⏳)**
	- **Planning assumptions:** Canonical bounds available from Step 1+2; selection events centralised after Step 3.
	- **Proposed tasks:**
		* Prototype quadtree vs STR-tree with 5k element sample; baseline pan/zoom/drag metrics.
		* Implement `SpatialIndexService` in data layer with APIs `queryVisible(bounds)` and `queryRadius(point, radius)`.
		* Batch index updates until `dragend/transformend` events; rely on memoised bounds mid-interaction.
		* Wire render culling in `layers.ts` and `CanvasModule` to skip offscreen nodes.
		* Add stress tests + telemetry counters (`canvas.spatialIndex.rebuild_ms`).
	- **Documentation work:** Draft `docs/technical/canvas/SpatialIndexing.md` with architecture choices + tuning knobs once prototype selected.
	- **Risks:** High mutation cost during live transforms—mitigate with deferred reinserts and fallback to linear scan on threshold breach.

- **Step 5 – Command-pattern snapshots & history (⏳)**
	- **Objective:** Guarantee undo/redo correctness using canonical geometry snapshots shared with store + synchronizers.
	- **Planned execution:**
		1. Define command interfaces (`execute`, `undo`, optional `redo`) and history manager lifecycle (`push`, `coalesce`, `truncate`).
		2. Implement command types: `TransformCommand`, `ConnectorEndpointCommand`, `CreateElementCommand`, `DeleteElementCommand`.
		3. Snapshot canonical DTOs atomically; prefer structural sharing after correctness validated.
		4. Hook managers (Step 3) to emit commands; ensure history honours collaboration patches and mindmap orchestrator flows.
		5. Expand Jest + Playwright scenarios for complex sequences (drag, rotate, connector reroute, collab patch merge).
	- **Documentation:** Initial spec to live in `docs/guidelines/CanvasRefactorPlan.md` (Track 5) with cross-link to new `docs/technical/canvas/HistoryCommands.md` once authored.
	- **Risks:** Snapshot size growth—address via diff-based storage in follow-up milestone after baseline reliability proven.

#### Status – 2025-01-14

* ✅ SyncService now runs on a 60-second cadence, exposes `sync_now`, and persists Google Task list create/delete operations into SQLite.
* ✅ Backend reconciliation removes orphaned lists and reassigns or prunes tasks when Google deletes a list.
* ✅ Store-level wiring landed for `create_task_list`, `delete_task_list`, and `sync_tasks_now` in `taskStore` with optimistic updates.
* 🔄 UI still needs to call these store methods from `TasksModule` and `CalendarTasksRail` and surface errors.
* ✅ Manual “Sync now” affordance ships in the Tasks toolbar; cadence telemetry still pending.

**Immediate Next Steps**

Phase 1 foundation work is completed; remaining effort is focused on Phase 2 wiring and UI affordances.

1. **Backend list lifecycle wiring**
   - Wire `create_task_list`, `delete_task_list`, and `sync_tasks_now` through `taskStore`, `TasksModule`, and `CalendarTasksRail` with optimistic updates.
   - Refresh list order and badges after mutations; surface service errors gracefully in the UI.
   - Surface a manual “Sync now” control that invokes `sync_tasks_now` and verify the new 60s cadence metrics.
2. **Deletion safeguards**
   - Require reassignment selection (defaulting to Inbox/To Do) before list deletion and confirm the Rust fallback path.
   - Backfill manual checks ensuring tasks migrate or prune correctly when lists disappear upstream.
3. **Regression pass**
   - Re-run end-to-end Google Tasks sync to confirm list + task creation, updates, and deletions round-trip without regressions.

See detailed executable tasks document for complete implementation plan.

---

## 1. Global quick assistant (capture + tools + ask)

### Objectives

* Replace scattered “new” or “+” entry points with a single floating Quick Assistant accessible via button and hotkeys.
* Support **natural language** (no slash required) and **slash commands** for power users.
* Integrate selection-aware **writing tools** (tone, concise, expand, proofread, summarize, translate, explain, create list, extract key points) and previously scoped actions (task, note, event, summarize/translate selection).
* Provide a safe **Ask AI…** fallback when a request doesn’t match a predefined tool.

### Key deliverables

* Floating assistant launcher (bottom-right FAB) with tooltip and theming; `⌘/Ctrl+K` opens the dialog.
* Selection-aware modal: when users highlight text and press `⌘/Ctrl+K`, Assistant opens with a **tools grid** and can run transforms or accept an NL request.
* **Natural-language intent router** (see §11) that maps free text to the correct tool or creation flow with confidence gating.
* **Deterministic tool registry** (see §12) that builds compact, safe prompts and returns plain text.
* **Result pane** for transforms with **Replace selection** (primary), **Insert below**, and **Copy**.
* Adaptive primary CTA label: *Create task / Save note / Create event / Summarize / Translate / Capture* based on resolved intent.
* Context-aware routing that respects current project/folder scope when creating records, with post-submit handoff to Context Panel (§4 / §2A).

### Integration notes

* Reuse `QuickModal` primitives and existing quick-create modals; mount dialog high in the tree; trap focus; restore focus on close.
* Keyboard: `Enter` submits; `Shift+Enter` adds newline; `/` opens command list; arrow keys navigate the tools grid; `1–9` run the first nine tools (`aria-keyshortcuts`).
* Accessibility: `role="dialog"`, `aria-modal`, `aria-labelledby`; `aria-live="polite"` for success/errors.
* Instrumentation: `assistant.opened`, `assistant.intent_resolved` (intent, confidence, local/cloud), `assistant.executed`, `assistant.error`.

#### Status – 2025-10-10

* ✅ `QuickAssistantProvider` now lives in `components/assistant/quick/QuickAssistantProvider.tsx`, centralizing slash capture and wiring the quick modals across the app shell.
* ✅ Global hotkeys (`⌘/Ctrl+K`, `T`, `N`, `E`) are live; provider emits `assistant.opened|submitted|error` and `assistant.command_selected` events.
* ✅ Selection-aware dialog + writing tools (`WritingToolsGrid.tsx`) now execute via providers and apply Replace/Insert inline.
* ✅ Floating launcher FAB (sidebar) ships with tooltip + selection badge handoff.
* ⏳ **Ask AI fallback** + history still in backlog; track in `docs/assistant/Advanced-Assistant-Roadmap.md`.
* ⏳ **Natural-language intent router** (§11) and **deterministic tool registry** (§12) remain planned but not yet implemented.

---

## 2. Projects/spaces module (lightweight, opinionated)

### Objectives

* Introduce a tri-pane Projects module that centralizes all artifacts (tasks, notes, emails, chats, files, canvases) per project.
* Provide tabbed project views with an Overview focus and **remove duplication** between panes.

### Key deliverables

* New `ProjectsModule` leveraging `TriPane`, `PaneHeader`, and `PaneColumn` primitives.
* Left pane project navigator with search/pin support.
* Center pane tab system: **Overview, Tasks, Notes, Files, Events, Canvases, Chats, Emails**.
	* **Events tab added** (moved from right-pane “upcoming” to avoid duplication).
* Overview widgets: progress snapshot, upcoming **milestones** (not events), recent notes/emails, pinned chats, and primary **Add** button invoking the Assistant scoped to the project.
* **Right pane renamed to “Insights | Settings.”** See §2A for the Insights spec and drop-in component.
* Project-level filters piped into Tasks/Notes/Calendar stores.

### Integration notes

* Wire sidebar navigation to include the Projects module.
* Ensure current project context is available globally (assistant, insights, dashboard widgets).
* Do **not** show “Upcoming events” in the right pane for Projects; events live in the **Events** tab.

#### Status – 2025-10-09

* ✅ `components/modules/ProjectsModule.tsx` ships the tri-pane scaffold with router-backed tabs; the Events tab is present with a placeholder copy block.
* ✅ Overview/Tasks tabs integrate with quick assistant scope handoff and task board interactions using mock data.
* ✅ Right pane now renders the `ProjectInsightsPanel` (“Insights | Settings”) with the spec’d layout; data remains mock-driven.
* 🔄 Data adapters remain mock-driven; milestone and artifact hydration awaits real stores.

---

## 2A. Project Insights panel (Projects-only variant of Context Panel)

> **Purpose**
> Make the right pane an **assistive layer**: quick, actionable signal → one primary action → quiet related context. No lists duplicated from center tabs.

### Success state

* User grasps “what changed / what’s at risk / what’s stale” in <10s and has one obvious next step (*Add next step*).

### Anatomy (Insights tab)

1. Header: **Insights**, quiet “Updated {timestamp}”.
2. **Primary action:** “Add next step” → opens Assistant pre-scoped to the project.
3. Sections (in order):
	 * **AI insights** (at-risk milestone, slipping completion, stale work, suggested focus window).
	 * **Reminders & nudges** (review cadence, follow-ups).
	 * **Related items (compact 1-liners)** — recent cross-entity (Task, Note, Email, File, Chat).
	 * **Backlinks** (entities linking to this project).
4. Footer: optional “View activity” quiet link.

### Token map (no magic numbers)

* Container: `bg-[var(--bg-panel)]` `rounded-[var(--panel-radius)]` `shadow-[var(--settings-surface-elevation)]` `p-[var(--panel-pad-y)]` `px-[var(--panel-pad-x)]`.
* Stacks & rows: `gap-[var(--section-gap)]` / `gap-[var(--row-gap)]` / `min-h-[var(--row-min-h)]`.
* Dividers: `bg-[var(--border-divider)]`.
* Hovers: `hover:bg-[var(--hover-bg)]`.
* Type: `text-[var(--text-xs/sm/lg)]` with `--text-primary` / `--text-secondary`.
* Right edge: `border-left: var(--tripane-border)` (only if parent doesn’t supply).
* Primary CTA: uses standard `--primary*` and `--btn-*` tokens.

### States

* Loading (skeleton rows, `aria-live="polite"`), Empty (“Nothing to surface right now.”), Error (inline, Retry ghost).
* Per-section collapse (persist per project).

### Interactions

* **Add next step** → `onOpenAssistant(projectId)`; restore focus on close.
* Insight row: primary link + kebab (Snooze, Don’t show this type).
* Related rows: open target in current tab set and focus it.

### A11y

* Pane `role="complementary" aria-label="Project insights"`.
* Live updates `aria-live="polite"`.
* Buttons use `title` + `aria-keyshortcuts` (labels stay clean).

### Responsive

* Desktop: full-height scroll area; sticky section labels.
* ≤1024px: collapses to a sheet; trap focus; same order and tokens.

### Copy

* Section titles: “AI insights”, “Reminders”, “Related items”, “Backlinks”.
* Empty: “Nothing to surface right now.” Helper: “Insights update as things change.”
* Primary: “Add next step”.

### Instrumentation

* `insights.shown` (count, types), `insights.action_clicked` (type, targetId), `related.opened` (kind), `assistant.from_insights` (projectId).

### Drop-in component (TypeScript + Tailwind + shadcn)

```tsx
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, Lightbulb, Bell, Link as LinkIcon } from "lucide-react";

type Severity = "info" | "warn" | "danger" | "success";
type Insight = {
	id: string;
	title: string;
	detail?: string;
	severity?: Severity;
	cta?: { label: string; onClick: () => void; title?: string; ariaKeyshortcuts?: string };
};
type Reminder = {
	id: string;
	text: string;
	dueLabel?: string;
	onSnooze?: () => void;
	onDone?: () => void;
};
type RelatedKind = "task" | "note" | "email" | "file" | "chat" | "canvas";
type RelatedItem = { id: string; kind: RelatedKind; title: string; meta?: string; onOpen: () => void };

export interface ProjectInsightsPanelProps {
	projectId: string;
	loading?: boolean;
	lastUpdatedISO?: string;
	insights: Insight[];
	reminders: Reminder[];
	related: RelatedItem[];
	backlinks: { id: string; title: string; onOpen: () => void }[];
	onOpenAssistant: (projectId: string) => void;
}

export function ProjectInsightsPanel({
	projectId, loading, lastUpdatedISO,
	insights, reminders, related, backlinks,
	onOpenAssistant
}: ProjectInsightsPanelProps) {
	const updatedLabel = lastUpdatedISO ? new Date(lastUpdatedISO).toLocaleString() : undefined;

	return (
		<aside role="complementary" aria-label="Project insights" className="h-full overflow-auto hide-scrollbar" style={{ borderLeft: "var(--tripane-border)" }}>
			<div className="bg-[var(--bg-panel)] p-[var(--panel-pad-y)] px-[var(--panel-pad-x)]">
				<header className="flex items-center justify-between mb-[var(--space-4)]">
					<div className="flex flex-col">
						<h3 className="text-[color:var(--text-primary)] text-[length:var(--text-lg)] font-semibold">Insights</h3>
						{updatedLabel && <span className="text-[color:var(--text-secondary)] text-[length:var(--text-xs)]">Updated {updatedLabel}</span>}
					</div>
					<Button className="min-w-[var(--assistant-primary-min-w)]" onClick={() => onOpenAssistant(projectId)} title="Open assistant (⌘/Ctrl+K)" aria-keyshortcuts="Meta+K,Control+K">
						Add next step
					</Button>
				</header>

				<Section title="AI insights" icon={<Lightbulb className="size-[var(--icon-md)]" />}>
					<StackedList>
						{loading ? <SkeletonRows /> : (insights.slice(0, 4).map(i => (
							<Row key={i.id}>
								<div className="min-w-0">
									<div className="text-[color:var(--text-primary)] text-[length:var(--text-sm)] line-clamp-2">{i.title}</div>
									{i.detail && <div className="text-[color:var(--text-secondary)] text-[length:var(--text-xs)] line-clamp-2">{i.detail}</div>}
								</div>
								{i.cta && (
									<Button variant="ghost" className="shrink-0" onClick={i.cta.onClick} title={i.cta.title ?? i.cta.label} aria-keyshortcuts={i.cta.ariaKeyshortcuts}>
										{i.cta.label}
										<ChevronRight className="ml-[var(--space-1)] size-[var(--icon-sm)]" />
									</Button>
								)}
							</Row>
						)))}
						{!loading && insights.length === 0 && <EmptyHint text="Nothing to surface right now." />}
					</StackedList>
				</Section>

				<Separator className="my-[var(--space-6)] bg-[var(--border-divider)]" />

				<Section title="Reminders" icon={<Bell className="size-[var(--icon-md)]" />}>
					<StackedList>
						{loading ? <SkeletonRows /> : (reminders.slice(0, 3).map(r => (
							<Row key={r.id}>
								<div className="min-w-0">
									<div className="text-[color:var(--text-primary)] text-[length:var(--text-sm)] line-clamp-2">{r.text}</div>
									{r.dueLabel && <div className="text-[color:var(--text-secondary)] text-[length:var(--text-xs)]">{r.dueLabel}</div>}
								</div>
								<div className="flex items-center gap-[var(--space-2)]">
									{r.onSnooze && <Button variant="ghost" onClick={r.onSnooze}>Snooze</Button>}
									{r.onDone && <Button variant="ghost" onClick={r.onDone}>Done</Button>}
								</div>
							</Row>
						)))}
						{!loading && reminders.length === 0 && <EmptyHint text="No reminders." />}
					</StackedList>
				</Section>

				<Separator className="my-[var(--space-6)] bg-[var(--border-divider)]" />

				<Section title="Related items" icon={<LinkIcon className="size-[var(--icon-md)]" />}>
					<StackedList>
						{loading ? <SkeletonRows /> : (related.slice(0, 3).map(it => (
							<Row key={it.id} onClick={it.onOpen} role="button" tabIndex={0}>
								<span className="text-[color:var(--text-secondary)] text-[length:var(--text-xs)] mr-[var(--space-2)] capitalize">{it.kind}</span>
								<span className="min-w-0 text-[color:var(--text-primary)] text-[length:var(--text-sm)] line-clamp-1">{it.title}</span>
							</Row>
						)))}
						{!loading && related.length === 0 && <EmptyHint text="No recent related items." />}
					</StackedList>
				</Section>

				{backlinks.length > 0 && (
					<>
						<Separator className="my-[var(--space-6)] bg-[var(--border-divider)]" />
						<Section title="Backlinks">
							<StackedList>
								{backlinks.slice(0, 4).map(b => (
									<Row key={b.id} onClick={b.onOpen} role="button" tabIndex={0}>
										<span className="min-w-0 text-[color:var(--text-primary)] text-[length:var(--text-sm)] line-clamp-1">{b.title}</span>
									</Row>
								))}
							</StackedList>
						</Section>
					</>
				)}
			</div>
		</aside>
	);
}

/* — helpers — */

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
	return (
		<section className="flex flex-col gap-[var(--row-gap)]">
			<div className="flex items-center gap-[var(--space-2)]">
				{icon}
				<h4 className="text-[length:var(--text-sm)] text-[color:var(--text-secondary)] font-medium">{title}</h4>
			</div>
			{children}
		</section>
	);
}
function StackedList({ children }: { children: React.ReactNode }) { return <div className="flex flex-col">{children}</div>; }
function Row(props: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div {...props}
			className="group flex items-center justify-between gap-[var(--row-gap)] min-h-[var(--row-min-h)] rounded-[var(--radius-md)] px-[var(--space-3)] py-[var(--space-2)] hover:bg-[var(--hover-bg)] motion-safe:transition" />
	);
}
function EmptyHint({ text }: { text: string }) {
	return <div className="text-[color:var(--text-secondary)] text-[length:var(--text-sm)] italic py-[var(--space-2)]">{text}</div>;
}
function SkeletonRows() {
	return (
		<div aria-live="polite" className="animate-pulse space-y-[var(--space-2)]">
			{Array.from({ length: 3 }).map((_, i) => (
				<div key={i} className="h-[var(--row-min-h)] rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)]" />
			))}
		</div>
	);
}
```

### Integration notes

* Mount as the **Insights** tab for the right pane in Projects (tab switcher title: **Insights | Settings**).
* Use the same width and separators as the standard tri-pane; the component doesn’t fix width.
* Insights **never** shows an “Upcoming events” section for Projects (those live in the **Events** tab).
* Expose hooks to hydrate `insights`, `reminders`, `related`, `backlinks` from your stores/services.

#### Status – 2025-10-09

* ✅ `ProjectContextPanel.tsx` now mounts the Insights | Settings tabs and drops the duplicate Upcoming events list.
* ✅ `ProjectInsightsPanel` component ships in `components/modules/projects/ProjectInsightsPanel.tsx` with the annotated sections.
* 🔄 Insights content remains mock data; hook up real signals/backlinks and add persistence for section collapse + timestamps.

---

## 3. Dashboard (Today)

### Objectives

* Make the Dashboard the default home: surface today's agenda, triage, and top projects with **calm** presentation.

### Key deliverables

* **Three-zone header**: left *Today overview* title, **centered date**, and a **time + weather chip** on the right. No extra links.
* **Top row**: Next up (events), Urgent tasks, **Focus** (only when active/starting within 90 minutes).
* **Inbox**: three crisp items max; actions are quiet links (Open, File, Snooze); age/source in tertiary ink.
* **Projects**: three cards with uniform progress pill and one-line next step.
* **Signals**: up to three items; dotted links.
* **Recent activity**: hidden by default for single-user; show only if there were updates in last 24h.

### Integration notes

* Use sentence case on all card titles; quiet links use dotted underline; lists capped to three items (no inner scroll).
* Keep FAB bottom-right.
* Provide skeletons for async sources.

#### Status – 2025-10-09

* ✅ `components/modules/DashboardModule.tsx` implements the header, three-row caps, focus gating, and dotted quiet links per spec.
* ✅ Weather chip toggles night variants; inbox/projects/signals lists are trimmed to three + overflow indicator.
* ✅ Focus card hides unless active/starting ≤90m; remaining cards reuse shared primitives.
* 🔄 Data is still mock-driven; real stores and skeleton states remain to be wired before ship.

---

## 4. Context Panel 2.0 (shared) + Projects variant

### Objectives

* Establish a single, reusable context panel layout shared by Mail, Chat, Tasks, Notes, Projects, Dashboard widgets, etc., with a **Projects-only “Insights” variant** that prioritizes signals over lists.

### Key deliverables

* Shared `ContextPanel` with consistent header, tab switcher (**Context | Settings** by default).
* Fixed section order (default): Create link (chips), Related notes, Related tasks, Upcoming events, Threads/Chats, AI suggestions, Backlinks.
* **Projects override**: right-pane tabs labeled **Insights | Settings**. **Insights** replaces the default stack with the §2A component; **no Upcoming events** in this pane to avoid duplication with the Events tab.
* Reusable `ContextSection`, `ContextQuickActions`, and `ContextListItem` primitives.
* Backlink surfacing across modules.

### Integration notes

* Module adapters select default stack vs. the Projects Insights stack.
* Settings tab reuses the shared Settings panel primitives (toggles, rules, notifications).

#### Status – 2025-10-09

* ✅ Mail, Notes, and Projects panes already rely on shared tokens (`--panel-pad-x`, `--panel-pad-y`, `--panel-radius`).
* ✅ Shared `ContextPanel` primitives now live in `components/modules/context/ContextPanel.tsx`, exporting `ContextPanel`, `ContextSection`, `ContextQuickActions`, and `ContextListItem` via the module barrel.
* ✅ `MailRightPane` renders the shared panel with Context/Settings tabs plus assistant tips and related items sections.
* 🔄 Notes pane still uses bespoke markup; Tasks/Projects variants need to adopt shared primitives fully.
* ✅ Projects pane now swaps in the Insights variant from §2A (no duplicate Upcoming events).

---

## 5. Universal search / command palette (jump + create)

### Objectives

* Provide global navigation, cross-entity search, and NL creation.

### Key deliverables

* Modal overlay with prominent input, module filter chips, keyboard navigation, and type-grouped results.
* Adapters for Notes, Tasks, Emails, Events, Projects, Chats, Files.
* NL prefixes (`todo:`, `note:`, `event:`) and/or NL router hook to hand off to Assistant creation flows.

### Integration notes

* Bind to `⌘/Ctrl+K` when Assistant is closed; avoid conflicts; respect current scopes.

#### Status – 2025-10-22

* ✅ **Command palette component exists** at `components/extended/command-palette.tsx` with modal overlay and keyboard navigation primitives.
* ⏳ **Adapters pending**: Cross-entity search adapters for Notes/Tasks/Emails/Events/Projects/Chats/Files not yet wired.
* ⏳ **NL router integration**: Handoff to Assistant creation flows planned but not implemented.
* ⏳ **Global binding**: `⌘/Ctrl+K` conflict resolution with Assistant not yet implemented.

---

## 6. Tasks ↔ calendar tight coupling

### Objectives

* Sync task due dates with calendar events; enable scheduling via drag-and-drop and reciprocal updates.

### Key deliverables

* Calendar renders tasks with due dates/time blocks using shared event pill styling.
* Drag-and-drop: task → calendar (set window); event → task (adjust due date).
* Event detail CTA: "Create follow-up task" via QuickTaskModal.
* Focus block suggestions accessible via Assistant or Context Panel.

### Integration notes

* Audit Task/Calendar providers for shared selectors and mutation hooks; handle all-day, recurring, timezone shifts.

#### Status – 2025-10-22

* ⏳ **Planned feature**: Tasks ↔ calendar integration not yet implemented.
* ⏳ **Calendar rendering of tasks**: Not yet wired.
* ⏳ **Drag-and-drop**: Task/event mutations not yet implemented.
* ⏳ **Follow-up task CTA**: Not yet present in event details.

---

## 7. Notes "Keep" view + web clipper

### Objectives

* Provide a visual grid for pinned/quick notes and a lightweight clipping flow for URLs and media.

### Key deliverables

* Masonry/grid layout for pinned and clip-tagged notes; card styling with thumbnail, tag chips, pin indicators.
* "Add from URL" affordance creating notes with metadata; optional clipboard detection.

### Integration notes

* Reuse existing note model, pinning logic, and card primitives; prep extension handoff with simple clipping endpoints/IPC.

#### Status – 2025-10-22

* ⏳ **Planned feature**: Notes grid/Keep view and web clipper not yet implemented.

---

## 8. Lightweight linking / backlinks

### Objectives

* Bi-directional links between entities to build a lightweight knowledge graph.

### Key deliverables

* Parser enhancements to detect `[[Entity Name]]` and autocomplete after `[[`.
* "Attach to…" picker for explicit linking; persistence + automatic backlinks.
* Context Panel surfaces backlinks.

### Integration notes

* Minimal shared linking service for create/lookup/hydration; handle unresolved links gracefully.

#### Status – 2025-10-22

* ⏳ **Planned feature**: Bi-directional linking and backlinks not yet implemented.

---

## 9. Starter automations (recipes + slash-commands)

### Objectives

* Reduce repetitive work with simple automations.

### Key deliverables

* Watchers (new email, tag change) → task/note creation recipes.
* Rule UI (templated toggles; future builder) in Settings.
* Slash-commands in chat (`/summarize`, `/plan`, `/task`, `/note`, `/email`, `/focus`) that reuse Assistant flows.

### Integration notes

* Automations call the same creation handlers as the Assistant; provide logging/activity entries for generated artifacts.

#### Status – 2025-10-22

* ⏳ **Planned feature**: Automation watchers, rule UI, and slash-commands in chat not yet implemented.
* 📝 **Note**: QuickAssistantProvider supports slash-commands (`/task`, `/note`, `/event`) but chat-specific commands pending.

---

## 10. Design system polish & unification pass

### Objectives

* Enforce design tokens, spacing, type scale, and component variants across new and legacy surfaces.

### Key deliverables

* Token enforcement (spacing, color, radius, typography) using `globals.css` + Tailwind tokens.
* Replace ad-hoc styles with UI kit primitives (buttons, tabs, toggles, cards, lists).
* Consistent focus, hover, `motion-safe` transitions.
* Updated README/MDX snippets documenting patterns.

### Integration notes

* Pair with accessibility QA: contrast, focus order, keyboard navigation.

#### Status – 2025-10-22

* ✅ **Token enforcement complete**: `globals.css` defines comprehensive design tokens (spacing, color, radius, typography); applied across Dashboard, Settings, Mail, Notes, Tasks, Projects modules.
* ✅ **Shared primitives**: UI kit components (buttons, tabs, toggles, cards, lists) reused consistently; ad-hoc styles mostly eliminated.
* ✅ **Motion-safe transitions**: All animations gated behind `motion-safe:` Tailwind variant.
* 🔄 **Documentation**: Token reference at `docs/technical/design-tokens-reference.md` exists; component MDX snippets partially updated.

---

## 11. Natural-language intent router (NL → intent → action)

### Purpose

Turn arbitrary text into a **strict, validated intent** that deterministic code executes. The LLM classifies; code validates and enriches.

### Intent schema (initial)

* `task.create` — title, due (ISO), notes, priority
* `note.create` — body
* `event.create` — title, start/end (ISO), location
* `summarize.selection` — bullets
* `translate.selection` — target_lang, tone (informal/polite/neutral)

### Mechanics

* **LLM classification** (local 7–8B by default). Output **strict JSON only**.
* **Validation** via Zod; **enrichers** normalize dates (chrono/luxon), language codes, bullet counts; apply timezone.
* **Confidence gate** (<0.6 prompts a compact disambiguation UI); selection-required intents block with a clear inline message.
* **Provider routing**: classification local; heavy summarize/translate may use the user's configured cloud provider; show a tiny "Using OpenAI • Change" label when cloud is used.
* **Instrumentation** as listed in §1.

#### Status – 2025-10-22

* ⏳ **Planned feature**: Natural-language intent classification, validation, and enrichment pipeline not yet implemented.
* 📝 **Current approach**: QuickAssistantProvider uses simple regex-based slash-command parsing; no LLM classification.

---

## 12. Writing tools registry (selection transforms)

### Tools (all selection-based)

* **Professional tone**, **Friendly tone**, **Make concise**, **Expand**, **Proofread**, **Summarize** (N bullets), **Translate…** (lang + tone), **Explain**, **Create list**, **Extract key points**.

### Behavior

* Assistant shows a **tools grid** when a selection exists and input is empty.
* NL like "make this friendlier", "translate to German (informal)", "extract key points" routes to the corresponding tool; unmatched → **Ask AI** with the selection as context.
* Results render in a **draft pane** with Replace/Insert/Copy actions; dismissing restores focus.

#### Status – 2025-10-22

* ✅ **Writing tools grid implemented**: `WritingToolsGrid.tsx` component exists and is integrated into QuickAssistantProvider.
* ⏳ **NL routing to tools**: Natural-language routing (e.g., "make this friendlier" → Professional tone tool) not yet implemented; users must select tools manually from grid.
* ⏳ **Ask AI fallback**: Unmatched requests don't yet fall back to open-ended AI; planned for future release.

---

## 13. Tokens added/confirmed (dashboard + assistant + insights)

**General**

* Spacing: `--space-1/2/3/4/5/6/8`
* Radii: `--radius-sm/md/lg`, `--panel-radius`
* Type: `--text-xs`, `--text-sm`, `--text-md`, `--text-lg`, `--text-primary`, `--text-secondary`
* Icons: `--icon-sm`, `--icon-md`
* Borders/elevation: `--border-subtle`, `--border-divider`, `--settings-surface-elevation`, `--tripane-border`

**Dashboard**

* `--dash-header-py`, `--dash-title-size`, `--dash-header-gap`
* Cards: `--card-pad`, `--row-pad`, `--dash-gap`

**Chips**

* `--chip-bg`, `--chip-border`, `--chip-radius`, `--chip-pad-y`, `--chip-pad-x`

**Assistant**

* `--modal-max-w: 640px`, `--elevation-lg`, `--assistant-primary-min-w`

**Insights (new)**

* Panel: `--bg-panel`, `--bg-surface-elevated`, `--hover-bg`
* Layout: `--panel-pad-x`, `--panel-pad-y`, `--section-gap`, `--row-gap`, `--row-min-h`
* Tripane: `--tripane-right-width` (layout-level; not set in component)

#### Status – 2025-10-09

* ✅ All required tokens already exist in `styles/globals.css`; Insights-specific values were added during the dashboard polish pass.
* 🔄 Document cross-links (e.g., `docs/technical/design-tokens.md`) still need the Insights row to call out the new usage explicitly.

---

## 14. Accessibility & keyboard

* Dialogs: focus trap, `aria-modal`, labelled titles, `Esc` closes and restores focus.
* Keyboard parity for the Assistant (slash list, tools grid, submit); dotted quiet links advertise shortcuts via `title` + `aria-keyshortcuts`.
* Insights panel: tab order top→bottom; `Enter` opens the row’s primary action; insights refresh announce via `aria-live="polite"`.
* Reduce motion: all animation behind `motion-safe:` with non-animated fallback states.

---

## 15. Risks & mitigations

* **Signal fatigue / duplication** → Projects pane shows **Insights** (signals, nudges, backlinks); **lists stay in center tabs** (e.g., Events tab). Strict de-dupe checks.
* **LLM misclassification** → confidence gate + preview line; default to non-destructive capture.
* **Ambiguous dates** → deterministic enrichers and user locale/timezone; morning/afternoon heuristics (configurable).
* **Privacy** → local classification; size thresholds before sending selection to cloud; explicit provider label when cloud used.
* **Scope leaks** → assistant receives current project/folder scope; creation handlers require scope explicitly.

---

## 16. Rollout & sequencing (two weeks)

1. **Assistant MVP** – launcher, hotkeys, selection, NL router (task/note/event + Ask AI fallback).
2. **Dashboard refresh** – header three-zone layout; top-row cards; Inbox/Projects/Signals 3-row caps; optional Focus.
3. **Projects foundations** – tri-pane layout, tabs (**incl. Events**), scoped Assistant.
4. **Context Panel 2.0** – shared component + **Projects Insights** variant with backlinks.
5. **Command palette** – adapters and create-from-query handoff to Assistant.
6. **Tasks ↔ calendar** – render tasks in calendar; drag/drop; follow-up flows.
7. **Notes keep view + clipper** – grid, URL capture.
8. **Linking/backlinks** – parser + attach UI + persistence.
9. **Starter automations** – watchers, slash-commands.
10. **Design polish** – token sweep + accessibility QA.

**Milestone exit criteria**: demo recording, updated docs/MDX, `npm run type-check`, smoke tests in web + Tauri shells.

---

### Quick QA checklist (Insights pane)

* Visual: aligns to tokens; one primary button; calm ink hierarchy.
* Interaction: no dead ends; section collapse persists; related items open in center tabs.
* Keyboard: tab order, `Enter` behavior, focus restore on Assistant close.
* A11y: roles/labels/states set; insights refresh announced.
* Motion: `motion-safe` only.
* Responsive: sheet fallback verified ≤1024px.
* No magic numbers; tokens included above.
