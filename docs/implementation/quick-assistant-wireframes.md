# Quick Assistant Capture Redesign - Wireframes

## Wireframe 1: Initial Capture State (Compact)

```
┌─────────────────────────────────────────────────────────┐
│  ✨ Quick assistant    📍 Notes · Quick Ideas      ✕  │ Hero Strip
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐   │
│  │ 📋 Captured snippet                          ▼ │   │ Collapsed
│  │ Remember to review the Q3 roadmap and...       │   │ Snippet Card
│  │ 42 words · Just now                             │   │
│  └────────────────────────────────────────────────┘   │
│                                                          │
│  ┌────────────────────────────────────────────────┐   │
│  │ /task Create a task...                     🔍  │   │ Command Input
│  └────────────────────────────────────────────────┘   │
│                                                          │
│  💡 Suggestions: /task  /note  /event  /summarize      │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  [Go to Notes]              [Cancel]  [Capture to Notes]│ Footer
└─────────────────────────────────────────────────────────┘
```

## Wireframe 2: Expanded Snippet with Edit

```
┌─────────────────────────────────────────────────────────┐
│  ✨ Quick assistant    📍 Notes · Quick Ideas      ✕  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐   │
│  │ 📋 Captured snippet      🔄 Edited  📋 Copy ▲ │   │ Expanded
│  │                                                  │   │ Snippet Card
│  │ Remember to review the Q3 roadmap and           │   │
│  │ prepare the investor deck. Also need to         │   │
│  │ coordinate with design team on the new          │   │
│  │ mockups. Don't forget to send follow-up         │   │
│  │ email to Sarah about the partnership.           │   │
│  │                                                  │   │
│  │ 42 words · Captured 2 minutes ago              │   │
│  └────────────────────────────────────────────────┘   │
│                                                          │
│  ┌────────────────────────────────────────────────┐   │
│  │ Review Q3 roadmap and prepare deck          🔍  │   │ Edited text
│  └────────────────────────────────────────────────┘   │ in input
│                                                          │
│  💡 Suggestions: /task  /note  /event                   │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  [Go to Notes]              [Cancel]  [Capture to Notes]│
└─────────────────────────────────────────────────────────┘
```

## Wireframe 3: Advanced Panel Open (Task Command)

```
┌─────────────────────────────────────────────────────────┐
│  ✨ Quick assistant    📍 Tasks · Work Projects    ✕  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐   │
│  │ 📋 Review Q3 roadmap and prepare deck     ▼ │   │
│  │ 6 words · Just now                              │   │
│  └────────────────────────────────────────────────┘   │
│                                                          │
│  ┌────────────────────────────────────────────────┐   │
│  │ /task Review Q3 roadmap and prepare deck   🔍  │   │
│  └────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─ Add details ───────────────────────────────▲─┐   │ Advanced Panel
│  │                                                  │   │ (Expanded)
│  │  Assignee                                       │   │
│  │  ┌──────────────────────────────────────────┐ │   │
│  │  │ Assign to...                          ▼ │ │   │
│  │  └──────────────────────────────────────────┘ │   │
│  │                                                  │   │
│  │  Due date                                       │   │
│  │  ┌──────────────────────────────────────────┐ │   │
│  │  │ 📅 Pick a date                        ▼ │ │   │
│  │  └──────────────────────────────────────────┘ │   │
│  │                                                  │   │
│  │  Priority                                       │   │
│  │  [⚪ Low]  [🟡 Medium]  [🔴 High]           │   │
│  │                                                  │   │
│  └────────────────────────────────────────────────┘   │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  [Go to Tasks]              [Cancel]    [Create task]  │
└─────────────────────────────────────────────────────────┘
```

## Wireframe 4: Diff View (Original vs Edited)

```
┌─────────────────────────────────────────────────────────┐
│  ✨ Quick assistant    📍 Notes · Quick Ideas      ✕  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐   │
│  │ 📋 Captured snippet      🔄 View diff       ▲ │   │
│  └────────────────────────────────────────────────┘   │
│                                                          │
│  ┌────────────────────────────────────────────────┐   │
│  │ [Result] [Original] [Diff ✓]                   │   │ Tab Controls
│  ├────────────────────────────────────────────────┤   │
│  │                                                  │   │
│  │  Original                   │  Edited           │   │ Side-by-side
│  │  ────────────────────────── │ ───────────────── │   │ Diff View
│  │  Remember to review the     │ Review Q3 roadmap │   │
│  │  Q3 roadmap and prepare    │ and prepare deck  │   │
│  │  the investor deck. Also   │                    │   │
│  │  need to coordinate with   │ ❌ Removed         │   │
│  │  design team...             │                    │   │
│  │                              │ ✅ Added          │   │
│  │                                                  │   │
│  │  [↩️ Revert to original]                       │   │
│  └────────────────────────────────────────────────┘   │
│                                                          │
│  ┌────────────────────────────────────────────────┐   │
│  │ Review Q3 roadmap and prepare deck          🔍  │   │
│  └────────────────────────────────────────────────┘   │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  [Go to Notes]              [Cancel]  [Capture to Notes]│
└─────────────────────────────────────────────────────────┘
```

## Wireframe 5: Empty State (No Selection)

```
┌─────────────────────────────────────────────────────────┐
│  ✨ Quick assistant                               ✕  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│                    📝                                   │
│                                                          │
│          Capture anything or start with a command      │
│                                                          │
│  ┌────────────────────────────────────────────────┐   │
│  │ Type or paste content...                    🔍  │   │
│  └────────────────────────────────────────────────┘   │
│                                                          │
│  💡 Try:                                                │
│     /task Create a new task                             │
│     /note Save a quick note                             │
│     /event Schedule an event                            │
│     /summarize Summarize latest meeting                 │
│                                                          │
│  ⌨️  Press ⌘/Ctrl + K anytime to open                  │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                    [Cancel]   [Capture] │
└─────────────────────────────────────────────────────────┘
```

## Wireframe 6: Output Preview (AI Transformation)

```
┌─────────────────────────────────────────────────────────┐
│  ✨ Quick assistant    📍 Notes · Quick Ideas      ✕  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐   │
│  │ 📋 Original: "Remember to review the Q3..."  ▼ │   │
│  │ 156 words · 3 minutes ago                       │   │
│  └────────────────────────────────────────────────┘   │
│                                                          │
│  ┌────────────────────────────────────────────────┐   │
│  │ /summarize                                   🔍  │   │
│  └────────────────────────────────────────────────┘   │
│                                                          │
│  ┌────────────────────────────────────────────────┐   │
│  │ [Result ✓] [Original] [Diff]                   │   │ Output Preview
│  ├────────────────────────────────────────────────┤   │ Tabs
│  │                                                  │   │
│  │  ✨ AI Summary:                                │   │
│  │                                                  │   │
│  │  Key action items:                              │   │
│  │  • Review Q3 roadmap                            │   │
│  │  • Prepare investor deck                        │   │
│  │  • Coordinate with design team on mockups       │   │
│  │  • Follow up with Sarah re: partnership         │   │
│  │                                                  │   │
│  │  [📋 Copy summary]                             │   │
│  └────────────────────────────────────────────────┘   │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  [Go to Notes]              [Cancel]  [Save summary]   │
└─────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
CaptureModal
├── HeroStrip
│   ├── Icon + Title
│   ├── ContextChip (source info)
│   └── CloseButton
├── SnippetCard (conditional)
│   ├── Header (with collapse/expand)
│   ├── Content (truncated or full)
│   ├── Actions (Copy, Diff badge)
│   └── Metadata (word count, timestamp)
├── DiffViewer (conditional)
│   ├── Tabs (Result, Original, Diff)
│   └── Content panes
├── CommandInput
│   ├── Input field
│   ├── Suggestions dropdown
│   └── Search icon
├── CommandSuggestions
│   └── Chip list
├── AdvancedPanel (conditional)
│   ├── Toggle button
│   └── Dynamic fields based on command
│       ├── TaskFields (assignee, due date, priority)
│       ├── NoteFields (notebook, tags)
│       └── EventFields (start, end, location)
└── Footer
    ├── Secondary link
    ├── Cancel button
    └── Primary action (context-aware label)
```

## Interaction Flows

### Flow 1: Quick Capture (Fastest Path)
1. User presses Cmd/Ctrl+K with text selected
2. Modal opens with snippet collapsed
3. User presses Enter or clicks "Capture to Notes"
4. Done ✅

### Flow 2: Edit Before Capture
1. User presses Cmd/Ctrl+K with text selected
2. Modal opens with snippet collapsed
3. User clicks expand on snippet card
4. User edits text in command input
5. Diff badge appears on snippet card
6. User clicks "Capture to Notes"
7. Done ✅

### Flow 3: Route to Task with Metadata
1. User presses Cmd/Ctrl+K with text selected
2. User types `/task` in command input
3. Command input shows task-specific suggestions
4. User clicks "Add details" to open advanced panel
5. User sets due date and priority
6. User clicks "Create task"
7. Done ✅

### Flow 4: AI Transformation
1. User presses Cmd/Ctrl+K with text selected
2. User types `/summarize`
3. Output preview tabs appear
4. AI generates summary in Result tab
5. User can compare Original vs Result
6. User clicks "Save summary"
7. Done ✅

## Design Tokens Used

- **Elevation**: `--elevation-lg`, `--elevation-xl`
- **Border**: `--border-subtle`, `--border-strong`
- **Radius**: `--radius-lg` (16px for modal), `--radius-md` (12px for cards)
- **Spacing**: `--space-4`, `--space-6`
- **Background**: `--bg-surface`, `--bg-surface-elevated`, `--bg-surface-subtle`
- **Text**: `--text-primary`, `--text-secondary`, `--text-tertiary`
- **Focus**: `--focus-ring`
- **Modal**: `--quick-modal-max-w` (480px), `--modal-radius`
