# Unified workspace roadmap (v2)

> Formerly `Unified-UI-Redesign.md`; this living roadmap now covers the unified UI redesign and the Google Workspace (Mail · Calendar · Tasks) integration workstreams.

## Scope overview

* Deliver a cohesive redesign that unifies capture, navigation, project context, scheduling, and knowledge management.
* **One assistant** entry: capture, writing tools, and open-ended AI, with natural-language intent routing.
* Reuse modal, pane, and tokenized UI primitives to avoid duplicating patterns.
* Prioritize incremental delivery with clear gates so new experiences can ship progressively.

---

## Google Workspace integration (Mail · Calendar · Tasks)

### Objectives

* Provide a single Google OAuth connection that powers mail triage, calendar sync, and bidirectional task management.
* Keep the Tasks module, project boards, and calendar rail in lockstep with Google Task lists while supporting drag/drop ergonomics.
* Ensure shared providers, telemetry, and docs stay aligned with the broader unified UI milestones.

### Key deliverables

* `settings` integration card for Google Workspace (OAuth, secure storage, per-module toggles).
* Multi-surface Google Tasks sync service with incremental polling, conflict handling, and drag/drop support.
* Shared task list metadata and filters across Tasks module, calendar rail, and project boards.
* Updated roadmap/docs (`Guidelines.md`, Assistant roadmap) and instrumentation for Google sync health.

### Execution sequence

1. **Unify Google OAuth & provider settings** – add Google Workspace provider card, secure token storage, module toggles, and refresh handling.
2. **Google Tasks sync foundation** – create `googleTasksSyncService`, extend `taskStore` schema (`externalId`, `listId`, `pendingSync`, `clientMutationId`), replace localStorage persistence, add background poller.
3. **Task list management & rail filtering** – hydrate Google task lists, expose selectors, update calendar rail dropdown (All vs per-list), route new tasks to the active list, show sync states.
4. **Kanban drag/drop & ordering** – integrate drag/drop library, use `tasks.move` for intra-list ordering, insert/delete for cross-list moves, encode board metadata in task notes, guard with optimistic updates & rollback.
5. **Project kanban alignment** – map project columns to Google Task lists, filter shared store by `projectId`, wire quick actions, surface conflict notices.
6. **Main Tasks module alignment** – remove mock data, rely on shared store selectors, ensure search/bulk actions respect pending sync, hook Quick Assistant task flow to shared service.
7. **Mail & calendar sync adjustments** – refactor services to reuse Google credential, keep calendar rail reactive, suppress `pendingSync` tasks in agendas.
8. **Quick Assistant enhancements** – ship Ask-AI fallback, confidence UI, provider persistence, and regression tests.
9. **Context Panel rollout** – finish migrating Notes/Tasks panes to shared `ContextPanel`, wire Project Insights data, drop duplicate upcoming events.
10. **Command palette & global search** – hook `CommandPalette` into App shell, add adapters for navigation/creation.
11. **Dashboard data wiring** – swap mock data for live stores with skeletons, keep card caps and scoped links.
12. **Documentation & tokens** – update this roadmap, `docs/guidelines/Guidelines.md`, and token reference for Insights usage.
13. **Testing & instrumentation** – add integration/e2e coverage for sync scenarios, instrument `tasks.sync.*` events, verify lint/type/e2e suites.
14. **Cleanup & follow-ups** – remove mock/localStorage remnants, resolve TODO markers, record changes in `CHANGELOG.md`.

#### Status – 2025-10-15

* ✅ Google Workspace provider card & shared settings store scaffolded (Settings → Accounts) with per-module toggles; secure storage hooks in place.
* 🔄 OAuth browser handoff now generates PKCE pairs and exchanges auth codes for tokens via deep link (desktop); finalize non-desktop callback handling and token hydration.
* 🔄 Tasks sync foundation in progress — Zustand-backed store now tracks Google IDs, mutation queue, and background poller scaffolding; wire actual Google Tasks fetch/mutation flow next.
* ✅ Calendar tasks rail consumes shared task list metadata so filters stay aligned once Google lists hydrate; falls back to default lanes until remote data arrives.
* 🔄 Drag/drop + cross-list move design approved; awaiting sync foundation before UI wiring.

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

* ✅ `QuickAssistantProvider` lives in `components/assistant/QuickAssistantProvider.tsx`, centralizing slash capture and wiring the quick modals across the app shell.
* ✅ Global hotkeys (`⌘/Ctrl+K`, `T`, `N`, `E`) are live; provider emits `assistant.opened|submitted|error` and `assistant.command_selected` events.
* ✅ Selection-aware dialog + writing tools now execute via providers and apply Replace/Insert inline.
* ✅ Floating launcher FAB (sidebar) ships with tooltip + selection badge handoff.
* 🔄 Ask AI fallback + history still in backlog; track in `docs/assistant/Advanced-Assistant-Roadmap.md`.

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
* 🔄 Right pane still renders `ProjectContextPanel` (Context | Settings) and continues to surface "Upcoming events"—needs the Insights tab swap and dedupe.
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

* ❌ Insights tab not yet wired; `ProjectContextPanel.tsx` still defines Context | Settings with upcoming events list.
* ❌ `ProjectInsightsPanel` component is not present in the codebase; needs implementation per snippet above.
* 🔄 Tokens (`--panel-*`, `--hover-bg`, `--tripane-border`) already exist in `styles/globals.css`, so styling groundwork is ready once the component lands.

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
* 🔄 Chat, Tasks, Notes, and Projects panes still need to migrate from bespoke panels to the shared abstraction.
* ❌ Projects pane still shows upcoming events; Insights tab from §2A must replace it and align the tab labels.

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
