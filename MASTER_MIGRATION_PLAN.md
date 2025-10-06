# Module Migration Master Plan

The current module inventory mirrors the structure in `App.tsx`; legacy variants are safely parked under `archive/` (e.g., `MailModule.tsx`, `NotesModuleBasic.tsx`). No conflicting production modules were found. The plan below accepts the prior audit with one addition: the Notes module also requires token and accessibility alignment.

```json
{
  "executable_tasks": [
    {
      "task_id": "chat-a11y-roving-focus",
      "description": "Wire ARIA listbox semantics and roving focus for the conversation list so keyboard users can traverse panes like Mail",
      "target_files": [
        {
          "path": "components/modules/ChatModule.tsx",
          "line_range": "105-310",
          "function_name": "ChatModule"
        }
      ],
      "code_changes": [
        {
          "operation": "insert",
          "find_pattern": "const [selectedModel, setSelectedModel] = useState<AIModel>(availableModels[0]);",
          "replace_with": "const listRef = useRef<HTMLDivElement>(null);\n  const [focusedConversationId, setFocusedConversationId] = useState(selectedConversation.id);\n  const handleConversationKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, conversationIds: string[]) => { /* implement roving focus + activation */ };",
          "line_number": "112"
        },
        {
          "operation": "replace",
          "find_pattern": "<div className=\"flex-1 overflow-y-auto\">",
          "replace_with": "<div\n          ref={listRef}\n          role=\"listbox\"\n          aria-activedescendant={focusedConversationId}\n          tabIndex={0}\n          className=\"flex-1 overflow-y-auto focus:outline-none\"\n          onKeyDown={(event) => handleConversationKeyDown(event, mockConversations.map((c) => c.id))}\n        >",
          "line_number": "165"
        },
        {
          "operation": "replace",
          "find_pattern": "onClick={() => setSelectedConversation(conversation)}\n                      className={`p-4 border-b border-[var(--border-subtle)] cursor-pointer transition-colors hover:bg-[var(--primary-tint-10)]/30 ${",
          "replace_with": "onClick={() => setSelectedConversation(conversation)}\n                      onFocus={() => setFocusedConversationId(conversation.id)}\n                      id={conversation.id}\n                      role=\"option\"\n                      aria-selected={selectedConversation?.id === conversation.id}\n                      tabIndex={selectedConversation?.id === conversation.id ? 0 : -1}\n                      className={`p-4 border-b border-[var(--border-subtle)] cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] hover:bg-[var(--primary-tint-10)]/30 ${",
          "line_number": "176"
        }
      ],
      "validation_steps": [
        "npm run type-check",
        "manual test: focus conversation list, use ArrowUp/ArrowDown to change selection and confirm focus outline",
        "manual test: Tab between panes to confirm focus order remains logical"
      ],
      "success_criteria": "Conversation list exposes ARIA listbox semantics; arrow keys move selection while the active option is announced by assistive tech and Enter/Space opens the conversation.",
      "dependencies": [],
      "rollback_procedure": "git checkout -- components/modules/ChatModule.tsx"
    },
    {
      "task_id": "calendar-event-modal",
      "description": "Replace static mock events with state-backed events and integrate QuickEventModal for parity with Mail quick actions",
      "target_files": [
        {
          "path": "components/modules/CalendarModule.tsx",
          "line_range": "21-240",
          "function_name": "CalendarModule"
        }
      ],
      "code_changes": [
        {
          "operation": "replace",
          "find_pattern": "const mockEvents: CalendarEvent[] = [",
          "replace_with": "const initialEvents: CalendarEvent[] = [",
          "line_number": "21"
        },
        {
          "operation": "insert",
          "find_pattern": "export function CalendarModule() {",
          "replace_with": "export function CalendarModule() {\n  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);\n  const [showCreateEvent, setShowCreateEvent] = useState(false);\n  const handleCreateEvent = (payload: { title: string; date: string; start?: string; end?: string }) => { /* push into events state with generated id */ };",
          "line_number": "56"
        },
        {
          "operation": "replace",
          "find_pattern": "const todaysEvents = mockEvents;",
          "replace_with": "const todaysEvents = events.filter((event) => event.date === new Date().toISOString().slice(0, 10));",
          "line_number": "108"
        },
        {
          "operation": "replace",
          "find_pattern": "<Button className=\"bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white\">\n            <Plus size={16} className=\"mr-2\" />\n            New Event\n          </Button>",
          "replace_with": "<Button className=\"bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white\" onClick={() => setShowCreateEvent(true)}>\n            <Plus size={16} className=\"mr-2\" />\n            New Event\n          </Button>",
          "line_number": "128"
        },
        {
          "operation": "insert",
          "find_pattern": "</div>\n    </div>\n  );\n}",
          "replace_with": "{showCreateEvent && (\n        <QuickEventModal\n          open={showCreateEvent}\n          onOpenChange={setShowCreateEvent}\n          defaultDate={selectedDate ? selectedDate.toISOString().slice(0, 10) : undefined}\n          onCreate={(payload) => {\n            handleCreateEvent(payload);\n            setSelectedDate(new Date(payload.date));\n          }}\n        />\n      )}\n    </div>\n  );\n}",
          "line_number": "232"
        }
      ],
      "validation_steps": [
        "npm run type-check",
        "manual test: click New Event, create event, confirm it appears in grid and Today sidebar",
        "manual test: reload module to ensure persisted mock events still render"
      ],
      "success_criteria": "Users can add a new event via QuickEventModal and immediately see it in both the calendar grid and today's schedule list.",
      "dependencies": [],
      "rollback_procedure": "git checkout -- components/modules/CalendarModule.tsx"
    },
    {
      "task_id": "calendar-grid-a11y",
      "description": "Give the month grid proper grid semantics and arrow-key navigation comparable to Mail's message list",
      "target_files": [
        {
          "path": "components/modules/CalendarModule.tsx",
          "line_range": "130-210",
          "function_name": "CalendarModule"
        }
      ],
      "code_changes": [
        {
          "operation": "insert",
          "find_pattern": "const navigateMonth = (direction: 'prev' | 'next') => {",
          "replace_with": "const navigateMonth = (direction: 'prev' | 'next') => { /* existing body */ };\n  const handleGridKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, index: number) => { /* compute next index, focus cell */ };",
          "line_number": "100"
        },
        {
          "operation": "replace",
          "find_pattern": "<div className=\"grid grid-cols-7 gap-1 h-[calc(100%-60px)]\">",
          "replace_with": "<div\n            role=\"grid\"\n            aria-label=\"Monthly calendar\"\n            className=\"grid grid-cols-7 gap-1 h-[calc(100%-60px)]\"\n          >",
          "line_number": "160"
        },
        {
          "operation": "replace",
          "find_pattern": "className={`min-h-[120px] p-3 border border-[var(--border-subtle)] rounded-lg cursor-pointer transition-colors hover:bg-[var(--primary-tint-10)]/30 ${",
          "replace_with": "className={`min-h-[120px] p-3 border border-[var(--border-subtle)] rounded-lg cursor-pointer transition-colors hover:bg-[var(--primary-tint-10)]/30 focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] ${",
          "line_number": "164"
        },
        {
          "operation": "insert",
          "find_pattern": "onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day.date))}",
          "replace_with": "onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day.date))}\n                onKeyDown={(event) => handleGridKeyDown(event, index)}\n                role=\"gridcell\"\n                tabIndex={selectedDate?.toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day.date).toDateString() ? 0 : -1}\n                aria-selected={selectedDate?.toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day.date).toDateString()}",
          "line_number": "168"
        }
      ],
      "validation_steps": [
        "npm run type-check",
        "manual test: focus the grid and use arrow keys to move between days (including wrapping rows)",
        "manual test: verify focus rings meet contrast requirements"
      ],
      "success_criteria": "Calendar days form an accessible grid where arrow keys move focus predictably and selected dates are conveyed via ARIA.",
      "dependencies": ["calendar-event-modal"],
      "rollback_procedure": "git checkout -- components/modules/CalendarModule.tsx"
    },
    {
      "task_id": "canvas-tokenize-palette",
      "description": "Remove hardcoded canvas colors in favor of globals.css tokens and unify dotted background styling",
      "target_files": [
        {
          "path": "components/modules/CanvasModule.tsx",
          "line_range": "34-210",
          "function_name": "CanvasModule"
        }
      ],
      "code_changes": [
        {
          "operation": "insert",
          "find_pattern": "const colors = [",
          "replace_with": "const getToken = (token: string, fallback: string) => getComputedStyle(document.documentElement).getPropertyValue(token).trim() || fallback;",
          "line_number": "17"
        },
        {
          "operation": "replace",
          "find_pattern": "ctx.fillStyle = '#ffffff';",
          "replace_with": "ctx.fillStyle = getToken('--surface', '#ffffff');",
          "line_number": "48"
        },
        {
          "operation": "replace",
          "find_pattern": "backgroundImage: `radial-gradient(circle, #e2e8f0 1px, transparent 1px)`",
          "replace_with": "backgroundImage: `radial-gradient(circle, var(--border-subtle) 1px, transparent 1px)`",
          "line_number": "160"
        },
        {
          "operation": "replace",
          "find_pattern": "<div className=\"bg-white rounded-2xl shadow-lg border border-[var(--border-default)] p-2\">",
          "replace_with": "<div className=\"bg-[var(--surface)] rounded-2xl shadow-lg border border-[var(--border-default)] p-2\">",
          "line_number": "176"
        }
      ],
      "validation_steps": [
        "npm run type-check",
        "manual test: clear canvas and confirm background matches token colors",
        "manual test: inspect dotted pattern to ensure contrast is acceptable"
      ],
      "success_criteria": "Canvas initialization, clearing, and chrome all pull from design tokens with no hardcoded hex values.",
      "dependencies": [],
      "rollback_procedure": "git checkout -- components/modules/CanvasModule.tsx"
    },
    {
      "task_id": "canvas-color-picker",
      "description": "Swap the ad-hoc color swatches for the shared ColorPicker component to align with Mail's tooling",
      "target_files": [
        {
          "path": "components/modules/CanvasModule.tsx",
          "line_range": "140-230",
          "function_name": "CanvasModule"
        }
      ],
      "code_changes": [
        {
          "operation": "insert",
          "find_pattern": "import { Button } from '../ui/button';",
          "replace_with": "import { Button } from '../ui/button';\nimport { ColorPicker } from '../extended';",
          "line_number": "13"
        },
        {
          "operation": "replace",
          "find_pattern": "<div className=\"relative\">\n              <Button\n                variant=\"ghost\"\n                size=\"sm\"\n                className=\"h-10 w-10 p-0 rounded-lg hover:bg-[var(--primary-tint-10)] relative\"\n                title=\"Color Picker\"\n              >\n                <div \n                  className=\"w-5 h-5 rounded border border-gray-300\"\n                  style={{ backgroundColor: currentColor }}\n                />\n              </Button>\n            </div>",
          "replace_with": "<ColorPicker\n              value={currentColor}\n              onChange={(value) => setCurrentColor(value)}\n              triggerClassName=\"h-10 w-10 rounded-lg\"\n              ariaLabel=\"Select drawing color\"\n            />",
          "line_number": "230"
        }
      ],
      "validation_steps": [
        "npm run type-check",
        "manual test: open the color picker, choose a color, draw to confirm stroke color updates",
        "manual test: ensure focus trapping within the popover matches accessibility expectations"
      ],
      "success_criteria": "Canvas color selection uses the shared ColorPicker with proper focus handling and updates drawing strokes.",
      "dependencies": ["canvas-tokenize-palette"],
      "rollback_procedure": "git checkout -- components/modules/CanvasModule.tsx"
    },
    {
      "task_id": "canvas-tauri-export",
      "description": "Update canvas export to use Tauri save dialogs and filesystem APIs instead of DOM-only anchors",
      "target_files": [
        {
          "path": "components/modules/CanvasModule.tsx",
          "line_range": "120-210",
          "function_name": "CanvasModule"
        },
        {
          "path": "src-tauri/src/main.rs",
          "line_range": "1-80",
          "function_name": "main"
        }
      ],
      "code_changes": [
        {
          "operation": "insert",
          "find_pattern": "import { Button } from '../ui/button';",
          "replace_with": "import { Button } from '../ui/button';\nimport { save } from '@tauri-apps/api/dialog';\nimport { writeBinaryFile, BaseDirectory } from '@tauri-apps/api/fs';",
          "line_number": "13"
        },
        {
          "operation": "replace",
          "find_pattern": "const downloadCanvas = () => {\n    const canvas = canvasRef.current;\n    if (!canvas) return;\n\n    const link = document.createElement('a');\n    link.download = 'canvas-drawing.png';\n    link.href = canvas.toDataURL();\n    link.click();\n  };",
          "replace_with": "const downloadCanvas = async () => {\n    const canvas = canvasRef.current;\n    if (!canvas) return;\n\n    const suggestedName = `canvas-${Date.now()}.png`;\n    const filePath = await save({ defaultPath: suggestedName, filters: [{ name: 'PNG Image', extensions: ['png'] }] });\n    if (!filePath) return;\n\n    const dataUrl = canvas.toDataURL('image/png');\n    const byteString = atob(dataUrl.split(',')[1]);\n    const bytes = new Uint8Array(byteString.length);\n    for (let i = 0; i < byteString.length; i += 1) {\n      bytes[i] = byteString.charCodeAt(i);\n    }\n    await writeBinaryFile({ path: filePath, contents: bytes }, { dir: BaseDirectory.AppData });\n  };",
          "line_number": "136"
        },
        {
          "operation": "insert",
          "find_pattern": "fn main() {",
          "replace_with": "fn main() {\n    tauri::Builder::default()\n        .plugin(tauri_plugin_dialog::init())\n        .plugin(tauri_plugin_fs::init())",
          "line_number": "10"
        }
      ],
      "validation_steps": [
        "npm run type-check",
        "npm run tauri:dev",
        "manual test: draw on canvas, use Download, confirm native save dialog appears and file is created"
      ],
      "success_criteria": "Canvas export presents a native Tauri save dialog and writes the PNG to disk without relying on browser-only anchors.",
      "dependencies": ["canvas-tokenize-palette"],
      "rollback_procedure": "git checkout -- components/modules/CanvasModule.tsx src-tauri/src/main.rs"
    },
    {
      "task_id": "tasks-token-alignment",
      "description": "Swap hex colors and Tailwind stock palettes for design tokens across list metadata and badges",
      "target_files": [
        {
          "path": "components/modules/TasksModule.tsx",
          "line_range": "59-150",
          "function_name": "TasksModule"
        }
      ],
      "code_changes": [
        {
          "operation": "replace",
          "find_pattern": "{ id: 'personal', name: 'Personal Tasks', color: '#3b82f6', taskCount: 8, isVisible: true },",
          "replace_with": "{ id: 'personal', name: 'Personal Tasks', color: 'var(--primary)', taskCount: 8, isVisible: true },",
          "line_number": "60"
        },
        {
          "operation": "replace",
          "find_pattern": "const priorityColors = {\n    low: 'bg-green-100 text-green-800',\n    medium: 'bg-yellow-100 text-yellow-800',\n    high: 'bg-red-100 text-red-800'\n  };",
          "replace_with": "const priorityColors = {\n    low: 'bg-[var(--success-tint-20)] text-[var(--success)]',\n    medium: 'bg-[var(--warning-tint-20)] text-[var(--warning)]',\n    high: 'bg-[var(--error-tint-20)] text-[var(--error)]'\n  };",
          "line_number": "132"
        },
        {
          "operation": "replace",
          "find_pattern": "{ id: 'todo', title: 'To Do', color: '#6b7280' },",
          "replace_with": "{ id: 'todo', title: 'To Do', color: 'var(--border-default)' },",
          "line_number": "114"
        }
      ],
      "validation_steps": [
        "npm run type-check",
        "manual test: render board/list views and confirm colors match tokens",
        "manual test: verify dark mode token variants render correctly"
      ],
      "success_criteria": "Task lists, columns, and priority pills rely exclusively on design tokens so palettes shift automatically with theme changes.",
      "dependencies": [],
      "rollback_procedure": "git checkout -- components/modules/TasksModule.tsx"
    },
    {
      "task_id": "tasks-tri-pane-refactor",
      "description": "Refactor Tasks module into the shared TriPane layout with a persistent detail inspector, mirroring Mail's IA",
      "target_files": [
        {
          "path": "components/modules/TasksModule.tsx",
          "line_range": "180-620",
          "function_name": "TasksModule"
        }
      ],
      "code_changes": [
        {
          "operation": "insert",
          "find_pattern": "import React, { useState } from 'react';",
          "replace_with": "import React, { useState } from 'react';\nimport { TriPane, TriPaneHeader, TriPaneContent } from '../../TriPane';",
          "line_number": "1"
        },
        {
          "operation": "replace",
          "find_pattern": "return (\n    <div className=\"h-full bg-[var(--surface)] flex flex-col\">",
          "replace_with": "return (\n    <TriPane\n      leftWidth=\"18rem\"\n      rightWidth=\"24rem\"\n      left={renderListSidebar()}\n      leftHeader={renderSidebarHeader()}\n      center={renderBoardOrList()}\n      centerHeader={renderTasksHeader()}\n      right={selectedTask ? renderTaskDetails(selectedTask) : renderEmptyDetails()}\n      rightHeader={selectedTask ? renderDetailsHeader(selectedTask) : null}\n    >",
          "line_number": "200"
        },
        {
          "operation": "insert",
          "find_pattern": "const getTasksByList = (listId: string) => {",
          "replace_with": "const renderListSidebar = () => { /* existing sidebar JSX extracted */ };\n  const renderTasksHeader = () => { /* board/list toggle header */ };\n  const renderBoardOrList = () => { /* reuse existing render logic */ };\n  const renderTaskDetails = (task: Task) => { /* convert dialog content into persistent pane */ };\n  const renderEmptyDetails = () => (/* placeholder state */);\n  const getTasksByList = (listId: string) => {",
          "line_number": "144"
        },
        {
          "operation": "replace",
          "find_pattern": "{showTaskSidePanel && (",
          "replace_with": "{/* Dialog is no longer needed once right pane renders details */}\n      {false && showTaskSidePanel && (",
          "line_number": "520"
        }
      ],
      "validation_steps": [
        "npm run type-check",
        "manual test: select task, confirm details remain open in right pane while switching board/list",
        "manual test: resize window to ensure panes remain responsive"
      ],
      "success_criteria": "Tasks module adopts TriPane with persistent detail inspector, no longer relying on modal dialogs for core flows.",
      "dependencies": ["tasks-token-alignment"],
      "rollback_procedure": "git checkout -- components/modules/TasksModule.tsx"
    },
    {
      "task_id": "dashboard-persistence",
      "description": "Persist dashboard widgets/layout via Tauri filesystem APIs so edits survive app restarts like stored mail filters",
      "target_files": [
        {
          "path": "components/modules/DashboardModule.tsx",
          "line_range": "27-240",
          "function_name": "DashboardModule"
        }
      ],
      "code_changes": [
        {
          "operation": "insert",
          "find_pattern": "import { DashboardSettings } from './dashboard/DashboardSettings';",
          "replace_with": "import { DashboardSettings } from './dashboard/DashboardSettings';\nimport { appDataDir, join } from '@tauri-apps/api/path';\nimport { readTextFile, writeTextFile } from '@tauri-apps/api/fs';",
          "line_number": "26"
        },
        {
          "operation": "insert",
          "find_pattern": "export function DashboardModule() {",
          "replace_with": "export function DashboardModule() {\n  const [isBootstrapping, setIsBootstrapping] = useState(true);",
          "line_number": "29"
        },
        {
          "operation": "insert",
          "find_pattern": "const handleResetDashboard = () => {",
          "replace_with": "useEffect(() => {\n    (async () => {\n      try {\n        const dir = await appDataDir();\n        const file = await join(dir, 'dashboard-state.json');\n        const serialized = await readTextFile(file);\n        const parsed = JSON.parse(serialized);\n        setWidgets(parsed.widgets ?? defaultWidgets);\n        setLayout(parsed.layout ?? 'grid');\n      } catch (_) {\n        /* fall back to defaults */\n      } finally {\n        setIsBootstrapping(false);\n      }\n    })();\n  }, []);\n\n  useEffect(() => {\n    if (isBootstrapping) return;\n    (async () => {\n      const dir = await appDataDir();\n      const file = await join(dir, 'dashboard-state.json');\n      await writeTextFile(file, JSON.stringify({ widgets, layout }));\n    })();\n  }, [widgets, layout, isBootstrapping]);\n\n  const handleResetDashboard = () => {",
          "line_number": "63"
        }
      ],
      "validation_steps": [
        "npm run type-check",
        "npm run tauri:dev",
        "manual test: rearrange widgets, restart app, confirm layout persists"
      ],
      "success_criteria": "Dashboard widget choices persist across sessions via stored JSON in the Tauri app data directory.",
      "dependencies": [],
      "rollback_procedure": "git checkout -- components/modules/DashboardModule.tsx"
    },
    {
      "task_id": "notes-token-a11y",
      "description": "Align Notes module iconography with tokens and ensure slash menu/list panes expose proper roles",
      "target_files": [
        {
          "path": "components/modules/NotesModule.tsx",
          "line_range": "320-560",
          "function_name": "NotesModule"
        }
      ],
      "code_changes": [
        {
          "operation": "replace",
          "find_pattern": "<Star size={12} className=\"text-yellow-500 fill-current\" />",
          "replace_with": "<Star size={12} className=\"text-[var(--warning)] fill-[var(--warning)]\" aria-hidden=\"true\" />",
          "line_number": "345"
        },
        {
          "operation": "insert",
          "find_pattern": "<div className=\"flex-1 overflow-y-auto\">",
          "replace_with": "<div className=\"flex-1 overflow-y-auto\" role=\"list\" aria-label=\"Notes list\">",
          "line_number": "331"
        },
        {
          "operation": "insert",
          "find_pattern": "const filteredNotes = mockNotes.filter(note =>",
          "replace_with": "const handleSlashMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => { /* support Arrow navigation and Enter */ };",
          "line_number": "219"
        },
        {
          "operation": "replace",
          "find_pattern": "{showSlashMenu && (",
          "replace_with": "{showSlashMenu && (\n        <div role=\"menu\" onKeyDown={handleSlashMenuKeyDown} aria-label=\"Insert block menu\">",
          "line_number": "410"
        }
      ],
      "validation_steps": [
        "npm run type-check",
        "manual test: trigger slash menu, use Arrow keys/Enter to navigate options",
        "manual test: verify starred note indicator uses warning token in light/dark themes"
      ],
      "success_criteria": "Notes list and slash menu expose ARIA roles and design tokens, with keyboard navigation operating end-to-end.",
      "dependencies": [],
      "rollback_procedure": "git checkout -- components/modules/NotesModule.tsx"
    }
  ],
  "execution_order": [
    "tasks-token-alignment",
    "tasks-tri-pane-refactor",
    "chat-a11y-roving-focus",
    "calendar-event-modal",
    "calendar-grid-a11y",
    "canvas-tokenize-palette",
    "canvas-color-picker",
    "canvas-tauri-export",
    "dashboard-persistence",
    "notes-token-a11y"
  ],
  "critical_warnings": [
    "Tauri plugin additions in canvas-tauri-export require enabling matching plugins in tauri.conf.json if not already present; missing setup will cause runtime errors.",
    "tasks-tri-pane-refactor touches large JSX blocks—merge conflicts likely if other branches modify TasksModule simultaneously.",
    "dashboard-persistence assumes write access to appDataDir; sandboxed environments must grant filesystem permission before deployment."
  ]
}
```
