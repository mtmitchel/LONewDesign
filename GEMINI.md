## Project Overview

This is a desktop application built with Tauri, React, and TypeScript. It uses Vite for the frontend build process. The application appears to be a productivity tool, with features like a calendar, tasks, notes, and a chat module. It also has a "Canvas" feature, which might be a freeform organizational tool.

## Building and Running

### Prerequisites

- Node.js 18+
- Rust + Cargo (stable)
- Tauri CLI (`npm install -g @tauri-apps/cli`)

### Development

- **Web Only:** `npm run dev`
- **Web with Dynamic Port:** `npm run dev:smart`
- **Desktop:** `npm run tauri:dev`
- **Desktop with Dynamic Port:** `npm run tauri:dev:smart`

### Building

- **Web:** `npm run build`
- **Desktop:** `npm run tauri:build`

### Testing

- **Run all tests:** `npm test`
- **Run tests with UI:** `npm run test:ui`
- **Run tests once:** `npm run test:run`
- **Generate test coverage:** `npm run test:coverage`

## Development Conventions

- **UI Components:** The project uses a combination of custom components and components from a library like ShadCN/UI (based on the file structure in `components/ui`).
- **State Management:** Zustand is used for state management.
- **Styling:** Tailwind CSS is used for styling.
- **Linting and Formatting:** The project likely uses Prettier and ESLint, but the configuration files are not present in the provided file list.
- **Tauri:** The application uses Tauri to create a desktop application from the web frontend. The Tauri configuration is in `src-tauri/tauri.conf.json`.
- **Aliases:** The `vite.config.ts` file defines several aliases for paths, which should be used when importing modules.
