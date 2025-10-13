# Settings modularization plan

## Current layout
- Shell entry: `components/modules/settings/SettingsPage.tsx` orchestrates section search, nav, scroll spy.
- Provider hub: `components/modules/settings/_parts/SettingsProviders.tsx` (≈665 lines) handles summary cards, sheet editing, connection tests, local runtime hooks, model toggles, and assistant defaults.
- Shared provider UI extracted under `components/features/settings/providers/components/` but business logic still bundled inside `SettingsProviders.tsx`.
- Provider state comes from `components/modules/settings/state/providerSettings.ts` (Zustand store); connection helpers live in `components/features/settings/providers/logic.ts`.
- Archived legacy implementations remain under `archive/settings/*.legacy.tsx`; no active imports point to them.

## Pain points
- Single file (`SettingsProviders.tsx`) mixes state derivation, sheet navigation, connection testing, model management, and assistant defaults.
- Cloud providers and local models share one summary card with a generic “Add provider” CTA, causing unclear flows.
- Side panel copy is verbose, repeats status in multiple places, and uses uppercase headings.
- Local Ollama “Configure” sheet renders blank because no panel is wired for it.
- Assistant defaults card appears before model sources, confusing hierarchy.
- Provider metadata/hints assume old microcopy and expose developer-centric text.

## Target structure
- **Sections**
  - `Model sources`
    - `Cloud providers` card
    - `Local models` card
  - `Assistant defaults` card (follows Model sources)
  - Other cards (Accounts, Advanced) unchanged.
- **Cloud side panel**
  1. Connection (status pill + verify button, inline error/meta)
  2. API key (with show/hide/paste/copy, helper text)
  3. Advanced (collapsed accordion) → Base URL
  4. Footer: Clear · Cancel · Done
- **Local side panel**
  - Surface endpoint config, available models, fetch/pull/delete actions, verification status.
- **Shared utilities**
  - Provider registry with canonical labels + copy (sentence case).
  - Connection state machine + presenter shared between header chip and panels.
  - Model metadata resolver keyed by provider.

## Migration strategy
1. **Audit & scaffolding (current step)**
   - Catalogue settings files and ensure legacy code stays archived.
   - Introduce plan (this doc) and note copy guidelines in `docs/guidelines/Guidelines.md`.
2. **Refactor summaries**
   - Extract `CloudProvidersCard` and `LocalModelsCard` from `ProvidersSummaryPanel`.
   - Replace generic “Add provider” button with per-context CTAs.
   - Ensure state wiring remains unchanged during extraction.
3. **Side panel reflow**
   - Refactor sheet layout into modular subcomponents (`ConnectionSection`, `ApiKeySection`, `AdvancedSection`).
   - Remove duplicate status surfaces; header pill mirrors `Connection` state.
   - Update copy to sentence case, adopt simplified helper text.
4. **Local models experience**
   - Add local side panel content (endpoint form, model list, pull/delete actions).
   - Hook into provider store for Ollama operations; guard non-Tauri contexts gracefully.
   - Use the shared alert dialog pattern for destructive actions (e.g., delete model) so confirmations match the design system.
5. **Assistant defaults placement**
   - Reorder cards so `Model sources` renders before `Assistant defaults`.
   - Populate model dropdowns using provider-specific metadata; add fallback support.
6. **State fixes**
   - Ensure provider IDs map correctly (fix Mistral being saved as OpenAI).
   - Centralize model metadata by provider; clean OpenRouter toggle-all behavior.
   - Reset connection state to `Not verified` when API key/Base URL changes.
7. **Copy + styling sweep**
   - Enforce sentence case headings, terse helper copy, and consistent button labels (`Verify`, `Testing…`, `Verify again`).
   - Update toasts and badges to match the state table.
8. **Validation**
   - Add unit tests for new helpers/state machine.
   - Add component tests or stories for new cards and panels.
  - Run `npm run type-check` and smoke test provider/local flows.

## UX and copy adjustments
- Switch all section headers, card titles, and chip labels to sentence case (`Cloud providers`, `Local models`, `Assistant defaults`).
- Replace verbose helper text with concise language pulled from the feedback (e.g., `Stored on this device.` for API key helper, remove marketing copy).
- Update `components/features/settings/providers/config.ts` to hold simplified hints or, if hints move to UI, remove duplicates entirely.
- Ensure the connection status pill uses the shared label table (`Not set`, `Not verified`, `Testing…`, `Connected`, `Failed`, `Offline`).
- Rename actions: `Run test` → `Verify`, `Clear` stays, `Done` remains primary; success toast becomes `Connection verified`.
- Separate CTAs for adding providers: `Add cloud provider` and `Add local model` (or `Pull model`), depending on context.
- Provide inline error `Couldn’t connect (401). Details` and meta `Last checked 2m ago` once verification runs.
- Reorder cards so the narrative flows `Model sources` → `Assistant defaults`, reflecting dependency.

## Open questions / follow-ups
- Do we need storybook coverage for the new cards, or are Vitest + Playwright sufficient?
- Which backend endpoints handle Ollama model pulls/deletes—local command or HTTP? Verify before wiring UI.
