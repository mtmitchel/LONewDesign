# 🎨 **LibreOllama Design Token Sheet**
*Figma Make Production Token System*

---

## 🌈 **Color Palette**

### **Foundation Colors**
| Token                    | Name                     | Value     | HSL                  | Usage                           |
|--------------------------|--------------------------|-----------|----------------------|---------------------------------|
| `--color-canvas`         | Canvas Background        | `#FAFAF7` | `hsl(60 9% 98%)`     | App background, warm off-white  |
| `--color-surface`        | Surface                  | `#FFFFFF` | `hsl(0 0% 100%)`     | Cards, panels, modals           |
| `--color-surface-elevated` | Elevated Surface       | `#F1F5F9` | `hsl(210 20% 95%)`   | Hover states, subtle elevation  |

### **Primary Colors (Blue-Gray)**
| Token                    | Name                     | Value     | HSL                  | Usage                           |
|--------------------------|--------------------------|-----------|----------------------|---------------------------------|
| `--color-primary`        | Primary Blue-Gray        | `#334155` | `hsl(214 25% 27%)`   | Primary buttons, key actions    |
| `--color-primary-hover`  | Primary Hover            | `#1E293B` | `hsl(220 39% 18%)`   | Hover state for primary         |
| `--color-primary-tint-5` | Primary Tint 5%          | `rgba(51, 65, 85, 0.05)` | - | Very light primary backgrounds |
| `--color-primary-tint-10`| Primary Tint 10%         | `rgba(51, 65, 85, 0.1)`  | - | Light primary backgrounds      |
| `--color-primary-tint-15`| Primary Tint 15%         | `rgba(51, 65, 85, 0.15)` | - | Selection states               |
| `--color-primary-tint-20`| Primary Tint 20%         | `rgba(51, 65, 85, 0.2)`  | - | Active states                  |

### **Accent Colors (Coral)**
| Token                    | Name                     | Value     | HSL                  | Usage                           |
|--------------------------|--------------------------|-----------|----------------------|---------------------------------|
| `--color-accent`         | Accent Coral             | `#F87171` | `hsl(0 85% 71%)`     | Stars, urgent states, highlights|
| `--color-accent-hover`   | Accent Hover             | `#DC2626` | `hsl(0 84% 50%)`     | Hover state for accent          |
| `--color-accent-tint-5`  | Accent Tint 5%           | `rgba(248, 113, 113, 0.05)` | - | Very light accent backgrounds |
| `--color-accent-tint-10` | Accent Tint 10%          | `rgba(248, 113, 113, 0.1)`  | - | Light accent backgrounds      |
| `--color-accent-tint-15` | Accent Tint 15%          | `rgba(248, 113, 113, 0.15)` | - | Urgent selection states       |
| `--color-accent-tint-20` | Accent Tint 20%          | `rgba(248, 113, 113, 0.2)`  | - | Urgent active states          |

### **Text Colors**
| Token                    | Name                     | Value     | HSL                  | Usage                           |
|--------------------------|--------------------------|-----------|----------------------|---------------------------------|
| `--color-text-primary`   | Text Primary             | `#111827` | `hsl(223 44% 12%)`   | Main text, headings             |
| `--color-text-secondary` | Text Secondary           | `#374151` | `hsl(215 25% 27%)`   | Secondary text, descriptions    |

### **Border & Divider Colors**
| Token                    | Name                     | Value     | HSL                  | Usage                           |
|--------------------------|--------------------------|-----------|----------------------|---------------------------------|
| `--color-border`         | Border Default           | `#E5E7EB` | `hsl(220 13% 91%)`   | Panel borders, input borders    |
| `--color-divider`        | Row Divider              | `#F1F5F9` | `hsl(210 20% 95%)`   | List row separators             |

### **Status Colors**
| Token                    | Name                     | Value     | HSL                  | Usage                           |
|--------------------------|--------------------------|-----------|----------------------|---------------------------------|
| `--color-success`        | Success                  | `#10B981` | `hsl(160 50% 60%)`   | Success states, confirmations   |
| `--color-warning`        | Warning                  | `#F59E0B` | `hsl(38 85% 63%)`    | Warning states, attention       |
| `--color-danger`         | Danger                   | `#F87171` | `hsl(0 85% 71%)`     | Error states, destructive actions|
| `--color-info`           | Info                     | `#3B82F6` | `hsl(200 70% 65%)`   | Information, neutral alerts     |

---

## 📏 **Spacing System**

| Token       | Name    | Value | Usage                                    |
|-------------|---------|-------|------------------------------------------|
| `--space-1` | XS      | `4px` | Icon gaps, micro spacing                 |
| `--space-2` | S       | `8px` | Small gaps between related elements      |
| `--space-3` | M       | `12px`| Standard spacing, button padding         |
| `--space-4` | L       | `16px`| Panel padding, card spacing              |
| `--space-5` | XL      | `20px`| Section spacing                          |
| `--space-6` | XXL     | `24px`| Large section gaps                       |
| `--space-8` | XXXL    | `32px`| Major layout spacing                     |

---

## 📝 **Typography Scale**

### **Font Sizes**
| Token        | Name      | Size  | Line Height | Usage                    |
|--------------|-----------|-------|-------------|--------------------------|
| `--text-xs`  | Extra Small| 12px | 16px       | Labels, captions         |
| `--text-sm`  | Small     | 14px  | 20px       | Body text, descriptions  |
| `--text-base`| Base      | 16px  | 24px       | Default body text        |
| `--text-lg`  | Large     | 18px  | 24px       | Subheadings              |
| `--text-xl`  | Extra Large| 20px | 28px       | Section headings         |
| `--text-2xl` | 2X Large  | 24px  | 32px       | Page titles              |

### **Font Weights**
| Token                    | Name    | Value | Usage                    |
|--------------------------|---------|-------|--------------------------|
| `--font-weight-normal`   | Normal  | 400   | Body text                |
| `--font-weight-medium`   | Medium  | 500   | Labels, buttons          |
| `--font-weight-semibold` | Semibold| 600   | Subheadings              |
| `--font-weight-bold`     | Bold    | 700   | Main headings            |

---

## 🔘 **Border Radius**

| Token         | Name     | Value | Usage                    |
|---------------|----------|-------|--------------------------|
| `--radius-sm` | Small    | 6px   | Buttons, small elements  |
| `--radius-md` | Medium   | 8px   | Cards, panels            |
| `--radius-lg` | Large    | 12px  | Modals, major containers |
| `--radius-pill`| Pill    | 9999px| Pills, badges            |

---

## 📧 **Component Tokens**

### **Mail List Rows**
| Token                    | Name                | Value         | Usage                    |
|--------------------------|---------------------|---------------|--------------------------|
| `--mail-row-height`      | Row Height          | `60px`        | Email list item height   |
| `--mail-row-padding-y`   | Vertical Padding    | `8px`         | Top/bottom row padding   |
| `--mail-row-padding-x`   | Horizontal Padding  | `16px`        | Left/right row padding   |
| `--mail-avatar-size`     | Avatar Size         | `28px`        | Email sender avatar      |
| `--mail-row-gap`         | Internal Gap        | `12px`        | Gap between row elements |
| `--mail-row-hover-bg`    | Hover Background    | `#F1F5F9`     | Row hover state          |

### **Header Strip**
| Token                    | Name                | Value         | Usage                    |
|--------------------------|---------------------|---------------|--------------------------|
| `--header-height`        | Header Height       | `60px`        | TriPane header height    |
| `--header-bg`            | Header Background   | `#FFFFFF`     | Header background color  |
| `--header-border`        | Header Border       | `1px solid #E5E7EB` | Bottom border     |
| `--header-padding-x`     | Header H-Padding    | `16px`        | Left/right padding       |

### **Quick Actions Panel**
| Token                    | Name                | Value         | Usage                    |
|--------------------------|---------------------|---------------|--------------------------|
| `--quick-panel-width`    | Panel Width         | `320px`       | Right panel width        |
| `--quick-panel-bg`       | Panel Background    | `#FFFFFF`     | Panel background         |
| `--quick-panel-border`   | Panel Border        | `1px solid #E5E7EB` | Left border        |
| `--quick-tile-size`      | Tile Size           | `80px`        | Quick action tile height |
| `--quick-tile-gap`       | Tile Gap            | `12px`        | Gap between tiles        |
| `--quick-tile-padding`   | Tile Padding        | `16px`        | Internal tile padding    |
| `--quick-tile-radius`    | Tile Radius         | `8px`         | Tile border radius       |

### **Email Modal/Overlay**
| Token                    | Name                | Value         | Usage                    |
|--------------------------|---------------------|---------------|--------------------------|
| `--email-modal-width`    | Modal Width         | `700px`       | Email modal width        |
| `--email-modal-max-width`| Modal Max Width     | `90vw`        | Responsive max width     |
| `--email-modal-padding`  | Modal Padding       | `20px`        | Internal modal padding   |
| `--email-header-height`  | Header Height       | `56px`        | Modal header height      |
| `--email-footer-height`  | Footer Height       | `64px`        | Modal footer height      |

### **Compose Modal**
| Token                    | Name                | Value         | Usage                    |
|--------------------------|---------------------|---------------|--------------------------|
| `--compose-modal-width`  | Compose Width       | `600px`       | Compose modal width      |
| `--compose-modal-height` | Compose Height      | `500px`       | Compose modal height     |
| `--compose-toolbar-height`| Toolbar Height     | `48px`        | Formatting toolbar       |
| `--compose-editor-min-height`| Editor Min Height| `200px`     | Editor minimum height    |

---

## 🎯 **Button System**

### **Primary Button (Blue-Gray)**
| Token                    | Name                | Value         | Usage                    |
|--------------------------|---------------------|---------------|--------------------------|
| `--btn-primary-bg`       | Background          | `#334155`     | Primary button background|
| `--btn-primary-hover`    | Hover Background    | `#1E293B`     | Primary button hover     |
| `--btn-primary-text`     | Text Color          | `#FFFFFF`     | Primary button text      |
| `--btn-primary-height`   | Button Height       | `40px`        | Standard button height   |
| `--btn-primary-padding-x`| Horizontal Padding  | `16px`        | Left/right padding       |
| `--btn-primary-radius`   | Border Radius       | `6px`         | Button corner radius     |

### **Secondary Button (Coral)**
| Token                    | Name                | Value         | Usage                    |
|--------------------------|---------------------|---------------|--------------------------|
| `--btn-secondary-bg`     | Background          | `#F87171`     | Secondary button background |
| `--btn-secondary-hover`  | Hover Background    | `#DC2626`     | Secondary button hover   |
| `--btn-secondary-text`   | Text Color          | `#FFFFFF`     | Secondary button text    |

### **Ghost Button**
| Token                    | Name                | Value         | Usage                    |
|--------------------------|---------------------|---------------|--------------------------|
| `--btn-ghost-bg`         | Background          | `transparent` | Ghost button background  |
| `--btn-ghost-hover`      | Hover Background    | `#F1F5F9`     | Ghost button hover       |
| `--btn-ghost-border`     | Border              | `1px solid #E5E7EB` | Ghost button border |
| `--btn-ghost-text`       | Text Color          | `#334155`     | Ghost button text        |

---

## 🏗️ **Layout System**

### **Sidebar**
| Token                    | Name                | Value         | Usage                    |
|--------------------------|---------------------|---------------|--------------------------|
| `--sidebar-width`        | Sidebar Width       | `280px`       | Expanded sidebar width   |
| `--sidebar-collapsed-width`| Collapsed Width   | `60px`        | Collapsed sidebar width  |
| `--sidebar-bg`           | Background          | `#FFFFFF`     | Sidebar background       |
| `--sidebar-border`       | Border              | `1px solid #E5E7EB` | Right border      |

### **TriPane Layout**
| Token                    | Name                | Value         | Usage                    |
|--------------------------|---------------------|---------------|--------------------------|
| `--tripane-left-width`   | Left Pane Width     | `280px`       | Left panel width         |
| `--tripane-right-width`  | Right Pane Width    | `320px`       | Right panel width        |
| `--tripane-center-min`   | Center Min Width    | `400px`       | Center panel minimum     |
| `--tripane-gap`          | Panel Gap           | `0px`         | Gap between panels       |
| `--tripane-border`       | Panel Border        | `1px solid #E5E7EB` | Panel separators  |

---

## 🎨 **Usage Guidelines**

### **Color Application**
- **Canvas**: Use `--color-canvas` as the app background
- **Surfaces**: Use `--color-surface` for all panels, cards, and modals
- **Primary Actions**: Use `--color-primary` for main CTAs, Compose button
- **Accent Sparingly**: Use `--color-accent` only for stars, urgent states, focus indicators
- **Text Hierarchy**: `--color-text-primary` for headings, `--color-text-secondary` for descriptions

### **Spacing Application**
- **Micro Spacing**: `--space-1` (4px) for icon gaps
- **Standard Spacing**: `--space-3` (12px) for most internal component gaps
- **Panel Padding**: `--space-4` (16px) for card and panel internal padding
- **Section Spacing**: `--space-6` (24px) for major layout gaps

### **Typography Application**
- **Body Text**: `--text-base` (16px) for main content
- **UI Labels**: `--text-sm` (14px) for form labels and UI text
- **Headings**: `--text-lg` to `--text-2xl` for hierarchical headings
- **Captions**: `--text-xs` (12px) for timestamps and metadata

---

## 🔄 **Token Mapping for Figma Variables**

### **Suggested Variable Groups**
```
color/
  foundation/canvas
  foundation/surface
  foundation/surface-elevated
  primary/default
  primary/hover
  primary/tint-5
  primary/tint-10
  accent/default
  accent/hover
  accent/tint-5
  accent/tint-10
  text/primary
  text/secondary
  border/default
  border/divider

spacing/
  xs (4px)
  s (8px)
  m (12px)
  l (16px)
  xl (20px)
  xxl (24px)
  xxxl (32px)

typography/
  size/xs (12px)
  size/sm (14px)
  size/base (16px)
  size/lg (18px)
  size/xl (20px)
  size/2xl (24px)
  weight/normal (400)
  weight/medium (500)
  weight/semibold (600)
  weight/bold (700)

component/
  mail-row/height (60px)
  mail-row/padding-x (16px)
  mail-row/padding-y (8px)
  header/height (60px)
  button/height (40px)
  button/padding-x (16px)
```

---

## ✅ **Implementation Checklist**

- [ ] Add all color tokens to CSS custom properties
- [ ] Create Figma variables for each token group
- [ ] Map component variants to token values
- [ ] Test tokens across all modules (Mail, Chat, Tasks, etc.)
- [ ] Validate accessibility contrast ratios
- [ ] Document component-specific token usage
- [ ] Create token validation tests
- [ ] Generate style guide documentation

---

*This token sheet serves as the single source of truth for LibreOllama's design system. All components should reference these tokens rather than hardcoded values.*