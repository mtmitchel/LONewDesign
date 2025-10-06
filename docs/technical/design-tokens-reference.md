# LibreOllama Design Tokens Reference

> This is a markdown reference copy of `styles/globals.css` for easy sharing and documentation purposes.

## Import & Base Setup

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Custom Variants & Utilities

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
| `--elevation-lg` | `0 10px 30px rgba(0,0,0,0.12)` | Medium elevation |
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

### Modal Sizing
| Token | Value | Usage |
|-------|-------|-------|
| `--modal-max-w` | `920px` | General modals |
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
| `--chip-height` | `22px` | Pill/chip height |
| `--content-measure` | `72ch` | Email body max width |
| `--pill-radius` | `var(--radius-md)` | Pill corners |
| `--pill-gap` | `var(--space-2)` | Pill gap |
| `--pill-pad-x` | `var(--space-3)` | Pill padding X |
| `--pill-pad-y` | `var(--space-2)` | Pill padding Y |

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

## Font Family

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

Base font size: `16px`

---

**Note:** This reference is auto-generated from `styles/globals.css`. For the source of truth, always refer to the actual CSS file.
