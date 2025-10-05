# LibreOllama Desktop – Tauri Migration Master Plan

This document defines the high-level goals, execution plan, and concrete tasks to convert the current React UI into a Rust Tauri desktop application while preserving the design system and focusing on the TriPane Mail module first.

## Goals
- Scaffold a secure Tauri desktop app (Rust backend + Vite React TypeScript frontend).
- Keep existing component structure and token-driven theming (styles/globals.css, design-tokens.md).
- Finalize TriPane Mail module behavior (keyboard, caret toggles, consistent layout).
- Ensure secure content rendering (sanitize email HTML).
- Provide dev/build scripts and documentation.

## Execution Overview
1) Initialize Vite + TypeScript + Tailwind at the repo root (no file moves).
2) Scaffold Tauri under `src-tauri` with secure defaults and CSP.
3) Normalize Radix UI imports (remove version suffixes).
4) Ensure design tokens flow through Tailwind build and UI.
5) Sanitize `EmailOverlay` HTML content.
6) Finalize TriPane Mail module keyboard behavior.
7) Harden CSP and allowlist.
8) Document run/build steps.

## Structured Plan (Executable Tasks)

implemented
```json
{
  "executable_tasks": [
    {
      "task_id": "init-frontend-vite-tailwind",
      "description": "Initialize Vite + React + TypeScript + Tailwind front-end without moving existing component files",
      "target_files": [
        { "path": "package.json", "line_range": "1-EOF" },
        { "path": "index.html", "line_range": "1-EOF" },
        { "path": "main.tsx", "line_range": "1-EOF" },
        { "path": "vite.config.ts", "line_range": "1-EOF" },
        { "path": "tsconfig.json", "line_range": "1-EOF" },
        { "path": "tsconfig.node.json", "line_range": "1-EOF" },
        { "path": "postcss.config.cjs", "line_range": "1-EOF" },
        { "path": "tailwind.config.ts", "line_range": "1-EOF" }
      ],
      "code_changes": [
        {
          "operation": "insert",
          "find_pattern": "",
          "replace_with": "{\n  \"name\": \"libreollama-desktop\",\n  \"private\": true,\n  \"version\": \"0.1.0\",\n  \"type\": \"module\",\n  \"scripts\": {\n    \"dev\": \"vite\",\n    \"build\": \"vite build\",\n    \"preview\": \"vite preview\",\n    \"tauri:dev\": \"tauri dev\",\n    \"tauri:build\": \"tauri build\",\n    \"type-check\": \"tsc --noEmit\"\n  },\n  \"dependencies\": {\n    \"react\": \"^18.3.1\",\n    \"react-dom\": \"^18.3.1\",\n    \"dompurify\": \"^3.0.6\"\n  },\n  \"devDependencies\": {\n    \"@tauri-apps/cli\": \"^2.0.0\",\n    \"@types/react\": \"^18.3.3\",\n    \"@types/react-dom\": \"^18.3.0\",\n    \"autoprefixer\": \"^10.4.20\",\n    \"postcss\": \"^8.4.47\",\n    \"tailwindcss\": \"^3.4.12\",\n    \"typescript\": \"^5.6.2\",\n    \"vite\": \"^5.4.6\"\n  }\n}\n",
          "line_number": "1"
        },
        {
          "operation": "insert",
          "find_pattern": "",
          "replace_with": "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>LibreOllama Desktop</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/main.tsx\"></script>\n  </body>\n</html>\n",
          "line_number": "1"
        },
        {
          "operation": "insert",
          "find_pattern": "",
          "replace_with": "import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport './styles/globals.css';\nimport App from './App';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);\n",
          "line_number": "1"
        },
        {
          "operation": "insert",
          "find_pattern": "",
          "replace_with": "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\n// https://tauri.app/v1/guides/getting-started/setup/vite/#vite-configuration\nexport default defineConfig(() => ({\n  plugins: [react()],\n  server: {\n    port: 5173,\n    strictPort: true,\n    // Tauri recommends these for dev\n    hmr: { overlay: true }\n  },\n  build: {\n    target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',\n    outDir: 'dist'\n  },\n  optimizeDeps: {\n    exclude: []\n  }\n}));\n",
          "line_number": "1"
        },
        {
          "operation": "insert",
          "find_pattern": "",
          "replace_with": "{\n  \"compilerOptions\": {\n    \"target\": \"ES2021\",\n    \"useDefineForClassFields\": true,\n    \"lib\": [\"ES2021\", \"DOM\", \"DOM.Iterable\"],\n    \"module\": \"ESNext\",\n    \"skipLibCheck\": true,\n    \"jsx\": \"react-jsx\",\n    \"moduleResolution\": \"bundler\",\n    \"resolveJsonModule\": true,\n    \"isolatedModules\": true,\n    \"noEmit\": true,\n    \"esModuleInterop\": true,\n    \"allowJs\": false,\n    \"strict\": true,\n    \"types\": [\"dompurify\"]\n  },\n  \"include\": [\"**/*.ts\", \"**/*.tsx\"],\n  \"exclude\": [\"node_modules\", \"src-tauri\"]\n}\n",
          "line_number": "1"
        },
        {
          "operation": "insert",
          "find_pattern": "",
          "replace_with": "{\n  \"compilerOptions\": {\n    \"composite\": true,\n    \"module\": \"ESNext\",\n    \"moduleResolution\": \"bundler\",\n    \"allowSyntheticDefaultImports\": true\n  },\n  \"include\": [\"vite.config.ts\"]\n}\n",
          "line_number": "1"
        },
        {
          "operation": "insert",
          "find_pattern": "",
          "replace_with": "module.exports = {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n};\n",
          "line_number": "1"
        },
        {
          "operation": "insert",
          "find_pattern": "",
          "replace_with": "import type { Config } from 'tailwindcss';\n\nexport default {\n  darkMode: ['class'],\n  content: [\n    './index.html',\n    './App.tsx',\n    './components/**/*.{ts,tsx}',\n    './components/**/**/*.{ts,tsx}',\n    './styles/**/*.{css}'\n  ],\n  theme: {\n    extend: {}\n  },\n  plugins: []\n} satisfies Config;\n",
          "line_number": "1"
        }
      ],
      "validation_steps": [
        "npm install",
        "npm run dev",
        "Load http://localhost:5173 and verify the current App renders with design tokens applied (check headers, borders, colors per globals.css)"
      ],
      "success_criteria": "Local dev server runs and renders the existing UI using Tailwind and globals.css without moving any component files.",
      "dependencies": [],
      "rollback_procedure": "Delete package.json, node_modules, index.html, main.tsx, vite.config.ts, tsconfig.json, tsconfig.node.json, tailwind.config.ts, postcss.config.cjs."
    },
    {
      "task_id": "scaffold-tauri",
      "description": "Add Rust Tauri scaffolding with secure defaults and dev/build integration",
      "target_files": [
        { "path": "src-tauri/Cargo.toml", "line_range": "1-EOF" },
        { "path": "src-tauri/tauri.conf.json", "line_range": "1-EOF" },
        { "path": "src-tauri/src/main.rs", "line_range": "1-EOF" }
      ],
      "code_changes": [
        {
          "operation": "insert",
          "find_pattern": "",
          "replace_with": "[package]\nname = \"libreollama_desktop\"\nversion = \"0.1.0\"\nedition = \"2021\"\n\n[build-dependencies]\n\n[dependencies]\n tauri = { version = \"=1.6.8\", features = [\"window-all\"] }\n\n[profile.release]\nopt-level = 3\n",
          "line_number": "1"
        },
        {
          "operation": "insert",
          "find_pattern": "",
          "replace_with": "{\n  \"$schema\": \"https://raw.githubusercontent.com/tauri-apps/tauri/v1/cli/schema.json\",\n  \"package\": {\n    \"productName\": \"LibreOllama Desktop\",\n    \"version\": \"0.1.0\"\n  },\n  \"tauri\": {\n    \"allowlist\": {\n      \"all\": false,\n      \"shell\": { \"all\": false, \"scope\": [] }\n    },\n    \"windows\": [\n      {\n        \"title\": \"LibreOllama Desktop\",\n        \"width\": 1280,\n        \"height\": 800,\n        \"resizable\": true\n      }\n    ],\n    \"security\": {\n      \"csp\": \"default-src 'self'; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' http://localhost:5173 ws://localhost:5173\"\n    },\n    \"updater\": { \"active\": false }\n  },\n  \"build\": {\n    \"beforeDevCommand\": \"vite\",\n    \"beforeBuildCommand\": \"vite build\",\n    \"devPath\": \"http://localhost:5173\",\n    \"distDir\": \"../dist\"\n  }\n}\n",
          "line_number": "1"
        },
        {
          "operation": "insert",
          "find_pattern": "",
          "replace_with": "//! Tauri main entry\n#![cfg_attr(not(debug_assertions), windows_subsystem = \"windows\")]\n\nfn main() {\n  tauri::Builder::default()\n    .run(tauri::generate_context!())\n    .expect(\"error while running tauri application\");\n}\n",
          "line_number": "1"
        }
      ],
      "validation_steps": [
        "npm run tauri:dev",
        "Verify a desktop window launches loading the Vite dev server content",
        "npm run build && npm run tauri:build (ensures bundling works)"
      ],
      "success_criteria": "A Tauri desktop window opens in dev, and a production build can be created.",
      "dependencies": ["init-frontend-vite-tailwind"],
      "rollback_procedure": "Delete the src-tauri directory."
    },
    {
      "task_id": "fix-radix-import-specifiers",
      "description": "Normalize Radix UI import specifiers by removing inline version suffixes that break bundling",
      "target_files": [
        { "path": "components/ui/avatar.tsx", "line_range": "1-80" },
        { "path": "components/ui/toggle-group.tsx", "line_range": "1-120" },
        { "path": "components/ui/breadcrumb.tsx", "line_range": "1-120" },
        { "path": "components/ui/checkbox.tsx", "line_range": "1-140" },
        { "path": "components/ui/form.tsx", "line_range": "1-200" },
        { "path": "components/ui/popover.tsx", "line_range": "1-160" },
        { "path": "components/ui/dialog.tsx", "line_range": "1-200" },
        { "path": "components/ui/alert-dialog.tsx", "line_range": "1-200" },
        { "path": "components/ui/tooltip.tsx", "line_range": "1-160" },
        { "path": "components/ui/progress.tsx", "line_range": "1-140" },
        { "path": "components/ui/slider.tsx", "line_range": "1-160" },
        { "path": "components/ui/collapsible.tsx", "line_range": "1-160" },
        { "path": "components/ui/separator.tsx", "line_range": "1-120" },
        { "path": "components/ui/sidebar.tsx", "line_range": "1-240" },
        { "path": "components/ui/radio-group.tsx", "line_range": "1-160" },
        { "path": "components/ui/hover-card.tsx", "line_range": "1-160" },
        { "path": "components/ui/dropdown-menu.tsx", "line_range": "1-240" },
        { "path": "components/ui/aspect-ratio.tsx", "line_range": "1-80" },
        { "path": "components/ui/label.tsx", "line_range": "1-120" },
        { "path": "components/ui/badge.tsx", "line_range": "1-120" },
        { "path": "components/ui/accordion.tsx", "line_range": "1-200" },
        { "path": "components/ui/tabs.tsx", "line_range": "1-200" },
        { "path": "components/ui/sheet.tsx", "line_range": "1-200" },
        { "path": "components/ui/navigation-menu.tsx", "line_range": "1-240" },
        { "path": "components/ui/context-menu.tsx", "line_range": "1-200" },
        { "path": "components/ui/button.tsx", "line_range": "1-200" },
        { "path": "components/ui/toggle.tsx", "line_range": "1-160" },
        { "path": "components/ui/scroll-area.tsx", "line_range": "1-160" },
        { "path": "components/ui/select.tsx", "line_range": "1-240" },
        { "path": "components/ui/switch.tsx", "line_range": "1-160" },
        { "path": "components/ui/menubar.tsx", "line_range": "1-240" }
      ],
      "code_changes": [
        {
          "operation": "replace",
          "find_pattern": "from\\s\"(@radix-ui\\/react-[a-z-]+)@[0-9.]+\"",
          "replace_with": "from \"$1\""
        },
        {
          "operation": "replace",
          "find_pattern": "from\\s'(@radix-ui\\/react-[a-z-]+)@[0-9.]+'",
          "replace_with": "from '$1'"
        }
      ],
      "validation_steps": [
        "npm run type-check",
        "npm run dev",
        "Open the app and ensure no module resolution errors for Radix UI components"
      ],
      "success_criteria": "Build and dev server start without import resolution errors related to Radix UI packages.",
      "dependencies": ["init-frontend-vite-tailwind"],
      "rollback_procedure": "Revert modified files to previous import specifiers."
    },
    {
      "task_id": "wire-design-tokens-tailwind",
      "description": "Ensure Tailwind processes globals.css and tokens apply across UI",
      "target_files": [
        { "path": "main.tsx", "line_range": "1-40" },
        { "path": "styles/globals.css", "line_range": "1-344" },
        { "path": "tailwind.config.ts", "line_range": "1-80" }
      ],
      "code_changes": [
        {
          "operation": "replace",
          "find_pattern": "import './styles/globals.css';",
          "replace_with": "import './styles/globals.css'; // keep tokens as single source of truth, see design-tokens.md"
        }
      ],
      "validation_steps": [
        "npm run dev",
        "Visually verify tokenized colors and spacing on TriPane headers and mail list",
        "Cross-check with design-tokens.md and LibreOllama-UI-Kit-Plan.md"
      ],
      "success_criteria": "UI renders with correct tokenized colors, spacing, and borders; no hardcoded overrides fight tokens.",
      "dependencies": ["init-frontend-vite-tailwind"],
      "rollback_procedure": "Restore previous import line if needed."
    },
    {
      "task_id": "sanitize-emailoverlay",
      "description": "Sanitize email HTML content in EmailOverlay for Tauri security",
      "target_files": [
        {
          "path": "components/EmailOverlay.tsx",
          "line_range": "150-180",
          "function_name": "EmailOverlay"
        }
      ],
      "code_changes": [
        {
          "operation": "insert",
          "find_pattern": "import React from 'react';",
          "replace_with": "import React from 'react';\nimport DOMPurify from 'dompurify';"
        },
        {
          "operation": "replace",
          "find_pattern": "dangerouslySetInnerHTML=\\{\\{ __html: email\\.content \\}\\}",
          "replace_with": "dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(email.content, { USE_PROFILES: { html: true } }) }}"
        }
      ],
      "validation_steps": [
        "npm run dev",
        "Open an email in the overlay and verify rendering is unchanged",
        "Confirm devtools shows sanitized HTML (no script tags)"
      ],
      "success_criteria": "Overlay renders sanitized content with no behavioral regressions.",
      "dependencies": ["init-frontend-vite-tailwind"],
      "rollback_procedure": "Remove DOMPurify import and revert to raw email.content usage."
    },
    {
      "task_id": "refine-mail-tripane-keyboard",
      "description": "Unify keyboard shortcut logic for left/right pane toggles in MailModuleTriPane",
      "target_files": [
        {
          "path": "components/modules/MailModuleTriPane.tsx",
          "line_range": "36-60",
          "function_name": "MailModuleTriPane"
        }
      ],
      "code_changes": [
        {
          "operation": "replace",
          "find_pattern": "const handleKeyDown = \\(e: KeyboardEvent\\) => \\{[\\s\\S]*?\\};",
          "replace_with": "const handleKeyDown = (e: KeyboardEvent) => {\n  // [ ] control left pane; \\\\ controls right pane; ignore when meta/ctrl pressed\n  if (e.metaKey || e.ctrlKey) return;\n  if (e.key === '[') {\n    e.preventDefault();\n    setLeftPaneVisible(false);\n  } else if (e.key === ']') {\n    e.preventDefault();\n    setLeftPaneVisible(true);\n  } else if (e.key === '\\\\') {\n    e.preventDefault();\n    setRightPaneVisible(!rightPaneVisible);\n  }\n};"
        }
      ],
      "validation_steps": [
        "npm run dev",
        "Manual test: press [ to hide left pane, ] to show, and \\ to toggle right context",
        "Verify no console warnings for duplicate listeners"
      ],
      "success_criteria": "Consistent, conflict-free keyboard behavior for pane toggles.",
      "dependencies": ["init-frontend-vite-tailwind"],
      "rollback_procedure": "Restore original handleKeyDown block."
    },
    {
      "task_id": "add-tauri-secure-csp",
      "description": "Harden Tauri CSP and allowlist to reduce attack surface (no shell scope)",
      "target_files": [
        { "path": "src-tauri/tauri.conf.json", "line_range": "1-200" }
      ],
      "code_changes": [
        {
          "operation": "replace",
          "find_pattern": "\"allowlist\": \\{[\\s\\S]*?\\},",
          "replace_with": "\"allowlist\": { \"all\": false, \"shell\": { \"all\": false, \"scope\": [] } },"
        },
        {
          "operation": "replace",
          "find_pattern": "\"security\": \\{[\\s\\S]*?\\}",
          "replace_with": "\"security\": { \"csp\": \"default-src 'self'; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' http://localhost:5173 ws://localhost:5173\" }"
        }
      ],
      "validation_steps": [
        "npm run tauri:dev",
        "Verify app functions locally (no blocked requests) and CSP is effective in devtools Security panel"
      ],
      "success_criteria": "App runs under a strict CSP with shell disabled.",
      "dependencies": ["scaffold-tauri"],
      "rollback_procedure": "Restore the previous tauri.conf.json."
    },
    {
      "task_id": "document-build-run",
      "description": "Add README build/run instructions and align with design docs",
      "target_files": [
        { "path": "README.md", "line_range": "1-EOF" }
      ],
      "code_changes": [
        {
          "operation": "insert",
          "find_pattern": "",
          "replace_with": "# LibreOllama Desktop (Tauri + React)\n\n## Prereqs\n- Node.js 18+\n- Rust + Cargo (stable)\n- Tauri CLI (via devDependency)\n\n## Dev\n- npm install\n- npm run dev (web)\n- npm run tauri:dev (desktop)\n\n## Build\n- npm run build\n- npm run tauri:build\n\n## Notes\n- Design tokens live in styles/globals.css and design-tokens.md\n- See LibreOllama-UI-Kit-Plan.md for component coverage\n- Keyboard: [ hides left pane, ] shows left pane, \\\\ toggles right context\n"
        }
      ],
      "validation_steps": [
        "Open README.md and verify accurate steps"
      ],
      "success_criteria": "Developers can build/run the desktop app using README instructions.",
      "dependencies": ["init-frontend-vite-tailwind", "scaffold-tauri"],
      "rollback_procedure": "Remove README.md if undesired."
    }
  ],
  "execution_order": [
    "init-frontend-vite-tailwind",
    "scaffold-tauri",
    "fix-radix-import-specifiers",
    "wire-design-tokens-tailwind",
    "sanitize-emailoverlay",
    "refine-mail-tripane-keyboard",
    "add-tauri-secure-csp",
    "document-build-run"
  ],
  "critical_warnings": [
    "Do not move existing component files; imports are currently relative to project root. Vite is configured to keep entry at root (main.tsx) to avoid churn.",
    "Radix UI import specifiers with inline version suffixes will break bundling. Replacements must be exact and global.",
    "CSP is strict; loading remote resources or inline scripts may be blocked. Ensure all assets are local or permitted by CSP.",
    "Using dangerouslySetInnerHTML requires sanitization (task sanitize-emailoverlay).",
    "When packaging (tauri build), distDir must match vite build output (dist) or app will render a blank screen."
  ]
}
```

## Quick Start (after tasks 1–2)
- npm install
- npm run dev (web preview)
- npm run tauri:dev (desktop dev)
- npm run build && npm run tauri:build (production build)

## References
- design-tokens.md
- LibreOllama-UI-Kit-Plan.md
- components/modules/MailModuleTriPane.tsx (primary module)
- components/PaneCaret.tsx and components/PaneCaretSpec.tsx

## Next Steps
- Execute tasks in the listed order.
- Validate UI matches tokens and Figma design.
- Plan follow-ups for Dashboard, Chat, Notes modules after Mail TriPane completion.
