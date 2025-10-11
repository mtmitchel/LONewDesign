# Quick Assistant Capture Modal - Integration Guide

> **Legacy notice:** The CaptureModal prototype documented below has been superseded by `components/assistant/AssistantCaptureDialog.tsx` and the updated `QuickAssistantProvider`. Keep this guide for historical reference only—do **not** import the archived prototype into production code.

## Current State

The existing `QuickAssistantProvider` uses a basic modal with a single input field:

```tsx
<QuickModal
  open={assistant.open}
  onOpenChange={(next) => {
    if (!next) {
      resetAssistant();
    } else {
      setAssistant((prev) => ({ ...prev, open: true }));
    }
  }}
  title="Quick assistant"
  description="Capture anything or start with /task, /note, /event"
>
  <form onSubmit={...}>
    <input
      value={assistant.initialValue}
      onChange={(event) =>
        setAssistant((prev) => ({
          ...prev,
          initialValue: event.target.value,
        }))
      }
      placeholder="Capture a thought or type /task, /note, /event"
    />
    ...
  </form>
</QuickModal>
```

## New State

Replace with the enhanced CaptureModal (historically colocated with `QuickAssistantProvider`; the prototype now lives under `archive/assistant-prototype` purely for reference):

```tsx
import { CaptureModal } from "./CaptureModal"; // prototype path; see archive/assistant-prototype

<CaptureModal
  open={assistant.open}
  onOpenChange={(next) => {
    if (!next) {
      resetAssistant();
    } else {
      setAssistant((prev) => ({ ...prev, open: true }));
    }
  }}
  initialSnippet={assistant.initialValue}
  source={scopeRef.current?.source}
  onCapture={handleCaptureSubmit}
/>
```

> **Note:** In the current product code, use `components/assistant/AssistantCaptureDialog.tsx` instead of wiring this prototype. The snippet above is retained only to show how the original modal integrated before the redesign.

## Implementation Steps

### Step 1: Add the Capture Handler

Add a new handler in `QuickAssistantProvider` that receives the enhanced payload:

```tsx
const handleCaptureSubmit = useCallback(
  (payload: {
    command: CommandType;
    content: string;
    originalContent: string;
    metadata: any;
  }) => {
    const currentScope = scopeRef.current;

    switch (payload.command) {
      case "task":
        addTask({
          title: payload.content,
          dueDate: payload.metadata?.dueDate,
          priority: payload.metadata?.priority,
          source: "quick-assistant",
          listId: currentScope?.listId ?? undefined,
        });
        toast.success(`Task "${payload.content}" created`);
        break;

      case "event":
        emitCreateEvent({
          title: payload.content,
          date: payload.metadata?.date ?? new Date().toISOString().slice(0, 10),
          start: payload.metadata?.startTime,
          end: payload.metadata?.endTime,
        });
        break;

      case "note":
      default:
        emitCreateNote({
          title: payload.content.slice(0, 80),
          body: payload.content,
          originalSnippet: payload.originalContent, // Preserve for audit
        });
        break;
    }

    resetAssistant();
  },
  [addTask, emitCreateEvent, emitCreateNote, resetAssistant]
);
```

### Step 2: Update Type Definitions

Ensure CommandType is imported and available (in the prototype it lived alongside the modal):

```tsx
import { CommandType } from "./useCaptureSession"; // prototype path; see archive/assistant-prototype
```

### Step 3: Remove Old Command Parsing

The new modal handles command detection internally, so you can simplify the existing `handleAssistantSubmit` or remove it entirely if only using the new modal.

### Step 4: Optional - Enhance Scope Context

Add a source label to the scope for better context display:

```tsx
const setScope = useCallback((scope: QuickAssistantScope | null) => {
  scopeRef.current = {
    ...scope,
    source: scope?.folderId
      ? `Notes · ${scope.folderId}`
      : scope?.listId
      ? `Tasks · ${scope.listId}`
      : "Quick capture",
  };
}, []);
```

### Step 5: Test All Flows

1. **Quick capture with Cmd/Ctrl+K**:
   - Select text on page
   - Press Cmd/Ctrl+K
   - Modal opens with snippet
   - Press Enter → captures to notes

2. **Task creation**:
   - Open modal
   - Type "/task Review Q3"
   - Click "Add details"
   - Set due date and priority
   - Click "Create task"

3. **Event scheduling**:
   - Open modal
   - Type "/event Team meeting"
   - Set date and time in advanced panel
   - Click "Schedule event"

4. **Edit before capture**:
   - Open modal with captured text
   - Edit the text in command input
   - Diff badge appears
   - Click to view diff
   - Revert if needed
   - Capture

## Migration Checklist

- [ ] Import CaptureModal component
- [ ] Add handleCaptureSubmit function
- [ ] Replace QuickModal with CaptureModal
- [ ] Wire up onCapture prop
- [ ] Test keyboard shortcuts (Cmd/Ctrl+K)
- [ ] Test all command types (/task, /note, /event)
- [ ] Test advanced panel for each command
- [ ] Test diff viewing and revert
- [ ] Test empty state
- [ ] Test large snippet handling
- [ ] Verify scoping works (project context preserved)
- [ ] Run type-check: `npm run type-check`
- [ ] Test in Tauri window (not just browser)

## Backwards Compatibility

The new modal is designed to be a drop-in replacement. The existing:
- Keyboard shortcuts continue to work
- Command parsing logic is preserved (enhanced)
- Scope tracking remains unchanged
- Toast notifications work the same
- Event dispatching is compatible

## Rollback Plan

If issues arise, simply revert to the old QuickModal by commenting out the CaptureModal and uncommenting the original modal code. No data or state changes persist.

## Performance Considerations

The new modal:
- Lazy-loads diff computation (only when requested)
- Uses React.useMemo for expensive calculations
- Maintains the same render cycle as the old modal
- No additional bundle size concerns (uses existing dependencies)

## Accessibility Improvements

The new design enhances accessibility:
- Better keyboard navigation (Tab order)
- ARIA labels on all interactive elements
- Focus management (auto-focus appropriate fields)
- High contrast mode compatible
- Screen reader friendly structure

## Next Steps

After integration:
1. Monitor user feedback on the new interaction model
2. Gather metrics on command usage patterns
3. Consider implementing AI transformation features (/summarize)
4. Add recently used metadata quick chips
5. Implement multi-capture stacking for batch operations
