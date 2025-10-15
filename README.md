# ∴ (Tauri + React)

> **New here?** Start with `docs/roadmap/Unified-Workspace-Roadmap.md` for the complete product and engineering roadmap showing what's in progress, what's next, and what's complete. For development setup and coding conventions, see `docs/guidelines/Guidelines.md`.

## Prereqs
- Node.js 18+
- Rust + Cargo (stable)
- Tauri CLI (via devDependency)

## Dev
- npm install
- npm run dev (web only)
- npm run dev:smart (web with dynamic port detection)
- npm run tauri:dev (desktop - fixed port 5173)
- npm run tauri:dev:smart (desktop with dynamic port detection)

## Build
- npm run build
- npm run tauri:build

## Dynamic Port Selection
The `:smart` scripts automatically detect if port 5173 is busy and:
- Find the next available port (5174, 5175, etc.)
- Update Tauri configuration automatically
- Start the dev server on the available port

This prevents "port already in use" errors when running multiple instances.

## Notes
- Design tokens live in `styles/globals.css` and `docs/technical/design-tokens-reference.md`.
- Assistant roadmap + testing lives in `docs/assistant/Advanced-Assistant-Roadmap.md`.
- Component coverage + usage patterns sit in `docs/technical/therefore-UI-Kit-Plan.md`.
- Unified product + engineering roadmap (incl. **Google Tasks Local‑First Sync Refactor**) lives in `docs/roadmap/Unified-Workspace-Roadmap.md` — search for that heading; former standalone plan is now a stub pointer.
- Local Ollama providers are supported for Assistant + Chat (configure under Settings → Local models and Assistant → Model defaults).
- Keyboard: `[` hides left pane, `]` shows left pane, `\` toggles right context.
- Use `:smart` variants for automatic port management.
