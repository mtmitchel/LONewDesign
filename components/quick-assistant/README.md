# Quick Assistant Capture Redesign - Prototype

This directory contains the complete prototype implementation of the Quick Assistant Capture Redesign as specified in `/docs/implementation/quick-assistant-capture-redesign.md`.

## 📁 Component Structure

```
components/quick-assistant/
├── README.md                      # This file
├── index.ts                       # Public exports
├── CaptureModal.tsx              # Main orchestrating component
├── SnippetCard.tsx               # Collapsible snippet display
├── CommandInput.tsx              # Input with command suggestions
├── AdvancedPanel.tsx             # Progressive disclosure metadata fields
├── DiffViewer.tsx                # Original vs edited comparison
├── useCaptureSession.ts          # State management hook
└── QuickAssistantProvider.tsx    # Existing provider (integrate CaptureModal here)
```

## 🎨 Features Implemented

### ✅ Progressive Disclosure
- **Hero Strip**: Always visible with icon, title, context chip, and close button
- **Snippet Card**: Collapsible card showing first 2 lines when collapsed, full text when expanded
- **Command Input**: Auto-focus, command detection, inline suggestions
- **Advanced Panel**: Hidden by default, reveals metadata fields based on command type
- **Footer**: Context-aware button labels that adapt to selected command

### ✅ Original vs Edited Tracking
- State hook maintains both `originalSnippet` and `workingCopy`
- Diff badge appears when content is edited
- DiffViewer shows:
  - Result tab (edited version)
  - Original tab (unchanged)
  - Diff tab (side-by-side + inline comparison)
- One-click revert to original

### ✅ Command Routing
- Detects `/task`, `/note`, `/event`, `/summarize` commands
- Shows appropriate metadata fields per command:
  - **Task**: assignee, due date, priority
  - **Note**: notebook, tags
  - **Event**: date, start/end time, location
- Command suggestions chips for quick selection

### ✅ Edge Cases Handled
- **Empty state**: Friendly prompt when no text captured
- **Large snippets**: Warning for >500 word selections
- **Keyboard shortcuts**: Enter to submit, Esc to close, Tab navigation
- **Auto-focus**: Input focuses automatically in appropriate contexts
- **Timestamp formatting**: Relative time display ("Just now", "2 minutes ago")

## 🚀 Usage

### Basic Integration

Replace the basic assistant modal in `QuickAssistantProvider.tsx`:

```tsx
import { CaptureModal } from "./CaptureModal";

// In QuickAssistantProvider component:
<CaptureModal
  open={assistant.open}
  onOpenChange={(next) => {
    if (!next) resetAssistant();
  }}
  initialSnippet={assistant.initialValue}
  source="Notes · Quick Ideas"
  onCapture={(payload) => {
    // Handle capture based on command type
    if (payload.command === "task") {
      handleTaskCreate({
        title: payload.content,
        ...payload.metadata,
      });
    } else if (payload.command === "event") {
      handleEventCreate({
        title: payload.content,
        ...payload.metadata,
      });
    } else {
      // Default to note
      emitCreateNote({
        title: payload.content.slice(0, 80),
        body: payload.content,
      });
    }
  }}
/>
```

### Standalone Usage

```tsx
import { CaptureModal } from "@/components/quick-assistant";

function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <CaptureModal
      open={open}
      onOpenChange={setOpen}
      initialSnippet="Remember to review the Q3 roadmap..."
      source="Email · Project Updates"
      onCapture={(payload) => {
        console.log("Captured:", payload);
        // Handle the capture
      }}
    />
  );
}
```

### Using the State Hook Directly

```tsx
import { useCaptureSession } from "@/components/quick-assistant";

function CustomCaptureUI() {
  const {
    state,
    hasEdits,
    setWorkingCopy,
    setCommand,
    toggleSnippetExpanded,
  } = useCaptureSession("Initial text", "My Source");

  return (
    <div>
      <p>Original: {state.originalSnippet}</p>
      <p>Working: {state.workingCopy}</p>
      <p>Has edits: {hasEdits ? "Yes" : "No"}</p>
      <input
        value={state.workingCopy}
        onChange={(e) => setWorkingCopy(e.target.value)}
      />
    </div>
  );
}
```

## 🎯 Component APIs

### CaptureModal

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Whether modal is open |
| `onOpenChange` | `(open: boolean) => void` | Callback when open state changes |
| `initialSnippet` | `string?` | Pre-filled captured text |
| `source` | `string?` | Context label (e.g., "Notes · Quick Ideas") |
| `onCapture` | `(payload) => void` | Called when user captures content |

### SnippetCard

| Prop | Type | Description |
|------|------|-------------|
| `snippet` | `string` | Text to display |
| `isExpanded` | `boolean` | Expanded state |
| `onToggleExpanded` | `() => void` | Toggle callback |
| `hasEdits` | `boolean` | Show edit badge |
| `onViewDiff` | `() => void?` | View diff callback |
| `onRevert` | `() => void?` | Revert to original |
| `metadata` | `object` | Word count and timestamp |
| `isLarge` | `boolean?` | Show large snippet warning |

### CommandInput

| Prop | Type | Description |
|------|------|-------------|
| `value` | `string` | Input value |
| `onChange` | `(value: string) => void` | Change handler |
| `onCommandSelect` | `(cmd: CommandType) => void` | Command detected |
| `placeholder` | `string?` | Placeholder text |
| `autoFocus` | `boolean?` | Auto-focus input |
| `onSubmit` | `() => void?` | Submit handler (Enter key) |

### useCaptureSession

```typescript
const {
  state,                    // Full session state
  hasEdits,                // Boolean: working copy differs from original
  isLargeSnippet,          // Boolean: >500 words
  commandMetadata,         // Command-specific metadata
  setWorkingCopy,          // Update working copy
  setCommand,              // Set command type
  setCommandMetadata,      // Update metadata
  toggleSnippetExpanded,   // Toggle snippet card
  toggleAdvancedPanel,     // Toggle advanced fields
  revertToOriginal,        // Revert edits
  setShowOutputPreview,    // Show AI output
  reset,                   // Reset to new snippet
} = useCaptureSession(initialSnippet, source);
```

## 🎨 Design Tokens Used

The components use design tokens from `styles/globals.css`:

- **Spacing**: `--space-{2,3,4,5,6}`
- **Radius**: `--radius-sm`, `--radius-md`, `--radius-lg`
- **Elevation**: `--elevation-lg`, `--elevation-xl`
- **Border**: `--border-subtle`, `--border-strong`
- **Background**: `--bg-surface`, `--bg-surface-elevated`, `--bg-surface-subtle`
- **Text**: `--text-primary`, `--text-secondary`, `--text-tertiary`
- **Modal**: `--quick-modal-max-w`, `--modal-radius`, `--modal-footer-h`
- **Colors**: `--primary`, `--accent-primary`, `--focus-ring`

## 📋 Validation Checklist

Based on the spec requirements:

- ✅ Hotkey capture shows correct snippet in collapsed card
- ✅ Expanding snippet preserves formatting and allows edits
- ✅ Diff badge appears only when text changes
- ✅ Advanced panel remembers fields per command
- ✅ Output preview tab appears after transformations (structure ready)
- ✅ All CTAs and copy match spec
- ✅ Submissions include both original and edited text metadata
- ✅ Keyboard navigation works (Tab, Enter, Esc)
- ✅ Empty state provides helpful guidance
- ✅ Large snippet warning for >500 words

## 🔄 Integration Steps

1. **Test the prototype standalone**:
   - Import `CaptureModal` in a test page
   - Pass sample data and verify all states work

2. **Replace basic modal in QuickAssistantProvider**:
   - Swap out the current `<QuickModal>` assistant component
   - Wire up the `onCapture` callback to existing handlers
   - Test all keyboard shortcuts still work

3. **Migrate command parsing**:
   - The modal handles command detection internally
   - Existing `parseCommand` logic can be simplified
   - Route captured content to appropriate modules

4. **Test all flows**:
   - Quick capture (no edits)
   - Edit before capture
   - Command routing (/task, /note, /event)
   - Advanced metadata entry
   - Diff viewing and reverting

## 🚧 Future Enhancements

From the spec document:

- [ ] AI-assisted rewriting in diff tab
- [ ] Multiple captures stacking in one session
- [ ] Recently used tags/projects quick chips
- [ ] Jump back to source links
- [ ] Batch capture summary mode
- [ ] Code snippet detection and copy-as-code toggle
- [ ] Rich text formatting preservation

## 📚 Related Documentation

- **Spec**: `/docs/implementation/quick-assistant-capture-redesign.md`
- **Wireframes**: `/docs/implementation/quick-assistant-wireframes.md`
- **Design System**: `AGENTS.md`, `design-tokens.md`
- **Existing Components**: `/components/extended/Quick*.tsx`

## 🤝 Contributing

When modifying these components:

1. Maintain design token usage (no hardcoded values)
2. Test keyboard navigation thoroughly
3. Ensure mobile responsiveness (compact mode)
4. Follow existing TypeScript patterns
5. Update this README if adding new features
6. Run `npm run type-check` before committing
