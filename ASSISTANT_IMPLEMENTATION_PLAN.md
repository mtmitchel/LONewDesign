# Multi-Provider AI Assistant Implementation Plan

## Overview

Implement a multi-provider AI assistant that supports natural language intent classification, writing tools, and selection-aware features. Users can configure which LLM provider (OpenAI, Anthropic, Mistral, etc.) powers the assistant through Settings.

## Research Findings

### Key Architectural Patterns
- **Factory Pattern**: Use `createLLMProvider(config)` to instantiate provider-specific implementations
- **Provider Abstraction**: Define `LLMProvider` interface that all providers implement
- **Plugin Architecture**: Each feature (intent classification, writing tools) is a self-contained tool
- **AsyncGenerator**: Support streaming responses for real-time feedback
- **Strong TypeScript Types**: Use Zod schemas for runtime validation

### Best Practices (from Perplexity & Exa research)
1. Keep provider implementations loosely coupled - don't leak provider-specific details
2. Centralize prompt templates per provider/tool
3. Inject React UI state (selection, context) explicitly into prompts
4. Use React Context or Zustand for conversation/configuration state
5. Treat tool results and LLM responses uniformly in state

## Architecture Layers

### Layer 1: Provider Abstraction
- **Interface**: `LLMProvider` with methods: `classifyIntent()`, `runTool()`, `streamText()`
- **Factory**: `createLLMProvider(config)` returns appropriate provider instance
- **Implementations**: `MistralProvider`, `OpenAIProvider`, `AnthropicProvider`

### Layer 2: Tool Registry
- **Interface**: `AssistantTool` with schema and execute function
- **Tools**: 
  - Intent Classifier (task/note/event detection)
  - Writing Tools (tone changes, summarize, translate, etc.)
  - Ask AI (fallback for unmatched intents)

### Layer 3: Assistant Service
- **Orchestrates**: Provider selection, tool execution, streaming responses
- **Handles**: Selection context injection, conversation history, error handling
- **Returns**: `AsyncGenerator` for streaming updates

### Layer 4: React Integration
- **Hook**: `useAssistant()` exposes `classify`, `runTool`, `askAI`
- **Context**: `AssistantContext` holds provider config and conversation state
- **UI**: Enhanced `AssistantCaptureDialog` with writing tools grid and results pane

### Layer 5: Settings Integration
- **New Setting**: "Assistant Provider" dropdown
- **Storage**: Uses existing `providerSettings` store
- **Fallback**: First configured provider if none selected

## Implementation Phases

### Phase 1 (MVP) - Intent Classification ✓ THIS PHASE
Focus: Provider abstraction + basic intent classification

**Deliverables**:
- Provider interface and factory pattern
- Mistral provider implementation (reuse existing API)
- Intent classification for task/note/event creation
- Settings UI for assistant provider selection
- Integration into existing assistant dialog

**Outcome**: Users can choose provider in Settings, assistant classifies natural language input and routes to correct creation flow

### Phase 2 - Writing Tools
Focus: Selection-based transforms

**Deliverables**:
- Selection detection in dialog
- Writing tools grid UI (10 tools)
- Results pane with Replace/Insert/Copy actions
- Tools: Professional/Friendly tone, Concise, Expand, Proofread, Summarize, Translate, Explain, List, Extract

**Outcome**: Users select text, press Cmd/Ctrl+K, see tools grid, run transforms, get results with action buttons

### Phase 3 - Advanced Features
Focus: Polish and additional providers

**Deliverables**:
- Ask AI fallback for unmatched intents
- OpenAI and Anthropic provider implementations
- Confidence gating (<0.6 shows disambiguation)
- Advanced date parsing with chrono/luxon
- Tool execution history and undo

## Executable Tasks (Phase 1 MVP)

```json
{
  "executable_tasks": [
    {
      "task_id": "task-1-types",
      "description": "Create provider abstraction types and Zod schemas for intent classification",
      "target_files": [
        {
          "path": "components/assistant/services/types.ts",
          "line_range": "new file",
          "function_name": "N/A - type definitions"
        }
      ],
      "code_changes": [
        {
          "operation": "create",
          "content": "TypeScript interfaces: LLMProvider, ProviderConfig, Intent, IntentType; Zod schemas: TaskIntentSchema, NoteIntentSchema, EventIntentSchema"
        }
      ],
      "validation_steps": [
        "npm run type-check",
        "verify exports are accessible from other files"
      ],
      "success_criteria": "TypeScript compiles with no errors, Zod schemas validate sample intent objects",
      "dependencies": [],
      "rollback_procedure": "rm components/assistant/services/types.ts"
    },
    {
      "task_id": "task-2-mistral-provider",
      "description": "Implement Mistral provider with intent classification method",
      "target_files": [
        {
          "path": "components/assistant/services/mistralProvider.ts",
          "line_range": "new file",
          "function_name": "classifyIntent"
        }
      ],
      "code_changes": [
        {
          "operation": "create",
          "content": "MistralProvider class implementing LLMProvider interface; classifyIntent() calls Tauri backend with classification prompt; parses JSON response; validates with Zod"
        }
      ],
      "validation_steps": [
        "npm run type-check",
        "verify Tauri invoke signature matches backend command"
      ],
      "success_criteria": "Provider instantiates correctly, classifyIntent returns Promise<Intent>, handles errors gracefully",
      "dependencies": ["task-1-types", "task-3-tauri-command"],
      "rollback_procedure": "rm components/assistant/services/mistralProvider.ts"
    },
    {
      "task_id": "task-3-tauri-command",
      "description": "Add non-streaming Mistral completion Tauri command for intent classification",
      "target_files": [
        {
          "path": "src-tauri/src/main.rs",
          "line_range": "after mistral_chat_stream function",
          "function_name": "mistral_complete"
        }
      ],
      "code_changes": [
        {
          "operation": "insert",
          "find_pattern": "Register new command in .invoke_handler() alongside existing mistral commands",
          "replace_with": "New async function mistral_complete with parameters: apiKey, baseUrl, model, messages (Vec<ChatMessage>); returns Result<String, String>; calls Mistral API /chat/completions without streaming"
        }
      ],
      "validation_steps": [
        "cd src-tauri && cargo check",
        "cargo clippy -- -D warnings",
        "verify command registered in invoke_handler"
      ],
      "success_criteria": "Rust compiles successfully, command accepts correct parameters, returns complete JSON response from Mistral API",
      "dependencies": [],
      "rollback_procedure": "git checkout src-tauri/src/main.rs"
    },
    {
      "task_id": "task-4-provider-settings",
      "description": "Add assistantProvider field to providerSettings store with persistence",
      "target_files": [
        {
          "path": "components/modules/settings/state/providerSettings.ts",
          "line_range": "ProviderSettingsState interface (~line 20)",
          "function_name": "setAssistantProvider"
        }
      ],
      "code_changes": [
        {
          "operation": "insert",
          "find_pattern": "export interface ProviderSettingsState {",
          "replace_with": "Add field: assistantProvider: ProviderId | null; (stores which provider powers assistant)"
        },
        {
          "operation": "insert",
          "find_pattern": "resetProvider: (id: ProviderId) => void;",
          "replace_with": "Add action: setAssistantProvider: (id: ProviderId | null) => void;"
        },
        {
          "operation": "insert",
          "find_pattern": "Implementation section of store",
          "replace_with": "Implement setAssistantProvider with set((state) => ({ assistantProvider: id }))"
        }
      ],
      "validation_steps": [
        "npm run type-check",
        "manual test: call setAssistantProvider, reload page, verify value persists"
      ],
      "success_criteria": "Store compiles, assistantProvider persists to localStorage, can be read/written",
      "dependencies": ["task-1-types"],
      "rollback_procedure": "git checkout components/modules/settings/state/providerSettings.ts"
    },
    {
      "task_id": "task-5-settings-ui",
      "description": "Add Assistant Provider dropdown to Settings Providers UI",
      "target_files": [
        {
          "path": "components/modules/settings/_parts/SettingsProviders.tsx",
          "line_range": "before provider cards section (~line 100)",
          "function_name": "SettingsProviders component"
        }
      ],
      "code_changes": [
        {
          "operation": "insert",
          "find_pattern": "return ( <div className=\"space-y-[var(--space-6)]\">",
          "replace_with": "Add new section: <div>Assistant Provider</div> with <Select> dropdown; options = configured providers with valid API keys; value from useProviderSettings().assistantProvider; onChange calls setAssistantProvider"
        }
      ],
      "validation_steps": [
        "npm run type-check",
        "manual test: open Settings > Providers, see Assistant Provider dropdown",
        "manual test: select provider, verify selection saves and persists"
      ],
      "success_criteria": "Dropdown renders above provider list, shows only configured providers, selection saves to store",
      "dependencies": ["task-4-provider-settings"],
      "rollback_procedure": "git checkout components/modules/settings/_parts/SettingsProviders.tsx"
    },
    {
      "task_id": "task-6-integrate-classification",
      "description": "Integrate intent classification into QuickAssistantProvider submit flow",
      "target_files": [
        {
          "path": "components/assistant/QuickAssistantProvider.tsx",
          "line_range": "handleSubmit function in AssistantCaptureDialog (~line 300)",
          "function_name": "handleSubmit callback"
        }
      ],
      "code_changes": [
        {
          "operation": "replace",
          "find_pattern": "const parsed = parseCommand(payload.text);",
          "replace_with": "If text starts with '/', use parseCommand; else call mistralProvider.classifyIntent(text); based on intent.type, route to setTaskState/setNoteState/setEventState with extracted data"
        },
        {
          "operation": "insert",
          "find_pattern": "Top of file imports",
          "replace_with": "Import: MistralProvider, useProviderSettings"
        },
        {
          "operation": "insert",
          "find_pattern": "Component body",
          "replace_with": "Add loading state for classification; check if assistantProvider configured, show error if not"
        }
      ],
      "validation_steps": [
        "npm run type-check",
        "manual test: 'Buy milk tomorrow' → task modal opens with title pre-filled",
        "manual test: 'Meeting notes' → note modal opens",
        "manual test: 'Dentist Tuesday 2pm' → event modal opens",
        "manual test: '/task Buy milk' → slash command still works",
        "manual test: no provider configured → shows helpful error"
      ],
      "success_criteria": "Natural language input classifies correctly and opens appropriate modal; slash commands unchanged; errors handled gracefully",
      "dependencies": ["task-2-mistral-provider", "task-4-provider-settings"],
      "rollback_procedure": "git checkout components/assistant/QuickAssistantProvider.tsx"
    }
  ],
  "execution_order": [
    "task-1-types",
    "task-3-tauri-command",
    "task-4-provider-settings",
    "task-5-settings-ui",
    "task-2-mistral-provider",
    "task-6-integrate-classification"
  ],
  "critical_warnings": [
    "Intent classification requires API calls - will fail if no provider configured or API key invalid",
    "Natural language date parsing is basic - complex dates may not extract correctly in MVP",
    "Only Mistral provider implemented in Phase 1 - OpenAI/Anthropic need separate Tauri commands",
    "Existing slash commands must continue to work - regression test thoroughly",
    "User must configure at least one provider with valid API key before assistant works"
  ]
}
```

## Intent Classification Design

### Prompt Strategy

**System Prompt**:
```
You are an intent classifier. Analyze user input and classify it into one of: task, note, event, or unknown. Return ONLY valid JSON, no additional text.
```

**User Prompt Template**:
```
Classify this input: "{userInput}"

Return JSON with this exact structure:
{
  "intent": "task" | "note" | "event" | "unknown",
  "confidence": 0.0-1.0,
  "extracted": {
    // For task: { "title": string, "dueDate"?: string, "priority"?: "low"|"medium"|"high" }
    // For note: { "title"?: string, "body": string }
    // For event: { "title": string, "date": string, "startTime"?: string, "endTime"?: string, "location"?: string }
    // For unknown: {}
  }
}

Examples:
- "Buy milk tomorrow" → {"intent":"task","confidence":0.9,"extracted":{"title":"Buy milk","dueDate":"tomorrow"}}
- "Meeting notes from standup" → {"intent":"note","confidence":0.85,"extracted":{"title":"Meeting notes from standup","body":""}}
- "Dentist appointment next Tuesday 2pm" → {"intent":"event","confidence":0.95,"extracted":{"title":"Dentist appointment","date":"next Tuesday","startTime":"2pm"}}
```

### Response Handling
1. Parse JSON from LLM response
2. Validate with Zod schema
3. If confidence < 0.6, return "unknown" intent
4. Return validated `Intent` object
5. Fallback to regex extraction if JSON parse fails

### Provider-Specific Notes
- **Mistral**: Parse from completion text, support JSON mode if available
- **OpenAI**: Use `response_format: { type: "json_object" }`
- **Anthropic**: Similar JSON mode support via system prompt
- **All**: Graceful fallback if JSON malformed

## File Structure

```
components/assistant/
├── services/
│   ├── types.ts                    # Core interfaces and Zod schemas
│   ├── mistralProvider.ts          # Mistral implementation
│   ├── openaiProvider.ts           # OpenAI (Phase 2)
│   ├── anthropicProvider.ts        # Anthropic (Phase 2)
│   └── assistantService.ts         # Orchestrator (Phase 2)
├── hooks/
│   └── useAssistant.ts             # React hook (Phase 2)
├── WritingToolsGrid.tsx            # Writing tools UI (Phase 2)
├── ResultsPane.tsx                 # AI results UI (Phase 2)
├── AssistantCaptureDialog.tsx      # Enhanced with tools (modify)
└── QuickAssistantProvider.tsx      # Integration point (modify)

components/modules/settings/
├── state/
│   └── providerSettings.ts         # Add assistantProvider (modify)
└── _parts/
    └── SettingsProviders.tsx       # Add dropdown (modify)

src-tauri/src/
└── main.rs                         # Add mistral_complete command (modify)
```

## Testing Strategy

### Type Checking
```bash
npm run type-check  # Must pass after each TypeScript change
```

### Rust Compilation
```bash
cd src-tauri
cargo check         # Must compile after Rust changes
cargo clippy -- -D warnings
```

### Manual Testing Flow
1. **Setup**: Configure Mistral API key in Settings
2. **Select Provider**: Choose Mistral as Assistant Provider
3. **Test Inputs**:
   - "Buy milk tomorrow" → Task modal with pre-filled title and due date
   - "Meeting notes from standup" → Note modal with title
   - "Dentist appointment next Tuesday at 2pm" → Event modal with details
   - "Random gibberish xyz123" → Graceful fallback
4. **Slash Commands**: Verify `/task`, `/note`, `/event` still work
5. **Error Cases**: No provider configured, invalid API key, network failure

### Success Criteria
- ✅ No TypeScript compilation errors
- ✅ Rust compiles successfully
- ✅ Assistant opens and accepts input
- ✅ Intent classification returns valid JSON
- ✅ Correct modals open with pre-filled data
- ✅ Existing slash commands unchanged
- ✅ Error handling shows friendly messages
- ✅ Provider selection persists across reloads

## Technical Challenges & Solutions

### Challenge 1: Streaming vs Non-Streaming
- **Problem**: Existing Mistral API uses streaming, but intent classification should be non-streaming
- **Solution**: Add separate `mistral_complete` Tauri command for non-streaming requests

### Challenge 2: Multiple Provider Support
- **Problem**: Only Mistral implemented in Rust backend
- **Solution**: Phase 1 = Mistral only; Phase 2 = add OpenAI/Anthropic Tauri commands; factory pattern makes extension easy

### Challenge 3: Date Parsing
- **Problem**: Natural language dates ("tomorrow", "next Tuesday") need enrichment
- **Solution**: MVP passes raw text to modal, user refines; Phase 3 adds chrono/luxon enrichment

### Challenge 4: Classification Failures
- **Problem**: API call may fail or return low confidence
- **Solution**: Fallback to "unknown" intent, show original input in dialog, user can manually add slash command

### Challenge 5: No Provider Configured
- **Problem**: User hasn't configured any provider
- **Solution**: Show empty state in dropdown, helpful error when opening assistant, guide to Settings

## Future Enhancements (Post-MVP)

### Phase 2 Additions
- Writing tools grid (10 tools)
- Selection-aware features
- Results pane with actions
- OpenAI provider
- Anthropic provider

### Phase 3 Additions
- Ask AI fallback
- Confidence gating UI
- Advanced date parsing
- Tool execution history
- Conversation memory
- RAG integration for context-aware responses

## References

### Research Sources
- [Architecting AI Agents with TypeScript](https://apeatling.com/articles/architecting-ai-agents-with-typescript/)
- [VoltAgent TypeScript AI Framework](https://voltagent.dev/blog/typescript-ai-agent-framework/)
- [Multi-LLM TypeScript Library](https://github.com/nbonamy/multi-llm-ts)
- [Unified LLM Interface](https://github.com/rhyizm/unified-llm)

### Key Patterns Used
- Factory Pattern for provider instantiation
- Strategy Pattern for tool execution
- Observer Pattern for streaming updates
- Repository Pattern for settings persistence

---

**Last Updated**: 2025-01-XX
**Status**: Ready for implementation
**Next Step**: Begin task-1-types (create types.ts)
