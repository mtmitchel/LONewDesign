# Documentation index

> **🚀 Start here:** New to the project? Read `roadmap/Unified-Workspace-Roadmap.md` for the complete product and engineering roadmap, then `guidelines/Guidelines.md` for development conventions. Everything else is reference material.

Authoritative entry points for planning, architecture, and implementation. Keep this file updated when adding or archiving major documents.

## Core roadmaps
- Unified product & engineering roadmap: `roadmap/Unified-Workspace-Roadmap.md` (contains Google Tasks Local‑First Sync Refactor section)
- Assistant focus roadmap: `assistant/Advanced-Assistant-Roadmap.md`

## Architecture & state
- Legacy + transition guidance: `../state-and-sync-guide.md` (header points to current backend-heavy approach).
- Design tokens reference: `technical/design-tokens-reference.md`
- UI kit & component usage: `technical/therefore-UI-Kit-Plan.md`
- Settings & modularization plans (implementation details): `implementation/settings-modularization-plan.md`

## Guidelines & conventions
- Development guidelines: `guidelines/Guidelines.md`
- Changelog: `../CHANGELOG.md`

## Sync refactor artifacts
- Main section: "Google Tasks Local‑First Sync Refactor" in the Unified Workspace Roadmap
- Historical snapshot: `archive/Sync-Refactor-Master-Plan-2025-10-15.md`
- Stub pointer (legacy path): `implementation/Sync-Refactor-Master-Plan-Stub.md`

## Archived summaries
- Calendar streamline summary (Oct 2025): `archive/Calendar-Streamline-Summary-2025-10.md`
- Task panel polish summary (Oct 2025): `archive/Task-Panel-Polish-Summary-2025-10.md`

## Testing & quality
- Testing guides directory: `testing/`
- Mistral / Ollama provider testing: see files under `testing/` (add new guides there)

## Naming & capitalization (summary)
- Files: use PascalCase for multi-word conceptual specs (e.g., `Unified-Workspace-Roadmap.md`), kebab-case for lower-level implementation plans if already established. Avoid creating new snake_case or ALLCAPS filenames.
- Headings: Sentence case for all levels (capitalize first word + proper nouns, keep others lowercase).
- Use consistent section emojis sparingly (only if already in a related doc) — no new decorative variants.

## When adding a new doc
1. Decide if it extends an existing section in the unified roadmap; if yes, update that section instead.
2. If a standalone file is required, reference it here and cross-link from related sections.
3. Archive superseded docs by moving them under `archive/` with a datestamp and inserting a stub pointer at the old path if external links may exist.

