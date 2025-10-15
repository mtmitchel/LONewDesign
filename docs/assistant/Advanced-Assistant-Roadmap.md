# Advanced assistant roadmap

> Last updated: 2025-10-10 (heading capitalization standardized 2025-10-15) — aligns with unified roadmap section **"Global quick assistant"** in `docs/roadmap/Unified-Workspace-Roadmap.md`.

## Current scope
- Single entry point for capture, writing transforms, and free-form AI requests.
- Natural-language routing that prefers deterministic tools but falls back to Ask AI.
- End-to-end selection-aware flow: highlight → `⌘/Ctrl+K` → pick a tool or submit the routed action.
- Provider-agnostic orchestration so we can swap or mix local Ollama and cloud models.

## Architecture Layers
| Layer | Responsibility | Status |
| --- | --- | --- |
| Provider abstraction (`LLMProvider`, factory) | Encapsulates provider-specific calls, exposes `classifyIntent`, `runTool`, `streamText`. | ✅ Mistral + OpenAI-compatible + Ollama providers live; fallback wiring still TODO. |
| Tool registry (`AssistantTool`) | Deterministic prompt builders + Zod validation per tool/command. | 🔄 Slash commands mapped; deterministic prompts live for writing tools and NL routing, Ask AI backlog. |
| Assistant service | Coordinates provider selection, handles streaming, telemetry, error pathways. | 🔄 Confidence gating + low-confidence UX shipped; Ask AI fallback / history still open. |
| React integration (`QuickAssistantProvider`, dialog) | Launcher, hotkeys, scoped context, UI shell. | ✅ Launcher, selection capture, Replace/Insert actions, telemetry hooks all wired. |
| Settings integration | Provider selection/testing, key management. | ✅ Reorganized into Cloud/Local/Assistant/Accounts sections with provider store, Tauri-driven Ollama discovery, and inline test/save feedback. |

## Phase progress
1. **Phase 1 &mdash; Intent Classification** ✔️\
   Active in production quick-capture. Provider abstraction, Mistral backend command, and scoped routing to tasks/notes/events are live.
2. **Phase 2 &mdash; Writing Tools** 🔄\
   Execution now flows through provider-backed prompts (Mistral, OpenAI-compatible, Ollama) with Replace/Insert wired into live selections. Remaining work: streaming UX + auto-replace heuristics.
3. **Phase 3 &mdash; Advanced Features** 🛠️\
   Backlog items: Ask AI fallback, additional providers, confidence gating, tool history/undo, richer chrono parsing.

## Outstanding work (2025-10-10)
- Add Ask AI fallback + streaming responses (shared across cloud/local providers).
- Persist assistant execution history + undo stack for transforms.
- Backfill assistant instrumentation for insights hand-off (`assistant.from_insights`) and granular usage metrics.
- Expose provider fallback chaining (primary → secondary) and confidence surfacing in the dialog UI.
- Evaluate auto-replace heuristics for quick grammar fixes (respect Settings toggle).

## Manual testing playbooks

### Quick intent routing smoke
1. Open devtools console.
2. Trigger assistant with `⌘/Ctrl+K`.
3. Submit `"dentist appointment on saturday at 10am"`.
- Expect console logs prefixed with `[QuickAssistant] ...` showing classification → parsed date → event payload.\
5. Verify the detail stored in `localStorage.getItem('calendar-events')`.

### Writing tools regression
- Highlight text in any editor, open assistant, confirm tools grid surfaces the ten transforms.
- Run a tool (e.g., Proofread) and verify result appears; use Replace to overwrite the original selection and Insert to append after the selection.
- Copy button still provides visual feedback (toast + `Copied!`).
- Confirm low-confidence toast appears if the NL router is uncertain (<60%).

### Provider settings and Mistral
- Follow `docs/testing/Mistral.md` (combined guide + summary) to validate API key testing, model fetch, and streaming chat.
- After enabling models, ensure only checked models appear in chat module dropdowns.
- For local workflows, see `docs/testing/Ollama.md` to validate endpoint detection, model discovery, assistant routing, and chat streaming.

## References and archive
- Legacy capture prototype docs now live under `docs/archive/assistant-prototype/`.
- Previous assistant planning artifacts (`ASSISTANT_IMPLEMENTATION_PLAN.md`, `WRITING_TOOLS_STATUS.md`, `TEST_ASSISTANT_EVENT.md`) are archived in `docs/archive/assistant/` after this consolidation.
- UI wiring and advanced UI goals continue to live in `docs/roadmap/Unified-Workspace-Roadmap.md` — keep statuses in sync when progress changes.
