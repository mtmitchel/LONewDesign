# Changelog

All notable changes to LibreOllama Desktop will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Archived
- Moved legacy mail modules to `archive/`:
  - components/modules/MailModule.tsx
  - components/modules/MailModuleTriPaneRefactored.tsx
  - components/modules/MailModuleTriPaneWithEdgeHandles.tsx

### Changed
- Consolidated on `MailModuleTriPane` with bottom toggles only; removed edge-handle variants.
- Navigation: removed 'TriPane Edge Handles' from sidebar; 'Mail' now routes to TriPane.


### Added
- Compose: v1.0 baseline locked (dock-in-center, Gmail-parity envelope, two-tier toolbar, motion + radius tokens)
- Visual polish: tokenized hover, hairline dividers, tertiary placeholder text, neutral header tone

### Stability
- This Compose baseline is approved for reuse across modules as the design-system reference for email composition


### Known Issues
- Email overlay inline reply remains a stopgap; it is still poorly designed and needs dedicated UX work before release.


### Added
- Initial Tauri + React + TypeScript foundation
- Dynamic port selection for development (`dev:smart` and `tauri:dev:smart` scripts)
- Complete design token system based on LibreOllama Design Token Sheet
- TriPane Mail module with keyboard shortcuts (`[` `]` `\`)
- Secure content sanitization with DOMPurify
- Cross-platform desktop application support
- Vite + Tailwind CSS build system
- Comprehensive UI component library (shadcn/ui + Radix)

### Security
- Implemented strict Content Security Policy (CSP)
- HTML content sanitization for email rendering
- Disabled shell access in Tauri configuration

### Infrastructure
- Automated port conflict resolution
- Hot module replacement for development
- Production build optimization
- Icon assets for desktop application

### Changed
- Compose: Docked to Mail list (center) pane with absolute positioning and stable z-index; unaffected by Context panel toggles.
- ComposeToolbar: Refactored to two-tier Gmail layout (Formatting Bar + Utility Row) with consistent sizing, spacing, and rounded formatting bar.
- Tokens: Added/standardized compose tokens (header background, divider, toolbar height/bg).

### Fixed
- ComposeEnvelope: Gmail-accurate Recipients state machine (collapsed ↔ expanded) with auto-reset on blur; Subject independent; autoFocus on expand.
- Removed all horizontal scrollbars in compose (min-w-0, overflow-x-hidden, hide-scrollbar on formatting bar, editor break-words).
- Resolved non-boolean jsx warning by moving placeholder styling to global CSS.
- Eliminated ref warnings by forwarding refs in TooltipTrigger, DropdownMenuTrigger, and PopoverTrigger.

### Accessibility
- ARIA labels, tooltips, focus order, and focus management improved across compose.

## [0.1.0] - 2024-XX-XX

### Added
- Initial project setup and foundation
- Desktop application shell with Tauri
- React frontend with TypeScript
- Design system implementation
- Mail module with tri-pane layout

### Technical Details
- **Framework**: Tauri 2.1 + React 18 + TypeScript 5.6
- **Build System**: Vite 5.4 + Tailwind CSS 3.4
- **UI Components**: Radix UI + shadcn/ui
- **Security**: DOMPurify + Strict CSP
- **Development**: Dynamic port selection + HMR