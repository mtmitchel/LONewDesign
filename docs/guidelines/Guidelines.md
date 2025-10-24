# Repository guidelines

> **New developer onboarding:** First read `../roadmap/Unified-Workspace-Roadmap.md` to understand what's being built and current progress. Then return here for coding conventions, build commands, and contribution guidelines.

## Pre-flight checklist (before starting work)

Before writing any code, complete these steps in order:

1. **Read context documents** (15-20 min first time, 2-3 min for updates):
   - `docs/roadmap/Unified-Workspace-Roadmap.md` — Find your task, understand its context and dependencies
   - `docs/guidelines/Guidelines.md` (this file) — Review coding conventions and project structure
   - `state-and-sync-guide.md` — If touching state management, understand Zustand patterns and backend-heavy architecture
   - `docs/technical/design-tokens-reference.md` — If touching UI/styles, review design system tokens

2. **Find your task assignment**:
   - Check roadmap for phase/section with your work (look for 🔄 in-progress markers)
   - Read implementation plan if one exists (`docs/implementation/*.md`)
   - Check if related GitHub issues or PR discussions exist

3. **Verify development environment**:
   - Run `npm install` if dependencies may have changed
   - Run `npm run type-check` to ensure clean baseline (should be 0 errors)
   - Verify app runs: `npm run tauri:dev` or `npm run dev` (don't restart if already running)
   
4. **Check for related work**:
   - Search codebase for similar patterns (`grep` or semantic search)
   - Review recently changed files in git history that touch related code
   - Check `CHANGELOG.md` for recent related changes

5. **Plan before coding** (for non-trivial tasks):
   - Break task into subtasks if complex (>3 files or >200 lines changed)
   - Identify which files need changes and what functions/components affected
   - Consider what documentation will need updating (see post-completion checklist)

**Quick reference**: For small fixes (<50 lines, 1-2 files), steps 1-3 sufficient. For features/refactors, complete all 5.

## Post-completion checklist (after finishing work)

After code is written and tested, complete these steps before marking task done:

1. **Verify code quality**:
   - Run `npm run type-check` — must show 0 errors
   - Test manually in running app — verify feature works as expected
   - Check console for errors/warnings related to your changes
   - Verify no regressions in related features

2. **Update documentation** (in this order):
   - `CHANGELOG.md` — Add entry under `[Unreleased]` section using [Keep a Changelog](https://keepachangelog.com) format
   - `docs/roadmap/Unified-Workspace-Roadmap.md` — Update status from 🔄 to ✅ for completed items, add notes if needed
   - Implementation plan (if exists) — Update status/progress in `docs/implementation/*.md`
   - Technical docs (if changed) — Update `docs/technical/design-tokens-reference.md` if tokens added/changed
   - Assistant roadmap (if relevant) — Update `docs/assistant/Advanced-Assistant-Roadmap.md` if AI features touched

3. **Clean up workspace**:
   - Remove debug console.logs and commented-out code
   - Delete any temporary/test files created during development
   - Ensure no `.bak` or other backup files accidentally committed
   - Review `git status` and `git diff` before committing

4. **Commit with clear message**:
   - Use present-tense verb (feat/fix/docs/refactor/test/chore)
   - Keep subject ≤72 chars, scope by module
   - Example: `feat(tasks): add priority picker to inline composer`
   - Example: `fix(sync): prevent duplicate tasks during manual sync`
   - Reference roadmap section or issue if applicable

5. **Update memory graph** (for significant features/decisions):
   - Use MCP memory tools to document new patterns, architectural decisions, or guidelines
   - Link new entities to `∴` project entity
   - Add observations about what was learned or what future developers should know

**Quick reference**: For small fixes, steps 1-4 required. For features/architecture changes, complete all 5.

## Project structure and module organization
∴ blends a Vite/React front end with a Tauri shell. Web entry points live in `main.tsx` and `App.tsx`; feature flows sit in `components/modules`, reusable primitives in `components/ui`, and reference demos/specs under `components/extended` and `components/figma`. Global styling and tokens stay in `styles/globals.css` and `tailwind.config.ts`. Tauri-native code resides in `src-tauri/src/main.rs` with configuration in `src-tauri/tauri.conf.json`. Archived experiments remain in `archive/` for inspiration only.

### Tasks module layout (2025-10)
The Tasks experience was split out of the former monoliths. Relevant entry points:
- `components/modules/tasks/view/` — board/list shells, header, dialogs, and shared context provider.
- `components/modules/tasks/details/` — task drawer shell, header/panels, subtasks, activity feed, and `useTaskDetails` hook.
- `components/modules/tasks/store/` — Zustand store sliced into `core`, `actions/`, `helpers`, `selectors`, and colocated tests.
- `components/modules/calendar/tasks-rail/` — calendar rail views reuse the shared task card primitives.

Update these subpackages instead of reintroducing monolithic files. New features should add leaf components inside the appropriate folder and extend store actions via the existing module entry points.

### Canvas module architecture (2025-10)
The Canvas module (`components/modules/Canvas`) is undergoing a multi-track refactor to align Konva rendering with canonical store geometry and improve selection/transform reliability. Key resources:
- **[CanvasRefactorPlan.md](./CanvasRefactorPlan.md)** — Five-track roadmap (geometry alignment, reactive selectors, modularisation, spatial indexing, command-based history).
- **[Geometry.md](./Geometry.md)** — Canonical geometry conventions, connector positioning rules, selection bounds contracts.
- **[Canvas-Audit-Report.txt](../../Canvas-Audit-Report.txt)** — Technical audit identifying coordinate mismatches and architecture debt.

Active work lives on `refactor/sync-service-modularization`. Track 1 (canonical geometry) and Track 2 (reactive bounds selectors) are complete. When touching canvas code, ensure renderers consume geometry from store selectors rather than caching `selectBounds` on Konva nodes.

## Roadmap and planning
- The active roadmap lives at `docs/roadmap/Unified-Workspace-Roadmap.md` (formerly `Unified-UI-Redesign.md`). Update statuses there and link PRs to specific numbered phases or sections.
- Assistant-specific planning continues in `docs/assistant/Advanced-Assistant-Roadmap.md`; keep both documents in sync when scope overlaps.
- The **Google Tasks Local‑First Sync Refactor** (previously a standalone file) is now consolidated into the unified roadmap under that exact heading. Do not create standalone sync plan docs.
- For legacy frontend-heavy sync notes see `state-and-sync-guide.md` (header now points to the consolidated refactor section) — prefer backend-heavy architecture for new integrations.

## Build, test, and development commands
- `npm install` boots both web and Tauri dependencies.
- `npm run dev` serves the Vite app at `http://localhost:5173`.
- `npm run dev:smart` selects an open port and rewrites `tauri.conf.json` so Tauri points at the active dev server.
- `npm run tauri:dev` launches the native shell once Vite is running; combine with `dev:smart` for port safety.
- `npm run build` creates the web bundle in `dist/`; `npm run tauri:build` packages the desktop binaries.
- `npm run type-check` runs `tsc --noEmit`—treat it as a required pre-flight.

## Coding style and naming conventions
Use TypeScript functional components and colocate files with their nearest module. Favor PascalCase component files (`SidebarPanel.tsx`), camelCase utilities, and kebab-case assets. Follow the prevailing two-space indentation, single quotes, and trailing commas. Apply Tailwind utilities in JSX and centralize shared tokens via `tailwind.config.ts` or `styles/globals.css`. Prefer named exports unless a file exposes a single screen.

- Write UI copy in sentence case. Avoid ALL CAPS or Title Case for headings, section titles, and button labels unless required for acronyms.

### Documentation file naming
| Purpose | Convention | Example |
|---------|------------|---------|
| Product/engineering roadmap | PascalCase with `-Roadmap` suffix | `Unified-Workspace-Roadmap.md` |
| Module / feature deep spec | PascalCase or descriptive kebab-case (match existing family) | `Advanced-Assistant-Roadmap.md` |
| Implementation plan (temporary) | kebab-case | `settings-modularization-plan.md` |
| Archive snapshot | PascalCase with date stamp (YYYY-MM-DD) | `Sync-Refactor-Master-Plan-2025-10-15.md` |
| Stub/redirect | PascalCase with `-Stub` suffix | `Sync-Refactor-Master-Plan-Stub.md` |

Rules:
1. Prefer updating an existing roadmap section over adding a new top-level file.
2. Archive replaced docs under `docs/archive/` with a datestamped filename and add a stub pointer if inbound links may exist.
3. Sentence case for all Markdown headings (capitalize only first word and proper nouns).
4. Avoid introducing new snake_case or ALLCAPS filenames; keep legacy ones only as stubs until irrelevant.
5. If renaming would break external references, keep the old file as a stub with a pointer comment.

## Finding open tasks and work items

**Where to look for work:**

1. **Primary source**: `docs/roadmap/Unified-Workspace-Roadmap.md`
   - Look for 🔄 (in progress) or ⏳ (pending) markers
   - Each numbered section/phase lists specific tasks with status
   - Check "Google Tasks Local‑First Sync Refactor" section for sync-related work
   - Assistant/AI work tracked in section 1 or see `docs/assistant/Advanced-Assistant-Roadmap.md`

2. **Implementation details**: `docs/implementation/*.md`
   - `settings-modularization-plan.md` — Settings refactor tasks
   - `Compose-Baseline-V1.md` — Gmail-style compose modal spec
   - `Sync-Refactor-Master-Plan-Stub.md` — Points to consolidated roadmap section

3. **Reference for context**:
   - `CHANGELOG.md` — Recent changes and what's been completed
   - `docs/README.md` — Index of all documentation with descriptions
   - GitHub issues/PRs — Check for open discussions or blocked work

**How to identify your next task:**
- Ask maintainer for assignment OR
- Look for 🔄 items in roadmap that match your skills OR  
- Check `CHANGELOG.md` [Unreleased] section for in-progress work
- Avoid starting new ⏳ tasks without discussing dependencies first

## Testing guidelines
There is no dedicated test runner yet; rely on `npm run type-check` plus manual validation in both the browser and the Tauri window. When adding stateful or data-heavy modules, scaffold Vitest + React Testing Library specs alongside the component (e.g., `Component.test.tsx`) and document the exercise in your PR. Guard any Rust commands surfaced from `src-tauri` with integration checks or a detailed manual test script.

## Commit and pull request guidelines
History favors concise, present-tense summaries (`Fix inline reply toolbar`, `Record overlay refinements`). Keep subjects ≤72 characters and scope them by module or feature. PRs should spell out the change, note Vite/Tauri/type-check results, and attach before/after visuals for UI updates. Link relevant planning notes from `guidelines/` or `LibreOllama-UI-Kit-Plan.md` to show alignment.

## Configuration tips
`npm run dev:smart` leaves `.bak` files after port rewrites—delete them before committing. Do not hardcode secrets in `tauri.conf.json`; prefer environment variables and keep the CSP tidy after any port edits.
