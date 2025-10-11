# Mistral Integration Test Playbook

> Consolidated guide + summary &mdash; updated 2025-10-10.

## Overview
The Mistral integration now ships with 46 automated Vitest cases plus manual flows that exercise settings, model selection, and chat streaming. Use this playbook when validating API upgrades or refactors.

## Automated Test Suite
- Framework: Vitest 3.2.4 with jsdom environment.
- Location: run via `npm run test:run -- tests/mistral-backend.test.ts components/modules/chat/mistral-integration.test.ts components/modules/settings/state/providerSettings.test.ts`.
- Coverage highlights:
  - Provider settings store CRUD, model lists, reset helpers.
  - Chat integration utilities (model detection, message serialization, stream event handling).
  - Backend type validation for invoke commands and event payloads.
- Current results: **46 passing tests** across 3 files (≈0.8s total).

## Manual Validation Checklist

### 1. Provider Setup
1. Launch desktop app (`npm run tauri:dev`).
2. Settings → Providers → **Mistral AI**.
3. Enter API key, click **Test**.
   - Expect toast `"Connection successful"` and `"Found X Mistral models"`.
   - Console log: `Fetched Mistral models: [...]`.

### 2. Model Management
- After a successful test, verify the **Available Models** list renders checkboxes.
- Toggle enabled models; confirm state persists via `localStorage.getItem('provider-settings-v1')`.
- Re-open chat and ensure the dropdown only lists checked models.

### 3. Streaming Chat
1. Choose a Mistral model in chat header.
2. Send a prompt and observe token streaming.
3. Console should stay clean; assistant message fills incrementally.

### 4. Quick Assistant Intent
- Follow the "Quick Intent Routing Smoke" steps in `docs/assistant/Advanced-Assistant-Roadmap.md` to confirm event creation payloads remain compatible with the Mistral-backed classifier.

## Troubleshooting
- **Models missing** – check console for empty array log; API key may lack permissions or request timed out. Re-run the test action.
- **Models not appearing in chat** – confirm `enabledModels` array in localStorage contains expected IDs, then refresh the app.
- **Streaming stalls** – inspect console for `mistral_chat_stream` errors (both web and Rust). Validate API key and model ID.
- **Reset store** – run `localStorage.removeItem('provider-settings-v1'); location.reload();`.

## Known Limitations
- Models require a fresh fetch per session; no cached metadata or refresh button yet.
- Writing tools still call placeholder execution; integration with `mistral_tool_execute` remains on the roadmap.
- Model descriptions/capabilities are not surfaced in the UI.

## Historical Notes
- Legacy standalone documents (`MISTRAL_TESTING_GUIDE.md`, `MISTRAL_TESTING_SUMMARY.md`) now live in `docs/archive/testing/` for reference only.
