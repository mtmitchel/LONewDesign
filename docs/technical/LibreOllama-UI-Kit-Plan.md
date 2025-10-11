# LibreOllama UI Kit Usage Plan
*Asana + Sunsama Design System Implementation Guide*

## 🎯 **Overview**

This plan outlines how to effectively use the LibreOllama UI Kit. The system leans on warm canvas neutrals, blue-gray primary accents, and coral highlights while borrowing structure from Asana + Sunsama. Treat this as the day-to-day reference for composing new surfaces with the tokenized primitives.

---

## 📋 **Design System Foundation**

### **🎨 Color Token Strategy**
```css
/* Primary Usage - Calm Blue-Gray */
--primary: hsl(214 25% 27%);              /* Main actions, CTAs */
--primary-hover: hsl(220 39% 18%);        /* Interactive states */
--primary-tint-10: hsl(214 25% 27% / 0.1);/* Selection + hover */

/* Surface Hierarchy */
--bg-canvas: hsl(60 9% 98%);              /* Warm off-white canvas */
--bg-surface: hsl(0 0% 100%);             /* Cards, modals */
--bg-surface-elevated: hsl(210 20% 95%);  /* Raised panels, hover shells */

/* Accent + Status */
--accent-coral: hsl(0 85% 71%);           /* Highlights, urgent states */
--success: hsl(160 50% 60%);              /* Success feedback */
--warning: hsl(38 85% 63%);               /* Attention states */
--danger: var(--accent-coral);            /* Errors & destructive */

/* Text + Borders (namespaced in Tailwind via text-[color:...] etc.) */
--text-primary: hsl(223 44% 12%);
--text-secondary: hsl(215 25% 27%);
--border-subtle: hsl(220 13% 91%);
--border-divider: hsl(210 20% 95%);
```

### **📏 Spacing System (8pt Grid)**
```css
--space-1: 4px    /* Tight spacing */
--space-2: 8px    /* Standard spacing */
--space-3: 12px   /* Comfortable spacing */
--space-4: 16px   /* Section spacing */
--space-6: 24px   /* Large spacing */
--space-8: 32px   /* Component separation */
```

---

## 🏗️ **Component Architecture**

### **Tier 1: Core UI Components** (`/components/ui/`)
These are your foundational shadcn components - use these as building blocks:

#### **Navigation & Layout**
- `button.tsx` - Primary, secondary, ghost, tonal variants
- `card.tsx` - Content containers with consistent elevation
- `separator.tsx` - Visual content separation
- `tabs.tsx` - Content organization within modules

#### **Form Controls**
- `input.tsx`, `textarea.tsx` - User input collection
- `select.tsx`, `checkbox.tsx`, `switch.tsx` - Options selection
- `form.tsx` - Structured form validation

#### **Feedback & Communication**
- `alert.tsx` - System messages and notifications
- `dialog.tsx`, `sheet.tsx` - Modal interactions
- `tooltip.tsx` - Contextual help
- `progress.tsx` - Task completion indicators

### **Tier 2: Extended Components** (`/components/extended/`)
Enhanced functionality for productivity workflows:

- `command-palette.tsx` - Quick actions across modules
- `data-table.tsx` - Complex data display
- `search-input.tsx` - Unified search experience
- `empty-state.tsx` - Graceful no-content handling
- `loading-spinner.tsx` - Consistent loading states

### **Tier 3: Layout Components** (`/components/`)
Specialized layout solutions:

- `TriPane.tsx` - Three-column productivity layouts
- `AppShell.tsx` - Global application structure
- `Sidebar.tsx` - Navigation and module switching

### **Tier 4: Module Components** (`/components/modules/`)
Complete feature implementations following the design system.

---

## 🎨 **Component Usage Guidelines**

### **🔘 Button Patterns**
```tsx
// Primary actions (save, send, create)
<Button variant="default">Save Changes</Button>

// Secondary actions (cancel, back)
<Button variant="outline">Cancel</Button>

// Subtle actions (edit, more options)
<Button variant="ghost">Edit</Button>

// Highlighted actions (featured functionality)
<Button variant="tonal">Add New Project</Button>
```

### **📦 Card Hierarchy**
```tsx
// Main content containers
<Card className="bg-[var(--bg-surface)]">
  <CardHeader>
    <CardTitle>Primary Content</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>

// Elevated elements (sidebars, floating panels)
<Card className="bg-[var(--bg-surface-elevated)]">
  <CardContent>Sidebar Content</CardContent>
</Card>
```

### **🎯 Color & Token Application**
```tsx
// Text hierarchy (namespaced arbitrary values)
className="text-[color:var(--text-primary)]"    // Headers, important content
className="text-[color:var(--text-secondary)]"  // Supporting text, metadata

// Interactive elements
className="border-[color:var(--border-subtle)]"   // Default borders
className="hover:bg-[color:var(--primary-tint-10)]" // Calm hover

// Status indicators
className="text-[color:var(--success)]"   // Positive states
className="text-[color:var(--warning)]"   // Attention needed
className="text-[color:var(--danger)]"    // Error states

// Shadow + elevation helpers
className="shadow-[var(--elevation-sm)]"
className="rounded-[var(--radius-md)]"
```

---

## 🔄 **Module Development Workflow**

### **Phase 1: Planning & Structure**
1. **Identify layout needs**: Single pane, tri-pane, or custom layout?
2. **Map user flows**: What actions will users perform?
3. **Plan component hierarchy**: Which UI components will you need?
4. **Consider state management**: Local state vs. global state needs

### **Phase 2: Implementation Strategy**
```tsx
// 1. Start with layout structure
import { TriPane } from '../TriPane';
import { Card, CardHeader, CardContent } from '../ui/card';

// 2. Build content areas
const MyModule = () => {
  return (
    <TriPane
      leftPane={<NavigationPane />}
      centerPane={<MainContent />}
      rightPane={<DetailPane />}
    />
  );
};

// 3. Implement interactions
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { toast } from 'sonner';
```

### **Phase 3: Polish & Consistency**
1. **Apply design tokens consistently**
2. **Add loading and empty states**
3. **Implement error handling**
4. **Test responsive behavior**
5. **Validate accessibility**

---

## 📱 **Responsive Design Strategy**

### **Breakpoint Approach**
```tsx
// Desktop-first design with mobile adaptations
<TriPane
  leftPane={<Sidebar />}           // Hidden on mobile
  centerPane={<MainContent />}     // Full width on mobile
  rightPane={<DetailPanel />}      // Overlay on mobile
  className="responsive-tripane"
/>
```

### **Mobile Optimizations**
- **Navigation**: Collapsible sidebar → bottom navigation
- **Tri-pane layouts**: Stack vertically or use overlays
- **Touch targets**: Ensure 44px minimum touch areas
- **Typography**: Slightly larger text for mobile readability

---

## 🎨 **Design System Best Practices**

### **✅ Do's**
- **Use design tokens exclusively** - No hardcoded colors or spacing
- **Follow component variants** - Use provided button/card variants
- **Maintain spacing consistency** - Stick to the 8pt grid system
- **Leverage semantic colors** - Use success/warning/danger appropriately
- **Apply elevation hierarchy** - Canvas → Surface → Elevated surface

### **❌ Don'ts**
- **Avoid custom color values** - Always use CSS custom properties
- **Don't break spacing patterns** - Stick to defined spacing tokens
- **Avoid font-size overrides** - Use the typography system
- **Don't create duplicate components** - Extend existing ones
- **Avoid layout hacks** - Use provided layout components

---

## 🔧 **Development Guidelines**

### **Component Creation Checklist**
- [ ] Uses design tokens from `globals.css`
- [ ] Follows naming conventions (`PascalCase` for components)
- [ ] Includes proper TypeScript interfaces
- [ ] Handles loading and error states
- [ ] Implements keyboard navigation
- [ ] Supports both light and dark themes
- [ ] Includes JSDoc documentation

### **File Organization**
```
/components/
├── ui/              # Core shadcn components (don't modify)
├── extended/        # Enhanced utility components
├── modules/         # Feature-complete modules
└── [component].tsx  # Specialized layout components
```

### **Import Strategy**
```tsx
// Preferred: Import from ui directory
import { Button, Card, Input } from './ui/button';
import { SearchInput } from './extended/search-input';

// Component-specific imports
import { TriPane } from './TriPane';
import { MailModule } from './modules/MailModule';
```

---

## 🎯 **Module Migration Strategy**

### **Existing Module Updates**
1. **Dashboard Module** ✅ - Already updated with design system
2. **Mail Module** ✅ - Has both legacy and TriPane versions
3. **Chat Module** - Needs design system migration
4. **Notes Module** ✅ - Enhanced version available
5. **Tasks Module** ✅ - Enhanced version available
6. **Calendar Module** - Needs design system migration
7. **Canvas Module** - Needs design system migration
8. **Settings Module** - Needs design system migration

### **Migration Checklist**
```tsx
// Before migration (legacy style)
<div className="bg-white rounded-lg shadow-sm border p-4">
  <h2 className="text-lg font-semibold mb-2">Title</h2>
  <p className="text-gray-600">Content</p>
</div>

// After migration (design system)
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-[var(--text-secondary)]">Content</p>
  </CardContent>
</Card>
```

---

## 🚀 **Next Steps & Roadmap**

### **Immediate Actions**
1. **Create component usage examples** in the Design Showcase
2. **Document component APIs** with TypeScript interfaces
3. **Add accessibility testing** to each component
4. **Implement consistent error boundaries**

### **Short-term Goals (2-4 weeks)**
1. **Migrate remaining modules** to new design system
2. **Add component unit tests** for reliability
3. **Create animation system** using Motion/React
4. **Implement theme switching** (light/dark)

### **Long-term Vision (1-3 months)**
1. **Component performance optimization**
2. **Advanced accessibility features** (screen reader support)
3. **Design system documentation site**
4. **Automated design token updates**

---

## 📚 **Resources & References**

### **Key Files**
- `styles/globals.css` - Design token definitions
- `components/AsanaDesignSystemDemo.tsx` - Component showcase
- `components/TriPane.tsx` - Productivity layout system
- `components/ui/` - Core component library

### **Design Inspiration**
- **Asana**: Clean cards, subtle shadows, comfortable spacing
- **Sunsama**: Soft colors, calm aesthetics, productivity focus
- **Modern productivity tools**: Notion, Linear, Height

### **Development Tools**
- **Tailwind CSS v4** - Utility-first styling
- **TypeScript** - Type safety and developer experience
- **shadcn/ui** - High-quality component foundation
- **Lucide React** - Consistent icon system

---

*This plan evolves with your design system. Update it as you add new components and refine the user experience.*
