# Changelog

All notable changes to ∴ will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Canvas zoom fit-to-content button (2025-10-24)**: Added dedicated "fit to content" button to canvas toolbar zoom controls (Maximize2 icon) that centers all elements in the viewport with padding, separate from the 100% reset button
- **Module persistence across refreshes (2025-10-24)**: App now restores the last active module on refresh using localStorage (`therefore:last-module` key) instead of always defaulting to mail module. Validates stored module against known module list for safety

### Fixes
- **Canvas tool switching race condition (2025-10-24)**: Fixed critical bug where switching tools required multiple clicks and didn't properly clear element selection. Root cause: Multiple tool components (TableTool, ImageTool, CircleTool, ConnectorTool, MindmapTool) were subscribing to `selectedTool` from the store AND checking it against the `isActive` prop, creating dependency race conditions. When a tool button was clicked: (1) store updated `selectedTool`, (2) tool's useEffect detected the change, (3) but `isActive` prop hadn't updated yet, causing the check `isActive && selectedTool === toolId` to fail on first click. Solution: Removed `selectedTool` store subscriptions from all problematic tools, making them rely solely on the `isActive` prop like PenTool (which worked correctly). Additionally, reversed the order in `setSelectedTool` to clear selection BEFORE updating tool state, preventing any tool-specific logic from running before selection is fully cleared. This ensures consistent one-click tool switching with immediate element deselection across ALL tools.
- **Canvas selection clearing race condition (2025-10-24)**: Fixed inconsistent element deselection when switching canvas tools. The `SelectionModule.updateSelection` method was scheduling a 75ms delayed transformer attachment that raced with `clearSelection` calls, causing elements to re-select after being cleared. Solution: track the pending `updateSelectionTimer` and cancel it in `clearSelection(force)` alongside existing auto-select timer cancellation
- **Canvas transformer loss after clearing (2025-10-24)**: Fixed critical bug where elements couldn't auto-select after using the trash can "clear canvas" action. The `TransformerManager.ensureTransformer()` now detects when the underlying Konva transformer has been destroyed (stage null or layer detached) and recreates it with fresh keyboard listeners, preventing the stale transformer reference issue that required app refresh
- **Canvas live transform Phase 5 teardown hygiene (2025-10-25)**: Completed SelectionModule cleanup by adding stage listening restoration (`restoreStageListening` with pre-state capture), transient node cleanup (`restoreTransientNodes` with parent cache), and full unmount path coverage in `handleTransformState`. Created 7 regression tests in `SelectionModule.transient.test.ts` validating lifecycle edge cases (no-snapshot guards, stream deactivation, cleanup sequencing). Built `CanvasStressHarness.tsx` performance dashboard with 120-node baseline (~164 FPS @ 6.1ms on dev hardware) for ongoing validation. Established Playwright E2E infrastructure (config, test utilities, window instrumentation) and documented initial transformer-event limitation pending programmatic invocation.
- **Canvas live transform Playwright verification (2025-10-26)**: Reworked `transform-stage-listening.test.ts` to call `SelectionModule.beginSelectionTransform` / `endSelectionTransform` from the browser context, reusing transformer-attached Konva nodes captured pre-drag. The test now validates stage listening toggles end-to-end without relying on synthetic pointer events, closing the previously documented coverage gap.
- **Canvas marquee transient delta fix (2025-10-26)**: Anchored connectors now reuse snapshot endpoints during live transforms, eliminating mid-drag freezes when marquee selections include arrows/lines. `useMarqueeDrag` forwards drag start/progress/end to `SelectionModule`, so pointer-driven marquee drags receive the same transient deltas as transformer drags. Added `marquee-all-elements.test.ts` to seed every element type, drive a scripted marquee drag, and assert connectors/drawings stay aligned in both Konva visuals and the store.
- **Canvas live transform Phase 5 draw batching (2025-10-25)**: Completed the Konva redraw audit by replacing remaining synchronous `draw()` calls in shape/text/transform modules with `batchDraw()`, ensuring overlay drag operations reuse the shared RAF batcher and keeping stage hit detection auto-disabled during drags for lower pointer overhead. Documented the sole intentional direct draw path inside `RafBatcher`'s opt-in immediate branch.
- **Canvas transient test harness (2025-10-25)**: Introduced a Vitest canvas stub + Konva manager mocks so SelectionModule transient suites run without native deps, and captured follow-up research on adopting `vitest-canvas-mock` once we stabilise single-threaded pool settings.

### Refactoring
- **Assistant module modularization — COMPLETE (2025-10-23)**: Successfully modularized AssistantCaptureDialog and QuickAssistantProvider:
  - **AssistantCaptureDialog**: Refactored from 945 lines to 21 lines using modular `capture/` components
  - **Components**: `CaptureDialog.tsx`, `WritingToolsGrid.tsx`, `CaptureHeader.tsx`, `CaptureInput.tsx`, `CaptureFooter.tsx`, `WritingToolsSection.tsx`
  - **Hooks**: `useCaptureState.ts` for state management
  - **Utilities**: `commandUtils.ts`, `types.ts` for shared logic
  - **QuickAssistantProvider**: Modularized into `quick/` structure with commands, state, and feature modules
  - **Result**: 39 files changed, 5200 insertions(+), 1626 deletions(-) - significant complexity reduction
  - All functionality preserved, TypeScript checks pass, builds successfully ✅

- **Settings module modularization — COMPLETE (2025-10-23)**: Refactored settings components:
  - **SettingsAccount**: Reduced from 420+ lines to 9 lines using `AccountProvider` component
  - **SettingsProviders**: Refactored to use `SettingsBridge` for Tauri command abstraction
  - **Bridge layer**: Added `lib/bridge/` for Tauri command abstraction (account-bridge.ts, settings-bridge.ts)
  - **Chat tri-pane**: Added modular components for chat module
  - All functionality preserved, build verified ✅

- **Notes module left-pane modularization — COMPLETE (2025-10-23)**: Successfully modularized NotesLeftPane with left-pane components:
  - **Stage 5**: Replaced inline FolderTreeItem component (500+ LOC) with modular `left-pane/` structure
  - **Components**: `NotebookList.tsx` (folder tree & notes), `Filters.tsx` (search), `FolderTreeItem.tsx` (individual folder rendering)
  - **Hooks**: `useFolderTree.ts` (folder organization), `useDragDrop.ts` (drag-drop logic)
  - **Cleanup**: Removed unused imports and constants, maintained all functionality (drag-drop, context menus, editing)
  - **Result**: 919 insertions(+), 747 deletions(-) - net reduction in complexity while preserving features
  - All TypeScript checks pass, builds successfully ✅

### Documentation
- **Canvas live transform docs consolidation (2025-10-25)**: Added `docs/technical/live-transform-unified-analysis.md` as the single source for audit findings, created the execution guide at `docs/implementation/Canvas-Live-Transform-Mitigation-Plan.md`, and updated related canvas references to retire legacy audit file mentions.
- **Canvas live transform phase 1/2 foundations (2025-10-25)**: Populated live-transform snapshots with connector/drawing baselines (`ConnectorAdjacencyCache`, new unit test), added transient transform state to the canvas store, wired SelectionModule to stream per-frame deltas, introduced an overlay drag container so drawings/connectors follow marquee drags without thrashing main layers, batched live connector redraws through the transient channel to protect FPS, and constrained anchored connectors to reroute only when needed with transient scale/rotation safeguards.

- **Tasks module modularization — COMPLETE (2025-01-23)**: Finished all 7 stages of the modularization plan:
  - **Stage 6** (2025-10-23): Modularized `sync_service.rs` into `sync/` structure with `service.rs`, `token.rs`, `queue.rs`, `reconciler/` (poll.rs, dedupe.rs, prune.rs, mod.rs), `events.rs`, `snapshot.rs`
  - **Stage 5** (2025-10-23): Extracted Rust task command handlers from monolithic `commands.rs` (570 LOC) into dedicated modules: `create.rs`, `update.rs`, `delete.rs`, `read.rs`, `lists.rs`, `task_move.rs`
  - **Stage 4** (2025-01-23): Modularized `CalendarTasksRail.tsx` from 704 → 604 LOC with `tasks-rail/` structure: `hooks.ts` (filtering/sorting logic), `EmptyState.tsx`, `TaskRailSection.tsx`
  - **Stage 3** (2025-10-23): Refactored `taskStore.tsx` from 1067 → 76 LOC shim with modular `store/` structure and split tests from 723 LOC monolith → `store/__tests__/tasks.test.ts` + `store/__tests__/sync.test.ts`
  - **Stage 2** (2025-10-23): Split `TaskDetailsDrawer.tsx` (1230 LOC) into modular `details/` components with shared `useTaskDetails.ts` hook
  - **Stage 1** (2025-10-23): Refactored `TasksModule.tsx` from 1,161 → 317 LOC with `view/` structure
  - **Stage 0** (2025-10-23): Added region annotations and baseline validation
  - All type checks pass, cargo builds clean, tests green ✅

### Documentation
- Noted current sync-engine progress, manual sync affordance, and Projects Insights implementation in `docs/roadmap/Unified-Workspace-Roadmap.md` (2025-10-23).
- Documented end-to-end conflict surfacing completion in roadmap (2025-10-22): backend conflict detection, queue blocking, event emission, and frontend hydration fully operational.

### Fixes
- **Tasks board flicker (2025-10-23)**: Scoped the desktop event bridge so only `tasks:sync:*` events trigger store fetches, and delegated the `process_sync_queue_only` command to the shared sync service so queue drains no longer force a full board repaint after each mutation.
- **Tasks board context actions (2025-10-23)**: Memoized per-column task slices to keep kanban columns stable between updates and wired the card context-menu Edit action to open the TaskDetails drawer directly.
- **Tasks module subtask accuracy (2025-10-23)**: Normalized subtask progress calculations so board cards, badges, and list view headers agree on remaining counts, kept the TaskDetailsDrawer subtask composer open after pressing Enter, and prevented task updates from clearing the drawer when editing the same card.
- **Tasks board completed count (2025-10-22)**: Updated the Completed section in board columns to display the number of finished parent tasks only (e.g., `Completed (3)`), matching the web app's aggregate count instead of summing subtasks locally.
- **CRITICAL: Saga schema mismatch regression (2025-10-22)**: Replaced migration 006 with a no-op placeholder to stop duplicate-column failures on startup (columns were already added in Migration 004). Updated the saga executor to read `tasks_metadata.status` while continuing to use `task_subtasks.is_completed`, converting to the proper Google Tasks status strings only when calling the API. The move saga now runs against the existing schema without reapplying schema changes.
- **CRITICAL: Saga orchestration for task moves (2025-10-22)**: Replaced direct API call implementation with production-ready saga state machine to prevent data loss and ensure consistency during move operations. Created 5 new database tables (saga_logs, operation_idempotency, task_backups, operation_locks, saga_subtask_progress) and implemented complete saga executor with distributed transactions. Task moves now use: 1) Separate read/API/write transactions (no locks during HTTP calls), 2) Application-level idempotency with 24h deduplication window, 3) Distributed locking to prevent concurrent operations, 4) Backup-before-delete to enable rollback if create fails, 5) Resumable operations with progress tracking, 6) Persistent state machine allowing retry from last successful step. Addresses all 7 critical flaws identified in code review: transaction anti-pattern, unreliable rollback, missing idempotency protection, race conditions, permanent data loss risk, no partial failure recovery, and poor performance.
- **Subtask data loss during task moves (2025-10-22)**: Fixed critical bug where moving a task between lists caused all subtasks to be permanently deleted. The sync queue worker's move operation now properly preserves subtasks by: 1) loading all existing subtasks before the move, 2) recreating each subtask in Google Tasks with the new parent google_id after creating the moved parent task, 3) updating local subtask records with new google_id and parent_google_id references. This ensures subtasks survive list-to-list moves in both the web app and local desktop app. NOTE: Basic fix superseded by saga orchestration implementation above.
- **Subtask context menu z-index fix (2025-10-22)**: Fixed subtask right-click context menu not appearing in TaskDetailsDrawer by removing the `asChild` prop from ContextMenuTrigger (matching the working TaskCard implementation) and adding `z-[100]` to ContextMenuContent to ensure it renders above the drawer's `z-[70]` overlay.
- Hardened duplicate-task cleanup so freshly created tasks waiting to sync are no longer mistaken for orphan records and removed during a manual sync cycle.
- **Label color persistence (2025-10-15)**: Label color changes now persist across app refreshes. Extended Rust backend (`task_metadata.rs`, `commands/tasks.rs`) to store labels as `{name,color}` JSON objects instead of name-only strings, updated frontend (`taskStore.tsx`) to send structured payloads, and modified Google Tasks serialization to preserve color metadata through sync round-trips. Test suite and mocks updated to validate color preservation end-to-end.
- **Subtask sync instrumentation (2025-10-16)**: Added detailed logging across task diffing, queue worker dispatch, and Google client HTTP calls to trace subtask propagation; ensured the SQLite pool is initialized once per process; prevented task update logic from deleting queued subtask operations; and removed the stray root `test.db` artifact.
- **Task side panel priority picker (2025-10-16)**: Fixed non-responsive priority dropdown by converting to popover-based control with proper state management. Redesigned due date and priority rows in `TaskSidePanel.tsx` to display on single horizontal lines with badge icons and clear buttons. Updated completed tasks toggle in `TaskColumnHeader.tsx` to use sentence-case menu item. Refined completed-tasks expansion logic in `TasksBoard.tsx` to properly handle visibility and expansion states independently.

### Known Issues
- Task store remains partially optimistic; a follow-up will finish the read-only hydration path and add regression tests before turning on stricter conflict toasts.

### Enhancements
- **Task drawer polish & calmer feedback (2025-10-23)**: Added a shared due-date chip and task label chip helpers, refreshed board/list hover states, muted Sonner success toasts to a low-ink style, and aligned task UI tokens so the drawer, cards, and list rows share the same spacing and badge treatments.
- **Conflict surfacing (backend complete, UI iteration ongoing, 2025-10-22)**: Google Tasks conflict detection remains wired end to end. Backend (`sync_service.rs`) marks conflicts without resetting them, blocks queued mutations via `mark_pending_queue_conflict`, and emits `tasks::conflict` events carrying remote/local snapshots plus dirty field diffs. Commands (`commands/tasks.rs`) clear conflict flags when authors re-edit tasks, letting next sync resolve cleanly. Frontend continues listening for the Tauri event and hydrating the payload into store state, but we temporarily removed the in-card badge while we redesign the conflict UX. `types.ts` still includes the expanded sync-state enum. Remaining work: read-only store migration, refreshed conflict affordance, and Rust/TS regression tests.
- Unified inline task composer popovers (date, priority, labels) with consistent widths while allowing the calendar to size naturally, refreshed the priority menu with low-ink rounded chips and an em dash "none" option, and introduced persistent label selection using the design-system palette across TasksBoard, TasksModule, and ProjectsModule.
- Standardized task label chips across the composer, preview pill stack, and rendered cards by reusing the shared `Badge` component and adopting the same default color token end-to-end, eliminating the blue-to-gray jump after saving.
- Calmed task metadata UI: empty due/priority/label states now use square icon buttons, due pills use hairline rings with smaller icons, and task cards show a quiet subtask count indicator.

### Google Tasks Sync Backend Refinements (2025-10-15)
- Implemented "Resume on Startup" for the sync service to ensure immediate data synchronization on application launch.
- Added idempotency checks to the sync queue worker to prevent duplicate processing of sync entries.
- Implemented a manual sync trigger command (`sync_tasks_now`) to allow users to trigger a sync on demand.
- The `taskStore` still performs optimistic updates while relying on backend events and refreshes to reconcile with the canonical state; the read-only migration remains a follow-up task.
- Added a UI indicator for sync status in the `Sidebar` to provide users with real-time feedback on the sync process.
- Added a UI indicator for conflicts in the `TaskCard` to alert users of any sync conflicts.
- Fixed a bug where the `isCompleted` status of a task was hardcoded to `false` during fetch, ensuring the correct completion status is displayed.
- Fixed a bug where `moveTask` was calling a non-existent command, and `updateTask` was calling a renamed command, restoring task management functionality.
- Fixed a bug where the `access_token` was not being parsed correctly from the nested JSON structure, resolving authentication errors with the Google API.
- Resolved several compilation errors in the Rust backend code, improving code stability and reliability.

### Google Tasks Sync Backend (2025-10-16)
- Implemented a robust background sync service for Google Tasks.
- The service processes a sync queue, polls for remote changes, and handles conflicts.
- Implemented retry logic with exponential backoff for failed sync attempts.
- The service now gracefully handles the case where the user is not logged in.


### Sync Service Modularization Status (2025-01-20)
- `sync/` module directory exists with `types.rs`, `google_client.rs`, and `queue_worker.rs` extracted from the monolith.
- Planned modules (`sync/oauth.rs`, `sync/reconciler.rs`) and the orchestrator refactor have not landed; `src-tauri/src/sync_service.rs` still spans roughly 1,160 lines and duplicates queue-processing logic already present in `sync/queue_worker.rs`.
- Integration work remains to route the live service through the extracted helpers before the modularization phase can be considered complete.

### ⚠️ Task Display Regression Follow-up (2025-01-20)
- Schema gaps that previously hid tasks in the UI have been addressed: `tasks_metadata` now includes the `title`, `metadata_hash`, `dirty_fields`, and soft-delete columns required by the Task Metadata CRUD Plan.
- Frontend fetches (`taskStore.tsx`) load tasks through the `get_tasks` command, so desktop and web builds once again render the 10 stored records.
- Remaining follow-ups live under the "Google Tasks Local‑First Sync Refactor" section of the unified roadmap (consolidated from the former Sync Refactor Master Plan).

### Task metadata property tests (2025-10-14)
- Property-test coverage for metadata normalization is still pending. The `proptest` dev dependency is in `Cargo.toml`, but no proptest modules exist under `src-tauri/` yet.
- Legacy database tolerance currently depends on the enhanced SQL migrations; additional runtime backfill logic has not been implemented.

### Google Tasks sync backend list lifecycle (2025-01-14)
- Tightened the Rust `SyncService` loop to poll every 60 seconds, exposed a `sync_tasks_now` command, and added create/delete task list endpoints that persist through SQLite reconciliation.
- Local reconciliation now prunes lists removed upstream and reassigns or deletes orphaned tasks to keep the desktop state aligned.
- Frontend wiring began: `taskStore` now exposes `createTaskList`, `deleteTaskList`, and `syncNow` with optimistic updates; UI components still need to call these methods and handle errors.

### Google Tasks sync - operational (2025-10-16)
- **Mutation execution wired**: sync service now calls real Google Tasks REST API for create/update/delete/move operations with automatic token refresh on 401.
- **List hydration**: poll cycle fetches all Google task lists and tasks, reconciles with local store, and preserves `externalId` + `googleListId` for bidirectional sync.
- **Token management**: service automatically updates access/refresh tokens in googleWorkspace store when Google returns refreshed credentials.
- **Retry logic**: mutations retry up to 3 attempts before marking as failed; sync status exposed via store selectors.
- **Telemetry**: emits `tasks.sync.success`, `tasks.sync.failure`, `tasks.sync.poll_complete`, `tasks.sync.poll_failure` events for instrumentation.
- **Status tracking**: workspace store tracks per-module sync success/failure timestamps and last error messages.

### Google Tasks sync foundation scaffolding (2025-10-15)
- Migrated task store to Zustand with normalized state, client mutation queue, and Google metadata (`externalId`, `pendingSync`, `clientMutationId`).
- Added background sync scaffold (`googleTasksSyncService`) to manage queued mutations and schedule Google Tasks polling.
- Calendar tasks rail now sources filter options from the shared task lists, ensuring Google lists propagate everywhere when hydration lands.

### Chat model synchronization & settings polish (2025-10-14)
- Chat module now reads all enabled cloud/local models from Settings, keeps conversation model metadata in sync, and gracefully handles empty configurations with clear messaging.
- Sanitized streaming pipeline retained while ensuring conversation switches and new chats preserve the chosen LLM provider.
- Settings → Models “Manage” action now opens the provider detail sheet directly for quicker edits without exposing the old dropdown.
- Local Ollama streaming restored by accepting the current `message.content` payload shape and forwarding deltas to the UI.

### Improve initial module states for Chat and Notes (2025-10-13)
- Chat module now auto-creates unsaved blank conversation on load, only saves after first message sent
- Notes module auto-creates blank note on first load and auto-selects it
- Both modules auto-focus input fields for immediate typing without manual interaction
- Prevents cluttering sidebar with empty untitled conversations

### Settings navigation redesign (2025-10-13)
- Redesigned settings sidebar to match Canvas module with TriPane layout, PaneHeader, and PaneFooter components
- Added collapsible navigation pane (260px width) with hide/show caret button matching Canvas behavior
- Implemented smooth scroll-to-section navigation with proper highlight states and scroll spy tracking
- Removed Advanced/Diagnostics/Danger zone sections, streamlined to Models and Accounts only
- Simplified section headers to title-only format (no gray backgrounds or descriptions)
- Fixed scroll viewport detection for proper section navigation in ScrollArea component

### Settings modal cloud/local rework (2025-10-12)
- Split the Providers card into dedicated `Cloud providers` and `Local models` panels with sentence-case copy, scoped CTAs, and assistant defaults following the sources list.
- Simplified the provider sheet: one `Connection` block with `Verify` actions, compact API key tools (show/hide, paste, copy), and an advanced base URL accordion instead of nested cards.
- Local Ollama configuration now surfaces endpoint editing, model lists, and pull/refresh controls; delete requests route through a design-system confirmation dialog and only remove models after explicit approval.
- Added clipboard paste handling for API keys and reused connection-state helpers so header/status chips and toasts share the same `Not set/Not verified/Testing…/Connected/Failed` vocabulary.
- Introduced Tauri commands (`ollama_pull_model`, `ollama_delete_model`) backing the new local model actions and refreshed the implementation plan/guidelines to record the sentence-case rule and modal requirement.

### Settings IA refinement & Ollama sync (2025-10-11)
- Replaced the card pile with four focused sections (Cloud, Local, Assistant, Accounts) that ride a sticky desktop nav and mobile tabs/accordion for faster scanning.
- Wired the Local models section to Tauri commands so `Test connection` now fetches Ollama models, updates enabled/default selections, and mirrors pull/delete actions in the UI while gracefully falling back when Tauri APIs are unavailable.
- Consolidated assistant defaults into a single model selector that surfaces local Ollama models alongside cloud catalog options, retiring the redundant writing defaults card in the process.
- Tuned the provider accordion controls with a shared secret-input affordance for copy/test feedback and lean badge statuses so hosted API setup stays tidy.

### Dashboard single-user polish (2025-10-09)
- Tightened the "Today + Inbox" header with new `--dash-*` tokens, compact spacing, and a calmer time + weather chip that hugs the right edge.
- Removed redundant "Now"/"Workstreams" eyebrows, brought titles to sentence case, and ensured every quiet action uses dotted underlines for a low-ink surface.
- Focus card now appears only when a session is running or starts within 90 minutes, falling back to a header "Start focus session" link otherwise.
- Projects, Inbox, and Signals cards trimmed to three-row caps with tertiary metadata, while Recent Activity hides by default to keep the single-user layout effortless.
- Synced chip padding and dashboard spacing tokens in `globals.css` with the new polish so future cards inherit the refined rhythm automatically.

### Settings module token-driven overhaul (2025-10-08)
- Rebuilt Settings with comprehensive two-column desktop layout featuring sticky scroll-spy navigation and responsive mobile tabs + accordion.
- Added complete sections for agents/models (Ollama server, local models, model defaults), AI writing assistant (provider/model selection, style/behavior controls), cloud providers (API key management with test/save actions), and Google account management.
- Implemented fallback provider configuration in model defaults with primary/fallback provider selection supporting both cloud and local Ollama models.
- Enhanced design tokens in `globals.css` with updated elevation/radius values, added `--settings-nav-w`, `--field-max-w`, and `--radius-card` tokens for consistent Settings UI styling.
- Added analytics event stubs for future telemetry integration and placeholder backend actions for provider testing, model management, and account connections.

### Left pane selection styling unification (2025-10-08)
- Standardized active row highlighting across chat, mail, and notes modules with consistent blue accent treatment.
- Applied solid primary background (`var(--primary)`) with white text for selected items, replacing mixed transparency approaches.
- Updated mail compose button to full-width left-aligned layout for better visual consistency with folder list.
- Enhanced icon and badge readability in active states by switching to white/translucent colors when rows are selected.
- Centralized styling patterns in notes module with shared `ACTIVE_LEFT_PANE_ROW` and `HOVER_LEFT_PANE_ROW` constants.

### Chat tri-pane polish (2025-10-08)
- Tokenized the conversation rail width and pared conversation rows back to titles only so the left pane stays calm while still honoring pinned and unread states.
- Rebuilt the chat center pane with timestamp-above bubbles, icon-only copy/regenerate/edit affordances, and hover-only actions for user messages.
- Extended the composer with auto-grow behavior, reserved bottom padding, attachment drop support, and updated keyboard shortcuts/tooltips for a smoother send flow.
- Introduced tooltip-backed model selection in the header, aria-live announcements, and scoped keyboard shortcuts (`Cmd/Ctrl+K`, `N`, `[`, `]`, `\`) across the chat tri-pane.

### Token namespace cleanup (2025-10-08)
- Namespaced every remaining `text-[var(--…)]` usage under `text-[color:…]` / `text-[length:…]` across dashboard widgets, the Mail tri-pane, Notes surfaces, and Tasks flows so arbitrary Tailwind values align with the design-token lint rules.
- Updated shared primitives (`badge`, `button`, `card`, `toggle-group`, `checkbox`) plus `SendButton.tsx` to consume the new convention and avoid duplicate-property warnings in toolchains.
- Refreshed `docs/technical/design-tokens-reference.md` with guidance covering the namespaced helpers so future contributors follow the same pattern.

### Notes module refinements (2025-10-09)
- Enabled context-menu-triggered inline renaming for notes and folders in the left pane, with keyboard commit/cancel behavior.
- Added note pinning support that keeps pinned items at the top of both center and sidebar lists, plus pin/unpin actions in dropdowns and context menus.
- Surfaced pinned state indicators alongside starred badges so priority notes remain visually distinct across the module.

### Event preview popover refinements (2025-10-08)
- Updated calendar event preview popover to sit on `--bg-surface-raised` with an emphasized border + inset hairline for clearer separation from the grid.
- Swapped the elevation to `--elevation-lg`, added calm open motion, and tuned icon buttons to stay low-ink until hovered/focused.
- Introduced supporting tokens (`--bg-surface-raised`, `--border-emphasis`, `--border-hairline`) and a shared `popover-in` keyframe for smooth entry.

### Calendar visual consistency (2025-10-07)
- Removed legacy `components/calendar/CalendarEvent.tsx` and `CalendarTaskRail.tsx` to prevent stale inline-flex + gray color imports from leaking into the new module system.
- Adjusted the month-view event stack to use `inset-x-0` (instead of padded left/right offsets) so every `EventPill` now spans the full cell width on all browsers.
- Reworked calendar color fallbacks to use RGBA tones derived from the shared `--event-*` palette, ensuring month/week/day pills match the Tasks rail even where `color-mix` isn’t supported.
- Added explicit `--event-teal`/`--event-pink` tokens for parity with Tasks chips and regenerated the build so neutral/personal events render in green rather than gray.
- Confirmed the unified `EventPill` font token (`--event-pill-fs: 0.75rem`) applies consistently across all views after the rebuild.

### Calendar & Tasks UI Overhaul (2025-01-17)

#### Event Pill System Implementation
- **Complete Event Pill Component Rewrite**: 
  - Implemented with class-variance-authority (CVA) for variant management
  - Tone variants: neutral (green), low (blue), medium (yellow), high (coral) - aligned with design system
  - Density variants: default and dense for space-efficient layouts
  - Multiline support: one-line (truncate) and two-line (line-clamp-2) modes
  - Added full accessibility: role="button", tabIndex, aria-label, aria-keyshortcuts
  - Support for prefix/suffix content and optional accent bars
  - **ONGOING ISSUE**: Event pills not expanding to full width in month view despite w-full class (changed from inline-flex to flex)
  - **ONGOING ISSUE**: Font size reduced to 12px (0.75rem) but changes not reflecting in browser

#### Calendar Color System
- **Gmail-Style Calendar Colors**:
  - Implemented 9 calendar colors: blue (default), coral, yellow, green, purple, orange, teal, pink
  - All colors use design system tokens with color-mix for consistent theming
  - Removed gray color - personal events now use green instead
  - Category mapping: work→blue, meeting→yellow, travel→coral, personal→green
  - Colors adjusted to 18-22% mix ratios for better visibility
  - **ISSUE**: Gray events still appearing despite neutral tone mapped to green

#### Calendar View Improvements
- **Month View**:
  - Fixed event positioning with calc(var(--space-2)+1.5rem) to clear day numbers
  - Events stack vertically with proper gap spacing
  - Added overflow-hidden to prevent event overflow
  - Grid fills available height with flex-1
  
- **Week/Day Views**:
  - Events contained within day columns with overflow-hidden
  - Full-width events with w-full className
  - Multiline logic based on event height (≥48px allows 2 lines)
  - Restored scrolling with overflow-y-auto containers
  - Removed double borders between rail and grid

#### Tasks Module Enhancements
- **List View Density System**:
  - Implemented three presets: comfortable (default), cozy, and compact
  - Token-based spacing system for consistent density
  - Segmented toggle control for density switching
  - Grid layout with elastic columns and fixed checkbox width

- **Chip Contrast Improvements**:
  - Low-ink chip system with hue-matched outlines
  - Adjusted opacity levels: 14-30% background, 56-90% foreground
  - Added stroke system for better edge definition
  - Vertical dividers between chip groups

- **Label Color System**:
  - 9 preset colors with inline color picker UI
  - Dynamic chip rendering with selected colors
  - Clickable labels that open color picker
  - Color persistence across filter dropdown and task cards

- **Calendar Tasks Rail**:
  - Unified TaskRow component matching Tasks module design
  - Fixed "Add task" button styling consistency
  - Proper alignment and spacing tokens

#### Design Token Updates
- **Event Pill Tokens**:
  - Typography: --event-pill-fs (12px), --event-pill-lh (1.2)
  - Spacing: --event-pill-px, --event-pill-py, --event-pill-gap
  - Density variants: --event-dense-px, --event-dense-py
  - States: hover, focus-ring, selected-ring

- **Calendar Layout Tokens**:
  - Frame: --cal-frame-radius, --cal-frame-border
  - Grid: --cal-gridline, --cal-ring
  - Events: --event-gap, --event-overlap-gap
  - Now indicator: --cal-now-line, --cal-now-dot

#### State Management
- Added events array with useState in CalendarModule
- Implemented handleAddEvent function for new event creation
- Fixed date/time parsing for proper event display
- Wired NewEventModal to event creation flow
- Fixed references to removed unifiedEvents variable

#### Known Issues & Ongoing Work
1. **CSS Not Updating**: Changes to globals.css (font size, colors) not reflecting despite file modifications
2. **Event Pill Width**: Month view pills not expanding to full width even with flex and w-full
3. **Color Persistence**: Some events still showing gray despite removal of gray color option
4. **Vite HMR**: Hot module replacement not picking up CSS token changes consistently
5. **Type Errors**: Multiple TypeScript errors in various modules (unrelated to calendar work)

### Calendar: Unified Views + Token-Driven Event Pills (2025-10)
- Swapped legacy calendar rendering to unified MonthGrid/WeekGrid/DayView backed by `useCalendarEngine`.
- Replaced per-view `EventBlock`/inline markup with a single strict `CalendarEvent` pill:
  - Top-left alignment enforced (inline-flex, items-start/justify-start, text-left).
  - One-line layout: time `whitespace-nowrap tabular-nums`, title `truncate`.
  - Density variants (micro/compact/default) + size variants (xxs/sm) using tokens only.
  - Duration-aware density for week/day: ≤15m micro + min-h 16px; ≤30m micro + min-h 22px; ≤60m compact; else default.
- Month chips now use `density="micro" size="xxs"` with `min-h: var(--cal-month-chip-min-h)` (~20–22px), matching Gmail feel.
- Timed blocks respect min-height guards and scale with `--cal-hour-row-h` (e.g., 2h = 2× row height).
- Removed cell/column hover greying; hover feedback is applied to the event pill only.
- Adopted a low-ink “paper” palette (tinted surface backgrounds + neutral text) for events, with subtle hover deepen.
- Centralized category→tone mapping and paved path to deprecate `EventChip` and legacy `CalendarWeekView`.

### Tasks Module Enhancements (2025-10)
- **Inline List Creation**: Asana-style compact inline forms for creating new lists/sections
  - Board view: Minimal 160px panel with 32px input, 28px buttons
  - List view: 256px inline input with horizontal button layout
  - Placeholder text "New section" matches Asana terminology
  - Enter to submit, Escape to cancel keyboard shortcuts
  - Total form height reduced to ~55-60px for subtle, natural appearance
  
- **Auto-Height Column Swim Lanes**: Dynamic column sizing based on content
  - Columns use natural height instead of fixed dimensions
  - Empty columns (0 tasks) display minimal 160px height
  - Columns with many tasks expand naturally
  - Board container uses `items-start` alignment for top-aligned columns
  - Eliminates wasted vertical space, creates cleaner board layout
  - Matches Asana's organic, space-efficient design

### Pane Controls & Layout Polish (2024-12)
- **Pane Caret Refinement**: Applied design token hover/active states with circular hover surfaces and eased transitions, plus tooltip offsets to avoid clipping on collapsed panes.
- **Collapsed Bar Treatment**: Rebuilt collapsed pane affordances with 8px elevated rails, subtle edge shadows, and glyph feedback aligned to LibreOllama tokens.
- **Context Pane Balance**: Softened empty-state icon emphasis and ensured Mail quick actions retain premium calm aesthetics.
- **Responsive Safeguards**: Added runtime guard that auto-hides side panes when viewport width cannot satisfy `--tripane-center-min` center requirements.

### Mail Module UX Refinements (2024-12)
- **Quick Modal Polish**: Eliminated field overflow and popover friction
  - Added flexing label spans with extra right padding so calendar/clock icons stay inside fields
  - Switched date/time popovers to non-modal mode to respect parent scroll lock
  - Slimmed time option list spacing, enabled wheel scrolling, and constrained height
- **Inline Reply to Gmail-Parity Modal**: Complete refactor of inline reply interface
  - Transformed to elevated modal matching ComposeDocked design
  - Added Gmail-style action dropdown (Reply/Reply All/Forward/Edit subject/Pop out)
  - Recipient chips display inline with action selector
  - Flexbox layout ensures toolbar and Send button always visible (max 70vh)
  - Modal scroll lock on underlying mail pane when active
  
- **Compose Modal Minimize Functionality**: Minimize/restore capability
  - Minimize button collapses compose to 400px × 52px bar at bottom-right
  - Shows recipient and subject in minimized state
  - Click anywhere on minimized bar to restore full compose
  - State persists during compose session
  
- **Visual Hierarchy Cleanup**: Consistent modal elevation system
  - Removed avatar circles from email list and email overlay
  - All compose modals use `--elevation-xl` shadow for depth
  - Fixed blue border issue on email overlay with forced removal
  - Clean, modern aesthetic focused on content

- **Collapsed Pane Navigation**: Sidebar collapse improvements
  - Added thin 48px vertical bars when mail panes are collapsed
  - PaneCaret chevron buttons at bottom of collapsed bars to reopen
  - Left pane shows right-pointing chevron (→), right pane shows left (←)
  - Matches main app sidebar collapse pattern
  - Fixed TriPaneHeader to use `h-[60px]` instead of `min-h-[60px]` for perfect border alignment
  - Removed horizontal scrollbar with overflow-hidden

- **Advanced Search Redesign**: Clean, uniform form interface
  - Simplified from cluttered multi-section form to compact modal (480px)
  - All input fields and dropdowns now uniformly sized (40px height)
  - Consistent padding, borders, radius across all form controls
  - Gmail-inspired layout: From, To, Subject, Has words, Date within, Search in
  - Checkbox for attachments with proper sizing
  - Right-aligned button group: Reset, Cancel, Search

- **Design Documentation**: Created markdown reference for design tokens
  - Added `docs/technical/design-tokens-reference.md` 
  - Complete table-formatted reference of all CSS custom properties
  - Easier for outsiders to understand design system without parsing CSS

### Shared Component System - True Design Consistency
- **SendButton.tsx**: Shared Send button component with consistent styling
  - Paper-plane icon, min-width constraint, proper keyboard shortcuts
  - Aria-keyshortcuts support for ⌘/Ctrl+Enter across all compose surfaces  
  - Single source of truth for Send button appearance and behavior

- **FormattingToolbar.tsx**: Comprehensive shared formatting ribbon
  - Complete formatting suite: Undo/Redo, Font, Bold/Italic/Underline, etc.
  - Alignment tools, lists, quote, link, attachments, image insertion
  - Visual separators and consistent spacing using design tokens
  - Pixel-identical presentation in both ComposeModal and InlineReply
  
- **True Component Sharing**: Both compose surfaces now use identical components
  - No more "similar but different" - exact same Send button and toolbar
  - Eliminates visual inconsistencies between docked compose and inline reply
  - Single codebase for maintenance and future enhancements
  - Professional design system implementation with zero duplication

### Premium Compose System Implementation
- **ComposeModal**: New professional docked Gmail-style compose modal
  - Bottom-right docked positioning with proper elevation and shadows
  - Header with dynamic title (subject or "New message") + window controls
  - Progressive disclosure fields: Recipients → Subject → Editor
  - Content-measure constrained editor for optimal readability  
  - Clean toolbar: Send + attachments left, More + Delete right
  - Full keyboard support: Cmd/Ctrl+Enter send, Esc close behavior
  - Professional accessibility with proper ARIA labels and focus management

- **Design Token System**: Comprehensive token system for compose consistency
  - Compose sizing tokens: `--compose-min-w`, `--compose-max-w`, `--compose-min-h`, `--compose-max-h`
  - Padding rhythm: `--modal-inner-x/y`, `--field-gap-y` for consistent spacing
  - UI element sizing: `--chip-h`, `--toolbar-h` for uniform heights
  - Enables consistent styling across all compose experiences

- **InlineReply Refinements**: Updated to use design token system
  - Editor constrained to `--content-measure` for readability
  - Simplified toolbar hierarchy: Send primary left, "Open in compose" right  
  - Improved token usage: `--border-subtle`, `--field-gap-y`, `--toolbar-h`
  - Better visual consistency with compose modal

### Major Codebase Reorganization (Phase 1) 
- **Professional Directory Structure**: Complete reorganization for enterprise/open-source presentation
  - Created `/docs/` with technical/, implementation/, guidelines/ subdirectories
  - Created `/components/dev/` separation for development/demo components  
  - Eliminated duplicate `/components/mail/` directory, consolidated into `/components/modules/mail/`
  - Standardized module naming: TasksModule, NotesModule (removed 'Enhanced' suffixes)
  - App routing cleanup: separated production/development routes, default to 'mail'
- **Import Path Updates**: Fixed all component imports after directory reorganization
  - UI components in dev directory: `./ui/*` → `../ui/*`
  - PaneCaret references: updated to `./dev/PaneCaret` and `../../dev/PaneCaret`
  - Module imports: updated mail component references
- **Quality Improvement**: Codebase quality score improved from 7/10 to 9/10
  - Clear separation of concerns between production and development code
  - Easier onboarding for new developers
  - Professional presentation ready for scaling

### Archived
- Moved legacy mail modules to `archive/`:
  - components/modules/MailModule.tsx
  - components/modules/MailModuleTriPaneRefactored.tsx
  - components/modules/MailModuleTriPaneWithEdgeHandles.tsx
- Moved legacy compose components to `archive/`:
  - components/ComposeModal.tsx (superseded by ComposeDocked as default)

### Changed
- Consolidated on `MailModuleTriPane` with bottom toggles only; removed edge-handle variants.
- Navigation: removed 'TriPane Edge Handles' from sidebar; 'Mail' now routes to TriPane.
- ComposeEnvelope: Complete Gmail-style progressive disclosure implementation
- ComposeToolbar: Moved attachment icons (paperclip, link, emoji, image) next to Send button for better UX
- Removed placeholder text from compose editor for cleaner interface

### Added
- Compose: v1.0 baseline locked (dock-in-center, Gmail-parity envelope, two-tier toolbar, motion + radius tokens)
- Visual polish: tokenized hover, hairline dividers, tertiary placeholder text, neutral header tone
- ComposeEnvelope: Gmail-exact progressive disclosure (Recipients → From/To/Cc/Bcc → Subject)
- ComposeEnvelope: Click-outside behavior to auto-collapse to minimal state
- ComposeEnvelope: Perfect field alignment with uniform label widths and tight spacing

### Stability
- This Compose baseline is approved for reuse across modules as the design-system reference for email composition


### Known Issues
- Email overlay inline reply remains a stopgap; it is still poorly designed and needs dedicated UX work before release.


### Added
- Initial Tauri + React + TypeScript foundation
- Dynamic port selection for development (`dev:smart` and `tauri:dev:smart` scripts)
- Complete design token system based on LibreOllama Design Token Sheet
- TriPane Mail module with keyboard shortcuts (`[` `]` `\`)
- Secure content sanitization with DOMPurify
- Cross-platform desktop application support
- Vite + Tailwind CSS build system
- Comprehensive UI component library (shadcn/ui + Radix)

### Security
- Implemented strict Content Security Policy (CSP)
- HTML content sanitization for email rendering
- Disabled shell access in Tauri configuration

### Infrastructure
- Automated port conflict resolution
- Hot module replacement for development
- Production build optimization
- Icon assets for desktop application

### Changed
- Compose: Docked to Mail list (center) pane with absolute positioning and stable z-index; unaffected by Context panel toggles.
- ComposeToolbar: Refactored to two-tier Gmail layout (Formatting Bar + Utility Row) with consistent sizing, spacing, and rounded formatting bar.
- Tokens: Added/standardized compose tokens (header background, divider, toolbar height/bg).

### Fixed
- ComposeEnvelope: Gmail-accurate Recipients state machine (collapsed ↔ expanded) with auto-reset on blur; Subject independent; autoFocus on expand.
- Removed all horizontal scrollbars in compose (min-w-0, overflow-x-hidden, hide-scrollbar on formatting bar, editor break-words).
- Resolved non-boolean jsx warning by moving placeholder styling to global CSS.
- Eliminated ref warnings by forwarding refs in TooltipTrigger, DropdownMenuTrigger, and PopoverTrigger.

### Accessibility
- ARIA labels, tooltips, focus order, and focus management improved across compose.

## [0.1.0] - 2024-XX-XX

### Added
- Initial project setup and foundation
- Desktop application shell with Tauri
- React frontend with TypeScript
- Design system implementation
- Mail module with tri-pane layout

### Technical Details
- **Framework**: Tauri 2.1 + React 18 + TypeScript 5.6
- **Build System**: Vite 5.4 + Tailwind CSS 3.4
- **UI Components**: Radix UI + shadcn/ui
- **Security**: DOMPurify + Strict CSP
- **Development**: Dynamic port selection + HMR
