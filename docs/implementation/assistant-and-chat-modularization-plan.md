# Assistant & conversational surfaces modularization plan

_Last updated: 2025-10-23_

## Scope

This plan covers the large files called out in the latest audit that underpin assistant, chat, settings, queue worker, notes, canvas selection, and global styles. It sequences refactors so we preserve feature parity while carving each surface into maintainable modules that mirror the successful Tasks modularization effort.

### Target files

| Stage | File | Current LOC | Owners |
|-------|------|-------------|--------|
| 1 | `components/assistant/quick/QuickAssistantProvider.tsx` | 554 | Assistant
| 2 | `components/assistant/AssistantCaptureDialog.tsx` + `.backup` | 946 (legacy) / 22 (active) | Assistant
| 3 | `components/modules/ChatModuleTriPane.tsx` | 1,293 | Conversations
| 4 | `components/modules/settings/_parts/SettingsProviders.tsx` | 921 | Settings
| 5 | `components/modules/notes/NotesLeftPane.tsx` | 211 | Notes
| 6 | `src-tauri/src/sync/queue_worker.rs` | 877 | Backend sync
| 7 | `components/modules/Canvas/runtime/features/renderer/modules/SelectionModule.ts` | 807 | Canvas
| 8 | `styles/globals.css` | 1,519 | Design systems

Stages are ordered to unblock the assistant roadmap first, then shared providers, followed by backend and design tokens.

## Guardrails

* **Behavior parity required.** No UX regressions, hotkey drift, telemetry breaks, or API changes allowed during the refactor.
* **Public exports stay stable** until the final stage for each file. Use shims/barrels, update references once coverage hits 100%.
* **Instrumentation must persist.** Inline `emit` calls, analytics events, and logging statements are verified before and after extraction.
* **Validation suite per stage:**
  - `npm run type-check`
  - `npm run test -- --run <new-suites>` once tests are split
  - Manual surface smoke tests (outlined below)
  - For Rust: `cargo fmt`, `cargo clippy --workspace`, `cargo test`
  - For CSS: Percy/visual diff or curated screenshot checklist

## Stage 0 – Baseline snapshots

1. Capture git hashes for each file; add `// #region` markers to document current responsibilities.
2. Record manual test checklist for each surface (assistant dialogs, chat tri-pane, queue worker scenarios, canvas selection interactions, global theme states).
3. CI baseline: `npm run type-check`, `npm run test`, `cargo test`.

Exit: git diff shows only annotations; all baselines pass.

---

## Stage 1 – Quick Assistant provider consolidation (554 LOC)

**Status (2025-10-23):** Legacy shell `components/assistant/QuickAssistantProvider.tsx` removed; all exports funnel through `components/assistant/quick/`. New regression tests live at `components/assistant/quick/__tests__/QuickAssistantProvider.test.tsx`.

### Responsibilities inventory

| Region | Responsibility |
|--------|----------------|
| Hotkey bindings | Global listener for `⌘/Ctrl+K`, slash, selection capture |
| Provider state | React context holding assistant mode, clipboard payload, selection snapshot |
| Command registry | Slash commands, AI tool metadata, routing |
| Dialog orchestration | Opening modals, delegating to capture dialog |
| Telemetry | Emit `assistant.*` events |
| Legacy shell (former `components/assistant/QuickAssistantProvider.tsx`) | Removed; confirm no direct imports linger |

### Target layout

```
components/assistant/quick/
  ├── QuickAssistantProvider.tsx (canonical shell)
  ├── hotkeys.ts (register/unregister listeners)
  ├── commands/
  │     ├── registry.ts
  │     ├── default-commands.ts
  │     └── helpers.ts
  ├── state/
  │     ├── useQuickAssistantState.ts
  │     └── QuickAssistantContext.tsx
  ├── telemetry.ts
  └── __tests__/
        └── provider.test.tsx
components/assistant/QuickAssistantProvider.tsx (thin shim → delete once references updated)
```

### Sequential tasks

Remaining follow-ups:

1. Keep auditing for new direct imports that bypass the barrel and re-route them to `components/assistant/quick/QuickAssistantProvider`.
2. Extend provider tests to cover hotkey bindings once linting is in place.
3. Manual validation: open assistant via hotkey, run slash command, capture selection, ensure telemetry still fires after future edits.

Exit: Provider stays under 600 LOC, tests remain green, and manual smoke continues to pass.

---

## Stage 2 – Assistant capture dialog cleanup (0 LOC legacy / 22 LOC active)

**Status (2025-10-23):** `AssistantCaptureDialog.tsx.backup` removed; active implementation lives entirely under `components/assistant/capture/` with wrapper `AssistantCaptureDialog.tsx`.

### Responsibilities inventory

| Region | Responsibility |
|--------|----------------|
| Active shell (`capture/`) | Already composed from modular hooks/components |
| Legacy implementation | Removed backup file (2025-10-23) |
| Tests | Still missing coverage for modular capture workflow |

### Target layout

```
components/assistant/capture/
  ├── CaptureDialog.tsx (shell)
  ├── hooks/
  │     └── useCaptureState.ts
  ├── panes/
  │     ├── TaskCapturePane.tsx
  │     ├── NoteCapturePane.tsx
  │     ├── EventCapturePane.tsx
  │     └── AskPane.tsx
  ├── components/
  │     ├── CaptureHeader.tsx
  │     ├── AttachmentList.tsx
  │     └── FooterActions.tsx
  └── __tests__/
        └── capture-dialog.test.tsx (add)
```

### Sequential tasks

Remaining follow-ups:

1. Confirm all imports continue flowing through `components/assistant/capture/` entry points during future changes.
2. Add granular tests for mode switching, attachment handling, and submission flows.
3. Document any future capture enhancements in `components/assistant/README.md` and roadmap updates.
4. Manual validation: open dialog, switch modes, upload attachment, submit.

Exit: tests cover capture flows, manual checks pass, documentation stays current.

---

## Stage 3 – Chat module tri-pane (1,293 LOC)

### Responsibilities inventory

| Region | Responsibility |
|--------|----------------|
| Layout scaffolding | Tri-pane wrappers, PaneHeader wiring |
| Navigation | Conversation list, filters, search |
| Conversation view | Message rendering, composer |
| Insights pane | AI insights, metadata tiles |
| State | useChatStore, derived selectors |

### Target layout

```
components/modules/chat/
  ├── ChatModuleTriPane.tsx (shell)
  ├── navigation/
  │     ├── ChatSidebar.tsx
  │     └── filters.tsx
  ├── conversation/
  │     ├── ConversationPane.tsx
  │     ├── MessageList.tsx
  │     └── Composer.tsx
  ├── insights/
  │     └── ChatInsightsPane.tsx
  ├── hooks/
  │     └── useChatPaneState.ts
  └── __tests__/
        └── tri-pane-regression.test.tsx
```

### Sequential tasks

1. Annotate current regions; capture feature flags/telemetry usage.
2. Extract sidebar navigation into `navigation/`, preserving virtualization if present.
3. Move message view into `conversation/` components; ensure composer hotkeys remain.
4. Extract insights pane UI into `insights/` folder to allow reuse with Projects.
5. Provide `useChatPaneState` for selection + unread counts.
6. Manual validation: open chat module, switch conversations, send message, inspect insights pane.

Exit: shell ~300 LOC, regression test ensures context menu + composer hotkeys.

---

## Stage 4 – Settings providers (921 LOC)

### Responsibilities inventory

| Region | Responsibility |
|--------|----------------|
| Context providers | Account, workspace, feature flag contexts |
| Tauri bridge | `invoke` wrappers for settings persistence |
| Hydration | Bootstrapping from secure store |
| Telemetry | Settings load / error events |

### Target layout

```
components/modules/settings/providers/
  ├── index.ts (barrel)
  ├── AccountProvider.tsx
  ├── WorkspaceProvider.tsx
  ├── FeatureFlagsProvider.tsx
  ├── bridge/
  │     ├── settings-bridge.ts
  │     └── useSettingsBridge.ts
  ├── hooks/
  │     └── useSettingsHydration.ts
  └── __tests__/
        └── settings-providers.test.tsx
```

### Sequential tasks

1. Annotate regions; note dependency ordering.
2. Extract Tauri invoke calls into `bridge/` module with typed responses.
3. Create dedicated provider components; compose them in `SettingsProviders.tsx` shell.
4. Add tests covering hydration success/failure.
5. Manual smoke: open Settings, toggle workspace sync, ensure account badge persists.

Exit: shell <200 LOC, hydration flow validated.

---

## Stage 5 – Notes left pane hardening (211 LOC shell / extracted modules)

### Responsibilities inventory

| Region | Responsibility |
|--------|----------------|
| Shell (`NotesLeftPane.tsx`) | Delegates to `left-pane/` components |
| Notebook list | Sorting, selection, context menu |
| Filters/search | Already extracted to `Filters` component |
| Drag/drop hooks | `useFolderTree`, DnD helpers in `left-pane/` |
| Tests | No automated coverage for rename/drag/drop flows |

### Target layout

```
components/modules/notes/left-pane/
  ├── NotesLeftPane.tsx (shell)
  ├── NotebookList.tsx
  ├── NotebookListItem.tsx
  ├── Filters.tsx
  ├── hooks/
  │     ├── useNotebookFilterState.ts
  │     └── useNotebookDnD.ts
  └── __tests__/
        └── notes-left-pane.test.tsx (add)
```

### Sequential tasks

1. Audit `left-pane/` exports to ensure each hook/component has region annotations and minimal props; prune unused exports.
2. Add targeted tests covering folder expansion, rename commit/cancel, drag/drop edge cases, and context menu actions.
3. Verify stories or docs reference the new structure; add usage notes if missing.
4. Manual validation: Apply filters, drag notebook, open context menu.

Exit: shell remains thin, automated coverage added, manual smoke verified.

---

## Stage 6 – Queue worker (877 LOC)

### Responsibilities inventory

| Region | Responsibility |
|--------|----------------|
| Job selection | Fetch pending queue items |
| Execution | Dispatch to command modules |
| Retry/backoff | Exponential backoff, failure logging |
| Conflict handling | Mark tasks in conflict, emit events |

### Target layout

```
src-tauri/src/sync/queue/
  ├── worker.rs (orchestrator)
  ├── fetch.rs
  ├── execute.rs
  ├── retry.rs
  ├── conflict.rs
  ├── metrics.rs
  └── tests/
        └── queue_worker_tests.rs
```

### Sequential tasks

1. Add `// region` markers to existing worker.
2. Move fetch helpers to `fetch.rs`; execution to `execute.rs` with trait for commands.
3. Extract retry/backoff logic into `retry.rs` for targeted unit tests.
4. Keep orchestration loop in `worker.rs`; ensure logging unchanged.
5. Add integration tests using SQLite test harness for queue execution.
6. Validation: `cargo fmt`, `cargo clippy --workspace`, `cargo test`; manual sync run verifying `tasks:sync:queue-processed` events.

Exit: worker orchestrator <250 LOC, modules compiled with tests.

---

## Stage 7 – Canvas selection module (807 LOC)

**Status (2025-10-24):** Keyboard shortcut management moved into `selection/utils/KeyboardHandler`, selection state centralized via `SelectionStateManager`, and the primary module lifecycle now enables/disables both. Geometry helpers remain stubbed for extraction.

### Responsibilities inventory

| Region | Responsibility |
|--------|----------------|
| Event handlers | Pointer down/move/up, keyboard shortcuts |
| Geometry | Bounding boxes, snap calculations |
| Rendering | Drawing selection visuals |
| State machine | Tracking selection mode |

### Target layout

```
components/modules/Canvas/runtime/features/selection/
  ├── SelectionModule.ts (shell registration)
  ├── handlers/
  │     ├── pointer.ts
  │     └── keyboard.ts
  ├── geometry/
  │     ├── bounds.ts
  │     └── snap.ts
  ├── rendering/
  │     └── selection-overlay.tsx
  ├── state/
  │     └── selectionMachine.ts
  └── __tests__/
        └── selection-module.test.ts
```

### Sequential tasks

1. Annotate current module; enumerate dependencies on renderer/runtime.
2. Extract geometry helpers into pure functions (unit tested).
3. Move pointer/keyboard handlers into `handlers/`, injected into shell.
4. Render overlay via dedicated component (enables storybook stories later).
5. Provide state machine wrapper using XState or homegrown reducer.
6. Manual validation: start selection, multi-select nodes, keyboard shortcuts (Shift, Esc, arrow nudges, delete/duplicate) still function.

Exit: shell orchestrator ~200 LOC, tests cover geometry + handler scenarios.

---

## Stage 8 – Global styles (1,519 LOC)

### Responsibilities inventory

| Region | Responsibility |
|--------|----------------|
| CSS reset | Base defaults, fonts |
| Design tokens | CSS variables for colors, spacing |
| Components | Specific overrides for UI primitives |
| Dark mode | `@media` rules |

### Target layout

```
styles/
  ├── globals.css (imports only)
  ├── base.css (reset + typography)
  ├── tokens.css (CSS variables)
  ├── components.css (shared component overrides)
  ├── themes/
  │     ├── light.css
  │     └── dark.css
  └── README.md (token documentation)
```

### Sequential tasks

1. Annotate sections with comments (reset, tokens, components, dark mode).
2. Extract token definitions into `tokens.css`; update Tailwind config if needed.
3. Move component overrides into `components.css` with BEM-friendly comments.
4. Keep `globals.css` as import aggregator.
5. Update documentation (design tokens reference) and run snapshot/visual check.
6. Validation: `npm run build`, Percy/Chromatic diff or curated manual screenshots covering light/dark.

Exit: `globals.css` <150 LOC, token reference doc updated.

---

## Validation checklist per stage

| Action | JS/TS stages | Rust stage | CSS stage |
|--------|--------------|------------|-----------|
| `npm run type-check` | ✅ | ✅ | ✅ |
| `npm run test -- --run <suite>` | ✅ | ✅ (if relevant) | ✅ (if using Jest for CSS helpers) |
| Manual surface smoke | ✅ | ✅ | ✅ |
| `cargo fmt`, `cargo clippy --workspace`, `cargo test` | — | ✅ | — |
| `npm run build` | ✅ | ✅ | ✅ |
| Visual diff / Percy | — | — | ✅ |

All validation must pass before moving to the next stage.

## Communication & tracking

* Each stage lands via a dedicated PR referencing this plan.
* Document progress in standup and update `docs/roadmap/Unified-Workspace-Roadmap.md`’s relevant sections (Assistant, Chat, Sync, Canvas, Design).
* Coordinate with QA for regression sweeps after Stages 2, 3, 6, and 8.

## Appendix – Line mapping template

Use this template to track coverage while migrating each monolith:

| Legacy file & region | Destination module | Status |
|----------------------|--------------------|--------|
| `QuickAssistantProvider.tsx` – hotkeys | `quick/hotkeys.ts` | ☐ |
| `QuickAssistantProvider.tsx` – command registry | `quick/commands/registry.ts` | ☐ |
| … | … | ☐ |

Duplicate for each file before deleting any legacy sections.

---

Questions or updates? Leave notes in this document and notify the relevant module owners during standup.
