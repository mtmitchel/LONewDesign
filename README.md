# LibreOllama Desktop (Tauri + React)

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
- Design tokens live in styles/globals.css and design-tokens.md
- See LibreOllama-UI-Kit-Plan.md for component coverage
- Keyboard: [ hides left pane, ] shows left pane, \ toggles right context
- Use `:smart` variants for automatic port management