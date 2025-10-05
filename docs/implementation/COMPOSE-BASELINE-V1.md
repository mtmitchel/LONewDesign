# Compose Baseline v1.0 (LibreOllama Design System)

Approved production baseline for the Gmail-style docked Compose modal. This document captures visual, behavioral, and token alignment for future reuse and audits.

## Summary
- Docked inside Mail list (center) pane; unaffected by Context panel
- Envelope: Gmail-parity state machine (collapsed → expanded, auto-reset on blur)
- Subject: placeholder-only, `sr-only` label, a11y-linked
- Toolbar: Two-tier (Formatting Bar + Action Row), neutral tone
- Motion + Radius tokens applied

## Key Tokens
- Radius: `--radius-full: 9999px`, `--radius-lg`
- Motion: `--duration-fast: 150ms`, `--easing-standard: cubic-bezier(0.2, 0.8, 0.3, 1)`
- Surfaces: `--bg-surface`, `--bg-surface-elevated`
- Borders: `--border-subtle`, `--border-hairline`
- Text: `--text-primary`, `--text-secondary`, `--text-tertiary`
- Hover: `--hover-bg`

## Layout & Rhythm
- Dock insets: `bottom/right: var(--space-5)`
- Header: 40px
- Envelope rows (Recipients, Subject): 36px (h-9)
- Formatting Bar: 36px (h-9), rounded `--radius-full`
- Action Row: 40px (h-10)
- Tier gap: `var(--space-3)` (≈12px)

## Envelope Behavior
- Collapsed: “Recipients” with `Cc/Bcc` links on right
- Expanded: To/Cc/Bcc with chips; 56px label column for To/Cc/Bcc
- Blur auto-resets to collapsed when no chips and no Cc/Bcc
- Subject: placeholder, a11y label only (no visible label)

## Security
- DOMPurify sanitization for editor input and paste

## Accessibility
- Focus order: Recipients → Subject → Editor → Toolbar
- `sr-only` labels, `aria-labelledby` for Subject
- Tooltip and button `aria-label`s present

## Acceptance Checklist
- No horizontal scrollbars
- Dividers use hairline/subtle tokens
- Motion uses tokens (no hard-coded easing/durations)
- Compose remains docked within center pane regardless of Context pane state

## File References
- components/modules/compose/ComposeDocked.tsx
- components/modules/compose/ComposeEnvelope.tsx
- components/modules/compose/ComposeToolbar.tsx
- components/modules/compose/ComposeEditor.tsx
- styles/globals.css (tokens)

## Version
- Baseline: v1.0
- Date: 2025-10-05

Use this as the design-system reference for future modules (e.g., Notes editor, Chat composer) to ensure visual parity.
