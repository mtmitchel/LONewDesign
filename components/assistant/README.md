# Assistant System

This directory owns the end-to-end quick assistant experience: the floating launcher, global hotkeys, capture dialog, and routing into quick-create modals.

## Directory layout

```
components/assistant/
├── AssistantCaptureDialog.tsx   # Thin wrapper around capture/CaptureDialog
├── capture/                     # Modular capture dialog (shell, panes, hooks)
├── quick/                       # Quick assistant provider, commands, telemetry
├── index.ts                     # Public exports
└── README.md                    # You are here
```

### QuickAssistantProvider

`QuickAssistantProvider` (now located under `components/assistant/quick/`) renders the floating launcher, registers global shortcuts (`⌘/Ctrl+K`, `T`, `N`, `E`), and feeds captures into existing quick modals (`QuickTaskModal`, `QuickNoteModal`, `QuickEventModal`). Wrap the application shell once:

```tsx
import { QuickAssistantProvider } from '@/components/assistant';
	export function AppShell({ children }: { children: React.ReactNode }) {
	return <QuickAssistantProvider>{children}</QuickAssistantProvider>;
}
```

Open the assistant programmatically with scoped context:

```tsx
import { openQuickAssistant } from '@/components/assistant';

openQuickAssistant({ mode: 'task', initialValue: 'Follow up with design' });
```

### AssistantCaptureDialog

The dialog powers autosizing capture, slash-command detection, and adaptive primary CTAs. Props:

| Prop | Type | Description |
| --- | --- | --- |
| `open` | `boolean` | Controls visibility |
| `initialValue?` | `string` | Pre-filled selection or seed text |
| `onOpenChange` | `(open: boolean) => void` | Called when the dialog toggles |
| `onSubmit` | `({ text, command }) => Promise<void>` | Async submission handler |
| `onCommandSelect?` | `(command) => void` | Fired when the inferred command changes |
| `onError?` | `(message: string) => void` | Optional error callback (used for toasts) |

### Telemetry surface

The provider emits structured events that downstream modules can observe:

- `assistant.opened`
- `assistant.command_selected`
- `assistant.submitted`
- `assistant.error`
- `quick-assistant:create-note`
- `quick-assistant:create-event`

### Legacy prototype

The retired CaptureModal prototype (diff viewer, snippet card, advanced panel) now lives under `archive/assistant-prototype/`. Reference those files and the archival docs in `docs/archive/assistant-prototype/` if you need to revisit the initial exploration.
