# Implementation Plan for Unified UI Redesign

## Scope Overview
- Deliver a cohesive redesign that unifies capture, navigation, project context, scheduling, and knowledge management.
- Reuse existing modal, pane, and tokenized UI primitives to avoid duplicating patterns.
- Prioritize incremental delivery with clear gates so new experiences can ship progressively.

---

## 1. Global Quick Assistant (Capture + Ask)
### Objectives
- Replace scattered "new" or "+" entry points with a single floating Quick Assistant accessible via button and hotkeys.
- Support freeform capture and slash-command routing to existing quick modals for tasks, notes, events, emails, and AI actions.

### Key Deliverables
- Floating assistant launcher (bottom-right) with tooltip and theming.
- Global hotkeys: ⌘/Ctrl+K to open default mode; single-letter shortcuts (T, N, E, etc.) that scope the modal.
- Command parser that detects `/task`, `/note`, `/event`, `/email`, `/summarize`, `/link`, `/focus`, etc., pre-filling the appropriate QuickModal variant.
- Text-selection capture: when users highlight text and press Ctrl/⌘+K, the assistant opens prefilled with the selection for immediate follow-up.
- Context-aware routing that respects current project/folder scope when creating records.
- Post-submit handoff to the Context Panel (see section 4) for creation confirmation and follow-up suggestions.

### Integration Notes
- Reuse `QuickModal`, `QuickTaskModal`, `QuickNoteModal`, `QuickEventModal`, and associated input primitives.
- Refactor existing local "Add" buttons across modules to invoke the assistant with scoped context props.
- Ensure accessibility via ARIA labeling and focus management.

---

## 2. Projects/Spaces Module (Lightweight, Opinionated)
### Objectives
- Introduce a tri-pane Projects module that centralizes all artifacts (tasks, notes, emails, chats, files, canvases) per project.
- Provide tabbed project views with an Overview focus.

### Key Deliverables
- New `ProjectsModule` leveraging `TriPane`, `PaneHeader`, and `PaneColumn` primitives.
- Left pane project navigator with search/pin support; center pane tab system (Overview, Tasks, Notes, Files, Canvas, Chat, Emails*).
- Overview tab widgets: progress snapshot, upcoming milestones/events, recent notes/emails, pinned chats, and primary "Add" button invoking the Quick Assistant scoped to the project.
- Right pane using Context Panel 2.0 with project-specific suggestions and linking controls.
- Project-level data filters piped into existing Tasks/Notes/Calendar stores.

### Integration Notes
- Wire sidebar navigation to include the Projects module.
- Ensure current project context is available globally (assistant, context panel, dashboard widgets).

---

## 3. Dashboard ("Today + Inbox")
### Objectives
- Transform the Dashboard into the default home: surface today's agenda, unified triage, top projects, and recent activity.

### Key Deliverables
- Header with current date, personalized greeting, and assistant entry hint.
- "Today" row: next events, urgent tasks, focus metrics displayed in cards.
- Unified "Inbox Triage" feed combining unsorted notes, inbox tasks, clipped items with quick File/Snooze actions.
- "Top Projects" strip with progress visualization and deep links.
- "Recent Activity" feed and optional quick action widgets.
- Optional "News" widget that surfaces an RSS or custom-curated feed relevant to the user or active projects.

### Integration Notes
- Reuse card, badge, list, and empty-state primitives; adhere to 8pt spacing tokens.
- Provide skeleton/loading states for asynchronous data sources.
- Update sidebar to label Dashboard as "Today + Inbox".

---

## 4. Context Panel 2.0 (Standardized Across Modules)
### Objectives
- Establish a single, reusable context panel layout shared by Mail, Chat, Tasks, Notes, Projects, Dashboard widgets, etc.

### Key Deliverables
- Shared `ContextPanel` component with consistent header, tab switcher (Context | Settings), and section stack.
- Fixed section order: Create Link (chip input), Related Notes, Related Tasks, Upcoming Events, Email Threads/Chats, AI Suggestions, Backlinks.
- Reusable `ContextSection`, `ContextQuickActions`, and `ContextListItem` primitives.
- Backlink surfacing to display linked entities across modules.
- Uniform styling: tokenized spacing, typography, focus states, and iconography.

### Integration Notes
- Refactor existing `MailRightPane`, `ChatRightPane`, and analogous components to consume the shared panel.
- Provide data adapters per module to hydrate each section.

---

## 5. Universal Search / Command Palette (Jump + Create)
### Objectives
- Deliver a global command palette for navigation, cross-entity search, and natural language creation.

### Key Deliverables
- Modal overlay with prominent input, module filter chips, keyboard navigation, and grouping by result type.
- Search adapters for Notes, Tasks, Emails, Events, Projects, Chats, Files.
- Natural language parsing (prefixes like `todo:`, `note:`, `event:`; optional NLP hooks) to create items via Quick Assistant handlers.
- Quick command shortcuts (e.g., `>` for actions, `#` for projects, `@` for people).
- Integration with ⌘/Ctrl+K by default; optionally expose from header search affordances.

### Integration Notes
- Reuse or formalize components from `components/extended/command-palette.tsx` and `search-input.tsx`.
- Ensure results respect current scopes (e.g., project filters) and update routing/navigation state on selection.

---

## 6. Tasks ↔ Calendar Tight Coupling
### Objectives
- Sync task due dates with calendar events, enabling scheduling via drag-and-drop and reciprocal updates.

### Key Deliverables
- Calendar augmentation to render tasks with due dates/time blocks as events using shared event pill styling.
- Drag-and-drop interactions: task → calendar (set due window); calendar event → task (adjust due date).
- Event detail CTA: "Create follow-up task" leveraging QuickTaskModal.
- Focus block suggestions accessible via assistant or context panel.
- Shared data contract ensuring updates propagate between task and calendar stores without duplication.

### Integration Notes
- Audit Task and Calendar store providers for shared selectors and mutation hooks.
- Handle edge cases: all-day tasks, recurring tasks, timezone shifts, and conflict resolution.

---

## 7. Notes "Keep" View + Web Clipper
### Objectives
- Provide a visual grid for pinned/quick notes and a lightweight clipping flow for URLs and media.

### Key Deliverables
- Notes module tab/view rendering pinned notes and clip-tagged notes in a masonry/grid layout.
- Card styling with image/thumbnail support, tag chips, and pin indicators.
- "Add from URL" affordance (inline input or modal) that creates notes prefilled with metadata.
- Optional clipboard detection for quick capture.

### Integration Notes
- Reuse existing note model, pinning logic, and card primitives; avoid introducing new entities.
- Prepare for future browser extension handoff by defining clipping API endpoints or IPC routes.

---

## 8. Lightweight Linking / Backlinks
### Objectives
- Enable bi-directional linking between entities to build a lightweight knowledge graph.

### Key Deliverables
- Markdown/rich-text parser enhancements to detect `[[Entity Name]]` syntax and resolve to existing items.
- Autocomplete suggestions when typing `[[` within editors.
- "Attach to…" picker for explicit linking between notes, tasks, projects, emails, events, etc.
- Persistence layer for link relationships plus automatic backlink generation.
- Context Panel integration to surface backlinks under related sections.

### Integration Notes
- Implement minimal shared linking service/utilities to manage creation, lookup, and hydration.
- Handle unresolved links gracefully (e.g., highlight in editor, prompt to create entity).

---

## 9. Starter Automations (Recipes + Slash-Commands)
### Objectives
- Introduce simple automations and chat slash-commands to reduce repetitive workflows.

### Key Deliverables
- Event watchers (e.g., new email, tag change) that trigger task/note creation recipes.
- Rule configuration UI (initially templated toggles; future custom builder) within Settings.
- Chat slash-command handler supporting `/summarize`, `/plan`, `/task`, `/note`, `/email`, `/focus`, etc., leveraging assistant flows.
- System notifications or context panel callouts confirming automation outcomes.

### Integration Notes
- Ensure automations reuse the same creation handlers as the Quick Assistant.
- Provide clear logging or activity entries for generated artifacts.

---

## 10. Design System Polish & Unification Pass
### Objectives
- Apply a final sweep to enforce design tokens, spacing, type scale, and component variants across new and legacy surfaces.

### Key Deliverables
- Token enforcement (spacing, color, radius, typography) using `globals.css` and `tailwind.config.ts` tokens.
- Audit to replace ad-hoc styles with UI kit primitives (buttons, tabs, toggles, cards, lists).
- Consistent focus, hover, and motion-safe transitions.
- Updated documentation/README snippets reflecting new patterns.

### Integration Notes
- Pair with QA pass to ensure accessibility (contrast, focus order, keyboard navigation).

---

## Integration & Consistency Guidelines
- **One Assistant:** Retire redundant "+" buttons; route all quick-create actions through the Quick Assistant with scope awareness.
- **One Context Pattern:** Adopt Context Panel 2.0 everywhere; surface backlinks and AI suggestions consistently.
- **One Home:** Dashboard serves as the universal landing page; ensure navigation and routing defaults point here.
- **One Search:** Route all global/module search experiences through the command palette service.
- **One Design Language:** Use UI kit tokens and primitives exclusively—no custom spacing, colors, or ad-hoc components.

---

## Suggested Two-Week Build Sequence
1. **Quick Assistant MVP** – floating launcher, hotkeys, slash parsing, scoped creation.
2. **Dashboard Refresh** – Today row, Inbox triage, projects strip, activity feed.
3. **Projects Module Foundations** – tri-pane layout, overview tab, context integration.
4. **Context Panel 2.0** – shared components, refactors, backlink surfacing.
5. **Universal Command Palette** – search adapters, create-from-query, hotkey wiring.
6. **Tasks ↔ Calendar Sync** – event rendering, drag/drop, follow-up flows.
7. **Notes Keep View & Clipper** – grid layout, URL capture, pin integration.
8. **Linking & Backlinks** – parser, attach UI, persistence.
9. **Starter Automations** – basic recipes, slash commands, confirmations.
10. **Design Polish Pass** – token sweep, documentation, accessibility QA.

Each milestone should conclude with:
- Functional demo (screen recording or screenshots).
- Updated documentation or inline Storybook/MDX notes where applicable.
- Verification via `npm run type-check` and relevant smoke tests in web + Tauri shells.
