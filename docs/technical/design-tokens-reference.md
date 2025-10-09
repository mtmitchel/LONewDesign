# LibreOllama Design Tokens Reference

> This is the canonical markdown reference for `styles/globals.css`, replacing the legacy `design-tokens.md` file at the repo root.
> **Last Updated:** October 9, 2025 - Consolidated calendar usage guidance and deprecated the root `design-tokens.md` snapshot.

## Import & Base Setup

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Custom Variants & Utilities

### Tailwind Arbitrary Token Helpers
When applying tokens through Tailwind classes, namespace the arbitrary values to avoid conflicts and keep intent clear:

- Color tokens → `text-[color:var(--text-primary)]`, `hover:text-[color:var(--primary)]`
- Font-size tokens → `text-[length:var(--text-base)]`

This mirrors the conventions used across the app shell and prevents duplicate-property warnings in editor tooling.

### Compose Editor Placeholder
```css
[data-compose-editor]:empty:before {
  content: attr(data-placeholder);
  color: var(--text-secondary);
  pointer-events: none;
}
```

### Hide Scrollbar Utility
```css
.hide-scrollbar {
  -ms-overflow-style: none; /* IE/Edge */
  scrollbar-width: none; /* Firefox */
}
.hide-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}
```

## Design Token System

### Radius & Motion
| Token | Value | Usage |
|-------|-------|-------|
| `--radius-full` | `9999px` | Pills, circular elements |
| `--duration-fast` | `150ms` | Quick transitions |
| `--duration-base` | `200ms` | Standard animations |
| `--easing-standard` | `cubic-bezier(0.2, 0.8, 0.3, 1)` | Default easing |
| `--easing-emphasized` | `cubic-bezier(0.2, 0.9, 0.1, 1)` | Emphasized motion |

### Elevation (Shadows)
| Token | Value | Usage |
|-------|-------|-------|
| `--elevation-sm` | `0 1px 2px rgba(0,0,0,0.06)` | Subtle elevation |
| `--elevation-lg` | `0 12px 32px rgb(0 0 0 / 0.18)` | Medium elevation |
| `--elevation-xl` | `0 24px 60px rgba(0,0,0,0.18)` | High elevation (modals) |

### Layers (Z-index)
| Token | Value | Usage |
|-------|-------|-------|
| `--z-overlay` | `70` | Modal overlays |

### Canvas & Surfaces (Warm Off-White System)
| Token | Value | Description |
|-------|-------|-------------|
| `--bg-canvas` | `hsl(60 9% 98%)` / `#FAFAF7` | Warm off-white background |
| `--bg-surface` | `hsl(0 0% 100%)` / `#FFFFFF` | Pure white surfaces |
| `--bg-surface-elevated` | `hsl(210 20% 95%)` / `#F1F5F9` | Subtle elevation |

### Primary Colors (Blue-Gray, Asana-inspired)
| Token | Value | Description |
|-------|-------|-------------|
| `--primary` | `hsl(214 25% 27%)` / `#334155` | Main brand color |
| `--primary-hover` | `hsl(220 39% 18%)` / `#1E293B` | Hover state |
| `--primary-tint-5` | `hsl(214 25% 27% / 0.05)` | 5% opacity tint |
| `--primary-tint-10` | `hsl(214 25% 27% / 0.1)` | 10% opacity tint |
| `--primary-tint-15` | `hsl(214 25% 27% / 0.15)` | 15% opacity tint |
| `--primary-tint-20` | `hsl(214 25% 27% / 0.2)` | 20% opacity tint |

### Accent Color (Coral)
| Token | Value | Description |
|-------|-------|-------------|
| `--accent-coral` | `hsl(0 85% 71%)` / `#F87171` | Coral accent |
| `--accent-coral-hover` | `hsl(0 84% 50%)` / `#DC2626` | Coral hover |
| `--accent-coral-tint-5` | `hsl(0 85% 71% / 0.05)` | 5% opacity |
| `--accent-coral-tint-10` | `hsl(0 85% 71% / 0.1)` | 10% opacity |
| `--accent-coral-tint-15` | `hsl(0 85% 71% / 0.15)` | 15% opacity |
| `--accent-coral-tint-20` | `hsl(0 85% 71% / 0.2)` | 20% opacity |

### Status Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--success` | `hsl(160 50% 60%)` | Success states |
| `--warning` | `hsl(38 85% 63%)` | Warning states |
| `--danger` | `var(--accent-coral)` | Danger/error states |
| `--error` | `var(--danger)` | Alias for danger |
| `--urgent` | `var(--accent-coral)` | Urgent actions |
| `--neutral` | `var(--primary)` | Neutral tags |
| `--info` | `hsl(200 70% 65%)` | Info states |

### Text Colors (High Contrast)
| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `hsl(223 44% 12%)` / `#111827` | Primary text |
| `--text-secondary` | `hsl(215 25% 27%)` / `#374151` | Secondary text |
| `--text-tertiary` | `hsl(215 16% 46%)` | Tertiary text, labels |

### Borders (Warm Neutral)
| Token | Value | Usage |
|-------|-------|-------|
| `--border-subtle` | `hsl(220 13% 91%)` / `#E5E7EB` | Subtle borders |
| `--border-default` | `hsl(220 13% 91%)` / `#E5E7EB` | Standard borders |
| `--border-divider` | `hsl(210 20% 95%)` / `#F1F5F9` | Light dividers |
| `--border-hairline` | `rgba(0,0,0,0.06)` | Hairline borders |

### Spacing Scale (Complete)
| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` | XS - Micro spacing |
| `--space-2` | `8px` | S - Small gaps |
| `--space-3` | `12px` | M - Standard spacing |
| `--space-4` | `16px` | L - Panel padding |
| `--space-5` | `20px` | XL - Section spacing |
| `--space-6` | `24px` | XXL - Large sections |
| `--space-8` | `32px` | XXXL - Major layout |

### Border Radius Scale
| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `6px` | Buttons, small elements |
| `--radius-md` | `8px` | Cards, panels |
| `--radius-lg` | `12px` | Modals, containers |
| `--radius-pill` | `9999px` | Pills, badges |

### Typography Scale
| Token | Value | Size | Usage |
|-------|-------|------|-------|
| `--text-xs` | `0.75rem` | 12px | Labels, captions |
| `--text-sm` | `0.875rem` | 14px | Body text, descriptions |
| `--text-base` | `1rem` | 16px | Default body text |
| `--text-lg` | `1.125rem` | 18px | Subheadings |
| `--text-xl` | `1.25rem` | 20px | Section headings |
| `--text-2xl` | `1.5rem` | 24px | Page titles |

### Font Weights
| Token | Value | Usage |
|-------|-------|-------|
| `--font-weight-normal` | `400` | Body text |
| `--font-weight-medium` | `500` | Labels, buttons |
| `--font-weight-semibold` | `600` | Subheadings |
| `--font-weight-bold` | `700` | Main headings |

### Button Variants (Asana + Sunsama System)
| Token | Value | Usage |
|-------|-------|-------|
| `--btn-primary-bg` | `var(--primary)` / `#334155` | Primary button |
| `--btn-primary-hover` | `var(--primary-hover)` / `#1E293B` | Primary hover |
| `--btn-primary-text` | `hsl(0 0% 100%)` | White text |
| `--btn-secondary-bg` | `var(--accent-coral)` / `#F87171` | Secondary button |
| `--btn-secondary-hover` | `var(--accent-coral-hover)` / `#DC2626` | Secondary hover |
| `--btn-secondary-text` | `hsl(0 0% 100%)` | White text |
| `--btn-ghost-bg` | `transparent` | Ghost background |
| `--btn-ghost-hover` | `var(--bg-surface-elevated)` / `#F1F5F9` | Ghost hover |
| `--btn-ghost-border` | `var(--border-default)` / `#E5E7EB` | Ghost border |
| `--btn-ghost-text` | `var(--primary)` / `#334155` | Ghost text |
| `--btn-primary-height` | `40px` | Standard button height |
| `--btn-primary-padding-x` | `16px` | Horizontal padding |
| `--btn-primary-radius` | `6px` | Button corners |

### Pane Caret Colors (Standardized)
| Token | Value | Usage |
|-------|-------|-------|
| `--caret-rest` | `#94A3B8` (slate-400) | Default state |
| `--caret-hover` | `#64748B` (slate-500) | Hover state |
| `--caret-active` | `#334155` (primary) | Active/pressed |
| `--caret-disabled` | `#CBD5E1` (slate-300) | Disabled state |
| `--caret-hover-bg` | `#F1F5F9` | Hover background |

### Task Density System

#### Task Checkbox ("always-check" pattern)
| Token | Value | Usage |
|-------|-------|-------|
| `--check-size` | `18px` | Checkbox size (comfortable) |
| `--check-ring` | `var(--border-subtle)` | Border color |
| `--check-idle-bg` | `var(--bg-surface)` | Unchecked background |
| `--check-idle-check` | `color-mix(in oklab, var(--text-tertiary) 55%, transparent)` | Unchecked checkmark |
| `--check-hover-ring` | `var(--primary)` | Hover border |
| `--check-active-bg` | `var(--primary)` | Checked background |
| `--check-active-check` | `var(--primary-foreground)` | Checked checkmark |
| `--check-disabled` | `var(--border-divider)` | Disabled state |

#### Task Card Density - Comfortable (Default)
| Token | Value | Usage |
|-------|-------|-------|
| `--task-card-pad-x--comfortable` | `var(--space-4)` / `16px` | Horizontal padding |
| `--task-card-pad-y--comfortable` | `var(--space-3)` / `12px` | Vertical padding |
| `--task-card-gap--comfortable` | `var(--space-3)` / `12px` | Gap between cards |
| `--task-title-size--comfortable` | `1rem` / `16px` | Task title font size |
| `--task-meta-size--comfortable` | `0.875rem` / `14px` | Metadata font size |
| `--task-check-size--comfortable` | `18px` | Checkbox size |

#### Task Card Density - Compact
| Token | Value | Usage |
|-------|-------|-------|
| `--task-card-pad-x--compact` | `var(--space-3)` / `12px` | Horizontal padding (tighter) |
| `--task-card-pad-y--compact` | `var(--space-2)` / `8px` | Vertical padding (tighter) |
| `--task-card-gap--compact` | `var(--space-2)` / `8px` | Gap between cards (tighter) |
| `--task-title-size--compact` | `0.9375rem` / `15px` | Task title font size (smaller) |
| `--task-meta-size--compact` | `0.8125rem` / `13px` | Metadata font size (smaller) |
| `--task-check-size--compact` | `16px` | Checkbox size (smaller) |

#### Active Task Card Tokens (Dynamic)
These tokens switch based on `.density-compact` class:
| Token | Default | Usage |
|-------|---------|-------|
| `--task-card-pad-x` | Comfortable value | Horizontal padding |
| `--task-card-pad-y` | Comfortable value | Vertical padding |
| `--task-card-gap` | Comfortable value | Card gap |
| `--task-title-size` | Comfortable value | Title font size |
| `--task-meta-size` | Comfortable value | Meta font size |

#### Task Card Visual Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `--task-card-radius` | `var(--radius-md)` / `8px` | Card corner radius |
| `--task-card-border` | `var(--border-subtle)` | Card border |
| `--task-card-shadow` | `none` | Card shadow (minimal) |

### List Header Density

#### List Header - Comfortable (Default)
| Token | Value | Usage |
|-------|-------|-------|
| `--list-header-pad-x--comfortable` | `var(--space-4)` / `16px` | Horizontal padding |
| `--list-header-pad-y--comfortable` | `var(--space-3)` / `12px` | Vertical padding |
| `--list-header-radius--comfortable` | `var(--radius-lg)` / `12px` | Corner radius |
| `--list-header-shadow--comfortable` | `var(--elevation-sm)` | Shadow |
| `--list-header-title--comfortable` | `1.125rem` / `18px` | Title font size |

#### List Header - Compact
| Token | Value | Usage |
|-------|-------|-------|
| `--list-header-pad-x--compact` | `var(--space-3)` / `12px` | Horizontal padding (tighter) |
| `--list-header-pad-y--compact` | `var(--space-2)` / `8px` | Vertical padding (tighter) |
| `--list-header-radius--compact` | `var(--radius-md)` / `8px` | Corner radius (smaller) |
| `--list-header-shadow--compact` | `none` | No shadow (flat) |
| `--list-header-title--compact` | `1rem` / `16px` | Title font size (smaller) |
| `--list-header-toolbar-icon` | `16px` | Toolbar icon size |

#### Active List Header Tokens (Dynamic)
These tokens switch based on `.density-compact` class:
| Token | Default | Usage |
|-------|---------|-------|
| `--list-header-pad-x` | Comfortable value | Horizontal padding |
| `--list-header-pad-y` | Comfortable value | Vertical padding |
| `--list-header-radius` | Comfortable value | Corner radius |
| `--list-header-shadow` | Comfortable value | Shadow |
| `--list-header-title` | Comfortable value | Title font size |

### Segmented Control Tokens (View Toggle)
| Token | Value | Usage |
|-------|-------|-------|
| `--seg-bg` | `var(--bg-muted)` | Control background |
| `--seg-border` | `var(--border-subtle)` | Control border |
| `--seg-radius` | `var(--radius-lg)` / `12px` | Control corners |
| `--seg-pad-x` | `var(--space-2)` / `8px` | Horizontal padding |
| `--seg-pad-y` | `var(--space-2)` / `8px` | Vertical padding |
| `--seg-gap` | `var(--space-1)` / `4px` | Gap between items |
| `--seg-elevation` | `var(--elevation-sm)` | Control shadow |
| `--seg-item-radius` | `var(--radius-md)` / `8px` | Item corners |
| `--seg-item-pad-x` | `var(--space-3)` / `12px` | Item horizontal padding |
| `--seg-item-pad-y` | `var(--space-2)` / `8px` | Item vertical padding |
| `--seg-item-icon` | `16px` | Icon size |
| `--seg-item-gap` | `var(--space-2)` / `8px` | Gap between icon and label |
| `--seg-item-fg` | `var(--text-secondary)` | Inactive text color |
| `--seg-item-fg-active` | `var(--text-primary)` | Active text color |
| `--seg-item-bg-hover` | `color-mix(in oklab, var(--text-secondary) 8%, transparent)` | Hover background |
| `--seg-item-bg-active` | `var(--bg-surface)` | Active background |
| `--seg-item-border-active` | `var(--border-subtle)` | Active border |
| `--seg-focus-ring` | `var(--focus-ring)` | Focus ring color |
| `--seg-duration` | `var(--duration-fast)` | Transition duration |

### Chip & Badge Tokens (Low-Ink System)

#### Chip Base Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `--chip-height` | `22px` | Pill/chip height |
| `--chip-gap` | `var(--space-2)` / `8px` | Gap between chips |
| `--chip-px` | `var(--space-3)` / `12px` | Horizontal padding |
| `--chip-py` | `var(--space-1)` / `4px` | Vertical padding |
| `--chip-pad-x` | `var(--space-3)` | Legacy alias for px |
| `--chip-radius` | `var(--radius-full)` / `9999px` | Pill shape |
| `--chip-text` | `var(--text-secondary)` | Base text color |
| `--chip-border` | `var(--border-subtle)` | Border color |
| `--chip-inset-shadow` | `inset 0 0 0 1px var(--chip-border)` | Subtle inset border |
| `--chip-shadow` | `none` | Legacy shadow alias |
| `--chip-hover-bg-boost` | `6%` | Background darkness on hover |

#### Chip Priority Colors (Semantic Sources)
| Token | Value | Usage |
|-------|-------|-------|
| `--priority-high` | `var(--danger)` / Coral | High priority color source |
| `--priority-medium` | `var(--warning)` / Yellow | Medium priority color source |
| `--priority-low` | `var(--info)` / Blue | Low priority color source |
| `--label-neutral` | `var(--accent)` | Label color source |

#### Low-Ink Chip Tints (High Priority)
| Token | Value | Usage |
|-------|-------|-------|
| `--chip-high-bg` | `color-mix(in oklab, var(--priority-high) 14%, transparent)` | High priority background (14% opacity) |
| `--chip-high-fg` | `color-mix(in oklab, var(--priority-high) 55%, var(--chip-text))` | High priority text (55% blend) |
| `--chip-high-text` | `var(--accent-coral)` | Legacy alias |

#### Low-Ink Chip Tints (Medium Priority)
| Token | Value | Usage |
|-------|-------|-------|
| `--chip-medium-bg` | `color-mix(in oklab, var(--priority-medium) 16%, transparent)` | Medium priority background (16% opacity) |
| `--chip-medium-fg` | `color-mix(in oklab, var(--priority-medium) 52%, var(--chip-text))` | Medium priority text (52% blend) |
| `--chip-medium-text` | `var(--warning)` | Legacy alias |

#### Low-Ink Chip Tints (Low Priority)
| Token | Value | Usage |
|-------|-------|-------|
| `--chip-low-bg` | `color-mix(in oklab, var(--priority-low) 16%, transparent)` | Low priority background (16% opacity) |
| `--chip-low-fg` | `color-mix(in oklab, var(--priority-low) 52%, var(--chip-text))` | Low priority text (52% blend) |
| `--chip-low-text` | `var(--info)` | Legacy alias |

#### Low-Ink Chip Tints (Labels)
| Token | Value | Usage |
|-------|-------|-------|
| `--chip-label-bg` | `color-mix(in oklab, var(--label-neutral) 14%, transparent)` | Label background (14% opacity) |
| `--chip-label-fg` | `color-mix(in oklab, var(--label-neutral) 60%, var(--text-secondary))` | Label text (60% blend) |

#### Low-Ink Chip Tints (Neutral)
| Token | Value | Usage |
|-------|-------|-------|
| `--chip-neutral-bg` | `var(--bg-surface-elevated)` | Neutral background |
| `--chip-neutral-text` | `var(--text-secondary)` | Neutral text |

### List View Density Tokens

#### List Row Density - Comfortable (Default)
| Token | Value | Usage |
|-------|-------|-------|
| `--list-row-pad-y--comfortable` | `var(--space-3)` / `12px` | Vertical padding |
| `--list-row-pad-x--comfortable` | `var(--space-4)` / `16px` | Horizontal padding |
| `--list-row-font--comfortable` | `var(--text-base)` / `16px` | Task name font |
| `--list-row-meta--comfortable` | `var(--text-sm)` / `14px` | Metadata font |
| `--list-row-min-h--comfortable` | `44px` | Minimum row height |

#### List Row Density - Cozy
| Token | Value | Usage |
|-------|-------|-------|
| `--list-row-pad-y--cozy` | `var(--space-2-5, 10px)` / `10px` | Vertical padding |
| `--list-row-pad-x--cozy` | `var(--space-3)` / `12px` | Horizontal padding |
| `--list-row-font--cozy` | `0.9375rem` / `15px` | Task name font |
| `--list-row-meta--cozy` | `0.8125rem` / `13px` | Metadata font |
| `--list-row-min-h--cozy` | `40px` | Minimum row height |

#### List Row Density - Compact
| Token | Value | Usage |
|-------|-------|-------|
| `--list-row-pad-y--compact` | `var(--space-2)` / `8px` | Vertical padding (tightest) |
| `--list-row-pad-x--compact` | `var(--space-3)` / `12px` | Horizontal padding |
| `--list-row-font--compact` | `0.875rem` / `14px` | Task name font (smallest) |
| `--list-row-meta--compact` | `0.8125rem` / `13px` | Metadata font |
| `--list-row-min-h--compact` | `36px` | Minimum row height (tightest) |

### Chat Module Tokens
| Token | Value | Description |
|-------|-------|-------------|
| `--chat-rail-w` | `2px` | Width of the active conversation rail in the list view |
| `--chat-row-gap` | `var(--space-3)` | Baseline gap between primary and secondary content in chat list rows |
| `--chat-bubble-max-w` | `72ch` | Maximum readable width for chat message bubbles |
| `--chat-bubble-gap-y` | `var(--space-2)` | Vertical rhythm between stacked bubbles from the same author |
| `--chat-composer-max-rows` | `8` | Maximum rows the chat composer grows before scrolling |
| `--chat-empty-bg` | `var(--bg-surface-elevated)` | Background color for chat empty states |

#### Active List Row Tokens (Dynamic)
| Token | Default | Usage |
|-------|---------|-------|
| `--list-row-pad-y` | Comfortable value | Vertical padding |
| `--list-row-pad-x` | Comfortable value | Horizontal padding |
| `--list-row-font` | Comfortable value | Task name font |
| `--list-row-meta` | Comfortable value | Metadata font |
| `--list-row-min-h` | Comfortable value | Minimum row height |
| `--list-row-gap` | `var(--space-3)` / `12px` | Column gap |

### Modal Sizing
| Token | Value | Usage |
|-------|-------|-------|
| `--modal-max-w` | `640px` | Compact modals (assistant, quick capture) |
| `--modal-max-w-lg` | `920px` | Wide modals (calendar, settings) |
| `--modal-max-w-mail` | `880px` | Email modals (tighter) |
| `--modal-max-h` | `88dvh` | Maximum modal height |
| `--modal-radius` | `var(--radius-lg)` | Modal corners |
| `--modal-elevation` | `var(--elevation-xl)` | Modal shadow |
| `--modal-inner-x` | `var(--space-4)` / `16px` | Horizontal padding |
| `--modal-inner-y` | `var(--space-3)` / `12px` | Vertical padding |

### Compose Modal Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `--compose-min-w` | `560px` | Minimum compose width |
| `--compose-max-w` | `920px` | Maximum compose width |
| `--compose-min-h` | `360px` | Minimum compose height |
| `--compose-max-h` | `88dvh` | Maximum compose height |
| `--compose-toolbar-height` | `48px` | Formatting toolbar |
| `--compose-editor-min-height` | `200px` | Editor minimum |

### Compose Docked (Gmail-style)
| Token | Value | Usage |
|-------|-------|-------|
| `--compose-docked-width` | `720px` | Docked width |
| `--compose-docked-min-width` | `560px` | Minimum width |
| `--compose-docked-height` | `560px` | Docked height |
| `--compose-docked-margin` | `16px` | Screen edge margin |
| `--compose-header-height` | `40px` | Compact header |
| `--compose-shadow` | `0 10px 30px rgba(0,0,0,0.12)` | Shadow |

### Inline Reply Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `--reply-bg` | `transparent` | Reply background |
| `--reply-divider` | `color-mix(in oklab, var(--text-default) 6%, transparent)` | Hairline divider |
| `--reply-pad-x` | `var(--space-3)` / `12px` | Horizontal padding |
| `--reply-pad-y` | `var(--space-2)` / `8px` | Vertical padding |
| `--reply-gap-y` | `var(--space-2)` / `8px` | Stack gap |
| `--reply-editor-min-h` | `140px` | Editor minimum height |
| `--reply-toolbar-h` | `36px` | Compact toolbar |

### Mail List Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `--mail-row-height` | `60px` | Email list item height |
| `--mail-row-padding-y` | `8px` | Vertical padding |
| `--mail-row-padding-x` | `16px` | Horizontal padding |
| `--mail-avatar-size` | `28px` | Avatar size |
| `--mail-row-gap` | `12px` | Element gap |
| `--mail-row-hover-bg` | `var(--bg-surface-elevated)` | Hover background |

### Email Modal/Overlay
| Token | Value | Usage |
|-------|-------|-------|
| `--email-modal-width` | `700px` | Modal width |
| `--email-modal-max-width` | `90vw` | Responsive max |
| `--email-modal-padding` | `20px` | Internal padding |
| `--email-header-height` | `56px` | Header height |
| `--email-footer-height` | `64px` | Footer height |

### Toolbar Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `--toolbar-h` | `32px` | Toolbar height |
| `--toolbar-pad-x` | `var(--space-2)` | Horizontal padding |
| `--toolbar-gap` | `var(--space-2)` | Gap between items |
| `--toolbar-icon-size` | `14px` | Icon size |
| `--toolbar-btn-pad-x` | `var(--space-2)` | Button padding X |
| `--toolbar-btn-pad-y` | `var(--space-1)` | Button padding Y |
| `--toolbar-dim` | `0.56` | Idle opacity |
| `--toolbar-hover` | `1` | Hover opacity |

### Layout Tokens

#### Sidebar
| Token | Value | Usage |
|-------|-------|-------|
| `--sidebar-width` | `280px` | Expanded width |
| `--sidebar-collapsed-width` | `60px` | Collapsed width |
| `--sidebar-bg` | `var(--bg-surface)` | Background |
| `--sidebar-border` | `1px solid var(--border-default)` | Border |

#### TriPane Layout
| Token | Value | Usage |
|-------|-------|-------|
| `--tripane-left-width` | `280px` | Left panel |
| `--tripane-right-width` | `320px` | Right panel |
| `--tripane-center-min` | `400px` | Center minimum |
| `--tripane-gap` | `0px` | Panel gaps |
| `--tripane-border` | `1px solid var(--border-default)` | Separators |

#### Quick Actions Panel
| Token | Value | Usage |
|-------|-------|-------|
| `--quick-panel-width` | `320px` | Panel width |
| `--quick-panel-bg` | `var(--bg-surface)` | Background |
| `--quick-panel-border` | `1px solid var(--border-default)` | Border |
| `--quick-tile-size` | `80px` | Tile height |
| `--quick-tile-gap` | `12px` | Tile gap |
| `--quick-tile-padding` | `16px` | Tile padding |
| `--quick-tile-radius` | `8px` | Tile corners |

### Focus System
| Token | Value | Usage |
|-------|-------|-------|
| `--focus-ring` | `var(--primary)` | Focus ring color |
| `--focus-offset` | `2px` | Focus ring offset |

### Backdrop/Overlay
| Token | Value | Usage |
|-------|-------|-------|
| `--overlay-scrim` | `rgba(0, 0, 0, 0.35)` | Modal backdrop |
| `--overlay-blur` | `4px` | Backdrop blur |
| `--overlay-gutter` | `var(--space-6)` | Edge breathing room |

### Miscellaneous Component Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `--content-measure` | `72ch` | Email body max width |
| `--priority-dot-size` | `10px` | Priority indicator dot |
| `--priority-dot-color` | `var(--text-tertiary)` | Dot color |

### Calendar Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `--calendar-gutter` | `var(--space-6)` / `24px` | Calendar padding |
| `--calendar-cell-min-h` | `112px` | Calendar cell height |
| `--calendar-hour-row-h` | `56px` | Hour row height |
| `--calendar-rail-w` | `340px` | Sidebar rail width |
| `--calendar-cell-border` | `var(--border-subtle)` | Cell borders |
| `--calendar-event-radius` | `var(--radius-md)` | Event corners |
| `--calendar-rail-shadow` | `var(--elevation-sm)` | Sidebar shadow |
| `--calendar-header-h` | `60px` | Calendar header height |

#### Calendar Layout & Usage Guidelines
- **Frame & Layout**: Keep a single contiguous frame per view using `--cal-frame-radius` and `--cal-frame-border`. Avoid creating gutters between day cells; rely on hairline gridlines from `--cal-gridline` instead.
- **Lines & Rings**: Highlight today, focus, and selection states with `--cal-ring` and `--cal-hover` rather than solid fills for calmer emphasis.
- **Outside-Month Ink**: Dim outside-month dates via the `--cal-outside-ink` opacity token to preserve focus on the current month.
- **Now Indicator**: Use `--cal-now-line` (1px line) with a dot defined by `--cal-now-dot` to show the current time in Week/Day views.
- **Event Pills**: Apply `--event-pill-*` padding/radius tokens and chip tints for low-ink events. Respect `--event-overlap-gap` and `--event-gap` to avoid cramped stacking.
- **Usage Principles**: Represent today/selected/focus via thin rings, keep pills single-line with chip tokens, and prefer low-ink mouse-over states powered by `--event-hover-bg`.

### Calendar Event Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--event-green-bg` | `rgb(209, 250, 229)` (emerald-100) | Green event background |
| `--event-green-text` | `rgb(4, 120, 87)` (emerald-700) | Green event text |
| `--event-green-hover` | `rgb(167, 243, 208)` (emerald-200) | Green event hover |
| `--event-blue-bg` | `rgb(219, 234, 254)` (blue-100) | Blue event background |
| `--event-blue-text` | `rgb(29, 78, 216)` (blue-700) | Blue event text |
| `--event-blue-hover` | `rgb(191, 219, 254)` (blue-200) | Blue event hover |
| `--event-teal-bg` | `rgb(204, 251, 241)` (teal-100) | Teal event background |
| `--event-teal-text` | `rgb(15, 118, 110)` (teal-700) | Teal event text |
| `--event-teal-hover` | `rgb(153, 246, 228)` (teal-200) | Teal event hover |
| `--event-orange-bg` | `rgb(254, 215, 170)` (orange-100) | Orange event background |
| `--event-orange-text` | `rgb(194, 65, 12)` (orange-700) | Orange event text |
| `--event-orange-hover` | `rgb(253, 186, 116)` (orange-200) | Orange event hover |

### Tasks Rail Tokens (Compact Spacing)
| Token | Value | Usage |
|-------|-------|-------|
| `--tasks-rail-padding` | `var(--space-4)` / `16px` | Outer padding |
| `--tasks-rail-gap` | `var(--space-4)` / `16px` | Section gaps |
| `--tasks-rail-card-bg` | `var(--bg-surface)` | Card background |
| `--tasks-rail-border` | `var(--border-subtle)` | Border color |
| `--tasks-rail-radius` | `var(--radius-lg)` | Card corners |
| `--tasks-rail-shadow` | `var(--elevation-sm)` | Card shadow |

### Task Row Tokens (Legacy/Alternative)
| Token | Value | Usage |
|-------|-------|-------|
| `--task-row-h-1` | `40px` | Single-line row |
| `--task-row-h-2` | `56px` | Row with metadata |
| `--task-row-pad-y` | `var(--space-2)` / `8px` | Vertical padding |
| `--task-row-gap` | `var(--space-2)` / `8px` | Element gap |
| `--task-row-hover` | `var(--bg-muted)` | Hover background |
| `--task-badge-gap` | `var(--space-2)` / `8px` | Badge gap |
| `--task-badge-radius` | `var(--radius-sm)` | Badge corners |
| `--task-badge-text` | `var(--text-muted)` | Badge text |

### Due Date State Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `--due-default` | `var(--text-muted)` | Default due date |
| `--due-today` | `var(--primary)` | Due today |
| `--due-overdue` | `var(--danger)` | Overdue date |

## Shadcn Compatibility Layer

These semantic mappings ensure compatibility with shadcn components:

```css
--background: var(--bg-canvas);
--foreground: var(--text-primary);
--card: var(--bg-surface);
--card-foreground: var(--text-primary);
--popover: var(--bg-surface);
--popover-foreground: var(--text-primary);
--primary-foreground: hsl(0 0% 100%);
--secondary: var(--accent-coral);
--secondary-foreground: hsl(0 0% 100%);
--muted: var(--bg-surface-elevated);
--muted-foreground: var(--text-secondary);
--accent: var(--primary-tint-10);
--accent-foreground: var(--primary);
--destructive: var(--accent-coral);
--destructive-foreground: hsl(0 0% 100%);
--border: var(--border-default);
--input: transparent;
--input-background: var(--bg-surface);
--ring: var(--primary);
```

## Base Typography Styles

Default typography applied to elements without Tailwind text classes:

```css
h1: font-size: var(--text-2xl), font-weight: 700
h2: font-size: var(--text-xl), font-weight: 600
h3: font-size: var(--text-lg), font-weight: 600
h4: font-size: var(--text-base), font-weight: 600
p: font-size: var(--text-base), font-weight: var(--font-weight-normal)
label: font-size: var(--text-base), font-weight: var(--font-weight-medium)
button: font-size: var(--text-base), font-weight: var(--font-weight-medium)
input: font-size: var(--text-base), font-weight: var(--font-weight-normal)
```

All elements use `line-height: 1.6` for comfortable reading.

## Density Class Activation

Apply the `.density-compact` class to activate compact density mode for tasks:

```css
.density-compact {
  --task-card-pad-x: var(--task-card-pad-x--compact);
  --task-card-pad-y: var(--task-card-pad-y--compact);
  --task-card-gap: var(--task-card-gap--compact);
  --task-title-size: var(--task-title-size--compact);
  --task-meta-size: var(--task-meta-size--compact);
  --check-size: var(--task-check-size--compact);
  --list-header-pad-x: var(--list-header-pad-x--compact);
  --list-header-pad-y: var(--list-header-pad-y--compact);
  --list-header-radius: var(--list-header-radius--compact);
  --list-header-shadow: var(--list-header-shadow--compact);
  --list-header-title: var(--list-header-title--compact);
}
```

**Usage:** Add `.density-compact` to the container element (e.g., board grid) to switch all child task cards and list headers to compact mode.

## Shadcn Compatibility Layer

## Font Family

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

Base font size: `16px`

---

**Note:** This reference is synchronized with `styles/globals.css`. 

**Last Updated:** October 7, 2025
- Added task density system (comfortable/compact modes)
- Added chip & badge low-ink token system with semantic color mixing
- Added segmented control tokens for view toggles
- Added list view density presets (comfortable/cozy/compact)
- Added calendar event color tokens
- Added tasks rail tokens
- Added due date state tokens

For the source of truth, always refer to the actual CSS file.
