# Implementation plan for unified UI redesign (v2)

## Scope overview

* Deliver a cohesive redesign that unifies capture, navigation, project context, scheduling, and knowledge management.
* **One assistant** entry: capture, writing tools, and open-ended AI, with natural-language intent routing.
* Reuse modal, pane, and tokenized UI primitives to avoid duplicating patterns.
* Prioritize incremental delivery with clear gates so new experiences can ship progressively.

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
* Context-aware routing that respects current project/folder scope when creating records, with post-submit handoff to Context Panel (§4).

### Integration notes

* Reuse `QuickModal` primitives and existing quick-create modals; mount dialog high in the tree; trap focus; restore focus on close.
* Keyboard: `Enter` submits; `Shift+Enter` adds newline; `/` opens command list; arrow keys navigate the tools grid; `1–9` run the first nine tools (`aria-keyshortcuts`).
* Accessibility: `role="dialog"`, `aria-modal`, `aria-labelledby`; `aria-live="polite"` for success/errors.
* Instrumentation: `assistant.opened`, `assistant.intent_resolved` (intent, confidence, local/cloud), `assistant.executed`, `assistant.error`.

---

## 2. Projects/spaces module (lightweight, opinionated)

### Objectives

* Introduce a tri-pane Projects module that centralizes all artifacts (tasks, notes, emails, chats, files, canvases) per project.
* Provide tabbed project views with an Overview focus.

### Key deliverables

* New `ProjectsModule` leveraging `TriPane`, `PaneHeader`, and `PaneColumn` primitives.
* Left pane project navigator with search/pin support; center pane tab system (Overview, Tasks, Notes, Files, Canvas, Chat, Emails*).
* Overview tab widgets: progress snapshot, upcoming milestones/events, recent notes/emails, pinned chats, and primary "Add" button invoking the Assistant scoped to the project.
* Right pane using Context Panel 2.0 with project-specific suggestions and linking controls.
* Project-level data filters piped into existing Tasks/Notes/Calendar stores.

### Integration notes

* Wire sidebar navigation to include the Projects module.
* Ensure current project context is available globally (assistant, context panel, dashboard widgets).

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

* Header simplified (title/date/chip). *Today + inbox* label removed.
* Focus card now conditional; otherwise omitted.
* Projects, Inbox, and Signals reduced to three-row caps; tertiary metadata and dotted quiet links unify the look.
* Recent activity hidden by default for single-user.
* Weather chip supports **sun, cloud-sun, drizzle, rain, thunder, snow, fog, wind** plus **moon/cloud-moon** night variants.

---

## 4. Context Panel 2.0 (standardized across modules)

### Objectives

* Establish a single, reusable context panel layout shared by Mail, Chat, Tasks, Notes, Projects, Dashboard widgets, etc.

### Key deliverables

* Shared `ContextPanel` with consistent header, tab switcher (Context | Settings), and section stack.
* Fixed section order: Create link (chips), Related notes, Related tasks, Upcoming events, Threads/Chats, AI suggestions, Backlinks.
* Reusable `ContextSection`, `ContextQuickActions`, and `ContextListItem` primitives.
* Backlink surfacing across modules.

### Integration notes

* Refactor existing right panes to consume the shared panel; hydrate via module adapters.

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

---

## 7. Notes “Keep” view + web clipper

### Objectives

* Provide a visual grid for pinned/quick notes and a lightweight clipping flow for URLs and media.

### Key deliverables

* Masonry/grid layout for pinned and clip-tagged notes; card styling with thumbnail, tag chips, pin indicators.
* "Add from URL" affordance creating notes with metadata; optional clipboard detection.

### Integration notes

* Reuse existing note model, pinning logic, and card primitives; prep extension handoff with simple clipping endpoints/IPC.

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
* **Provider routing**: classification local; heavy summarize/translate may use the user’s configured cloud provider; show a tiny "Using OpenAI • Change" label when cloud is used.
* **Instrumentation** as listed in §1.

---

## 12. Writing tools registry (selection transforms)

### Tools (all selection-based)

* **Professional tone**, **Friendly tone**, **Make concise**, **Expand**, **Proofread**, **Summarize** (N bullets), **Translate…** (lang + tone), **Explain**, **Create list**, **Extract key points**.

### Behavior

* Assistant shows a **tools grid** when a selection exists and input is empty.
* NL like “make this friendlier”, “translate to German (informal)”, “extract key points” routes to the corresponding tool; unmatched → **Ask AI** with the selection as context.
* Results render in a **draft pane** with Replace/Insert/Copy actions; dismissing restores focus.

---

## 13. Tokens added/confirmed (dashboard + assistant)

* **Header**: `--dash-header-py`, `--dash-title-size`, `--dash-header-gap`.
* **Chip**: `--chip-bg`, `--chip-border`, `--chip-radius`, `--chip-pad-y`, `--chip-pad-x`; icons `--icon-sm`, `--icon-md`.
* **Cards**: `--card-pad`, `--row-pad`, `--dash-gap`; borders `--border-subtle`; radii `--radius-lg`.
* **Assistant**: `--modal-max-w: 640px`, `--elevation-lg`, tools grid spacing, item radius/border/hover tokens.

---

## 14. Accessibility & keyboard

* Dialogs: focus trap, `aria-modal`, labelled titles, `Esc` closes and restores focus.
* Keyboard parity for the Assistant (slash list, tools grid, submit); dotted quiet links advertise shortcuts via `title` + `aria-keyshortcuts`.
* Reduce motion: all animation gated behind `motion-safe:` with non-animated fallback states.

---

## 15. Risks & mitigations

* **LLM misclassification** → confidence gate + preview line; default to non-destructive capture.
* **Ambiguous dates** → deterministic enrichers and user locale/timezone; morning/afternoon heuristics (configurable).
* **Privacy** → local classification; size thresholds before sending selection to cloud; explicit provider label when cloud used.
* **Scope leaks** → assistant receives current project/folder scope; creation handlers require scope explicitly.

---

## 16. Rollout & sequencing (two weeks)

1. **Assistant MVP** – launcher, hotkeys, selection, NL router (task/note/event + Ask AI fallback).
2. **Dashboard refresh** – header three-zone layout; top-row cards; Inbox/Projects/Signals 3-row caps; optional Focus.
3. **Projects foundations** – tri-pane layout, overview widgets, scoped Assistant.
4. **Context Panel 2.0** – shared component, backlinks.
5. **Command palette** – adapters and create-from-query handoff to Assistant.
6. **Tasks ↔ calendar** – render tasks in calendar; drag/drop; follow-up flows.
7. **Notes keep view + clipper** – grid, URL capture.
8. **Linking/backlinks** – parser + attach UI + persistence.
9. **Starter automations** – watchers, slash-commands.
10. **Design polish** – token sweep + accessibility QA.

**Milestone exit criteria**: demo recording, updated docs/MDX, `npm run type-check`, smoke tests in web + Tauri shells.
