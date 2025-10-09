# Quick Assistant Capture Redesign

## Overview
The current Quick Assistant modal successfully ingests highlighted content and routes it into quick tasks, notes, or events, but the UI relies on a basic modal with minimal hierarchy. To better support rapid capture, context awareness, and post-capture editing, we propose a progressive-disclosure redesign that:

- Reduces friction for the fastest flows (grab text → capture → done).
- Surfaces richer actions only when the user signals intent.
- Communicates clearly what was captured, what was changed, and what will be created.
- Scales gracefully from a single snippet to multiple captures and follow-on commands.

## Primary User Goals
1. **Snap capture**: Verify that the correct text was captured and stash it immediately.
2. **Light polish**: Fix typos, trim content, or add lightweight metadata without losing flow.
3. **Action routing**: Choose the right destination (`/task`, `/note`, `/event`, `/summarize`, future commands) with copy that clarifies downstream impact.
4. **Contextual awareness**: Preserve original text while showing the edited version so the user can compare or revert if needed.

## Key Scenarios & Edge Cases
- **No text selected**: Provide a friendly empty state with suggestions ("Type or paste anything"), still allow direct command entry.
- **Large selection (>500 words)**: Collapse the preview with a "Show full snippet" control, warn about truncation limits, and keep capture performant.
- **Formatted content**: Maintain lightweight rich text (bold, italics, bullets) in preview cards; strip unsupported HTML safely and note what changed.
- **Code snippets**: Detect monospaced blocks and offer a "Copy as code" toggle to prevent smart quotes.
- **Multiple captures in one session**: Stack captured items as individual cards inside the modal with the newest pinned to the top.
- **Changed-after-capture**: Track the original snippet and surface a diff badge when the user edits the text before submission.
- **Command-only capture**: If the user types `/summarize` or `/task` before entering text, show a command confirmation state that waits for input.
- **Network/offline errors**: Gracefully degrade with toasts and persistent retry controls.

## Proposed Interaction Model

### 1. Launcher States
- **Idle Floating Button**: Rounded pill with "+ Capture" label and subtle glow when there is selected text. Hover shows tooltip "Press Ctrl+K".
- **Captured Selection Toast (Optional)**: On hotkey press with text selected, show a micro-toast near the selection confirming capture and opening the assistant (acts as spatial anchor).

### 2. Modal Structure (Progressive Disclosure)
1. **Hero Strip (Always visible)**
   - Left: Icon + label "Quick assistant".
   - Center: Context chip indicating source (e.g., `Notes · Quick Ideas`).
   - Right: Close button + shortcut hint (⌘/Ctrl + K).
2. **Captured Snippet Card (Collapsed by default)**
   - Shows first 2 lines of captured text.
   - Actions: `Expand`, `Copy original`, diff pill (only if edits were made).
   - Metadata row with timestamp and word count.
3. **Primary Command Input**
   - Inline command suggestions (e.g., `/task`, `/note`, `/event`, `/summarize`).
   - Chips auto-populate based on heuristics (dates detected → highlight `/event`).
4. **Advanced Panel (Hidden until invoked)**
   - Toggle labeled "Add details" reveals secondary form fields depending on command:
     - `/task`: assignee, due date, priority.
     - `/note`: notebook, tags.
     - `/event`: start/end, location.
   - Panel remembers last used state per command.
5. **Output Preview (Conditional)**
   - Appears once AI or formatting transforms are applied (e.g., `/summarize`).
   - Tabs: `Result`, `Original`, `Diff`.
   - Diff view highlights additions in green, deletions in red using side-by-side layout (desktop) or stacked (mobile/compact).
6. **Footer**
   - Primary button text adapts: "Capture to Notes", "Create task", etc.
   - Secondary buttons: `Save & stay` (keep modal open for next capture) and `Discard`.

### Progressive Disclosure Mechanics
- Keep the modal compact (approx. 400px width) until the user expands the snippet or opens the advanced panel.
- Animate transitions to preserve spatial memory.
- Auto-focus the command input after every capture so the user can just type `/task Enter`.

## Displaying Original vs Edited Text

- Store both `originalSnippet` and `workingCopy` in state.
- The snippet card shows the working copy with diff badge when `workingCopy !== originalSnippet`.
- Diff badge opens a mini-diff popover with inline additions/deletions.
- Allow reverting to original with a single click.
- When sending to destination modules, include both versions in the payload for audit/history (notes can keep original as comment, tasks can add it to description history).

## Visual System Guidelines
- Use the `card` and `surface-elevated` tokens from `globals.css` for the modal shell.
- Captured snippet card uses a lightly tinted background (`bg-surface-subtle`) with a border to differentiate from input.
- Primary button leverages existing `assistant` variant but with contextual labels.
- Glyphs: Use existing icon set (e.g., `lucide-clipboard`, `lucide-diff`, `lucide-sparkles`).
- Apply 12px corner radius, 24px outer shadow for depth, and 16px padding rhythm.

## Content Strategy & Microcopy
- Hero line: "Capture anything or start with a command."
- Empty state CTA: "Paste content or try `/summarize latest meeting`."
- Diff badge text: "Edited since capture".
- Large snippet warning: "Showing first 500 words. Expand to review full selection."
- Error toast: "We couldn't save that yet. Keep editing or try again."

## Accessibility & Keyboard Support
- Ensure all controls reachable via Tab order; use `Esc` to close.
- Offer `Ctrl+Enter` as submit, `Shift+Enter` for newline.
- Provide ARIA live region updates for capture confirmations.
- High-contrast theme inherits Tailwind color tokens for dark mode.

## Data & Technical Notes
- Capture context metadata (source module, document ID, selection offsets) to enable "jump back to source" links.
- For diffing, reuse a lightweight library (`fast-diff`) and render results via Prism for syntax highlighting when code blocks detected.
- Persist last command locally so repeated captures default to the same destination until changed.
- Respect clipboard privacy: only store captured text locally unless user submits.

## Implementation Milestones
1. **State Model Refactor**: Introduce `useCaptureSession` hook managing original/edited content, command, metadata, diff state.
2. **UI Shell Update**: Replace current modal layout with hero strip + snippet card + command input.
3. **Progressive Disclosure Panels**: Build `ExpandableCard` and `AdvancedPanel` components.
4. **Diff Preview**: Integrate diff library and conditionally render the tab set.
5. **Metadata Routing**: Pass context to Notes, Tasks, and Calendar modules with original text preserved.
6. **QA & Validation**: Keyboard-only walkthrough, large snippet stress test, offline submission, smoke tests for each command.

## Validation Checklist
- ✅ Hotkey capture shows correct snippet in collapsed card.
- ✅ Expanding snippet preserves formatting and allows edits.
- ✅ Diff badge appears only when text changes.
- ✅ Advanced panel remembers fields per command.
- ✅ Output preview tab appears after transformations.
- ✅ All CTAs and copy localized and accessible.
- ✅ Submissions reach destination modules with both original and edited text metadata.

## Future Enhancements
- Allow stacking multiple captures and batching into a summary.
- Introduce AI-assisted rewriting suggestions within the diff tab.
- Surface recently used tags or projects inside the advanced panel via quick chips.
