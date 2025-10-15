# Repository Guidelines

## Project structure and module organization
∴ blends a Vite/React front end with a Tauri shell. Web entry points live in `main.tsx` and `App.tsx`; feature flows sit in `components/modules`, reusable primitives in `components/ui`, and reference demos/specs under `components/extended` and `components/figma`. Global styling and tokens stay in `styles/globals.css` and `tailwind.config.ts`. Tauri-native code resides in `src-tauri/src/main.rs` with configuration in `src-tauri/tauri.conf.json`. Archived experiments remain in `archive/` for inspiration only.

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

## Testing guidelines
There is no dedicated test runner yet; rely on `npm run type-check` plus manual validation in both the browser and the Tauri window. When adding stateful or data-heavy modules, scaffold Vitest + React Testing Library specs alongside the component (e.g., `Component.test.tsx`) and document the exercise in your PR. Guard any Rust commands surfaced from `src-tauri` with integration checks or a detailed manual test script.

## Commit and pull request guidelines
History favors concise, present-tense summaries (`Fix inline reply toolbar`, `Record overlay refinements`). Keep subjects ≤72 characters and scope them by module or feature. PRs should spell out the change, note Vite/Tauri/type-check results, and attach before/after visuals for UI updates. Link relevant planning notes from `guidelines/` or `LibreOllama-UI-Kit-Plan.md` to show alignment.

## Configuration tips
`npm run dev:smart` leaves `.bak` files after port rewrites—delete them before committing. Do not hardcode secrets in `tauri.conf.json`; prefer environment variables and keep the CSP tidy after any port edits.
