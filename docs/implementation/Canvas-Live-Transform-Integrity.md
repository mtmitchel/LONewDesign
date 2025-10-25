# Canvas Live Transform Integrity

**Status:** 🔄 Active — last updated 2025-10-25  
**Owner:** Canvas Platform Pod (GitHub Copilot support)  
**Linked initiatives:** [Canvas Refactor Plan](../guidelines/CanvasRefactorPlan.md) → Track 3 (Selection Stack Modularisation)

## Purpose
Stabilise live transforms on the unified canvas so transformer geometry, drawings, connectors, and mindmap branches stay aligned throughout marquee and drag workflows.

## Objectives
- Mirror Konva transformer bounds back into the unified canvas store during drag/resize so geometry stays authoritative mid-interaction.
- Keep drawing strokes, connectors, and mindmap descendants visually and logically inside the transformer until interaction completes.
- Publish the initiative in roadmap/changelog artifacts and capture lessons in the memory graph once shipped.

## Work Breakdown

| Task ID | Outcome | Primary files / systems | Status | Dependencies |
|---------|---------|-------------------------|--------|--------------|
| CLTI-001 | Translate live transform deltas into ElementSynchronizer updates for drawings | `components/modules/Canvas/runtime/features/renderer/modules/SelectionModule.ts`, `components/modules/Canvas/runtime/features/renderer/modules/selection/managers/ElementSynchronizer.ts` | Planned | — |
| CLTI-002 | Keep mindmap descendants in sync with selection bounds while dragging | `components/modules/Canvas/runtime/features/renderer/modules/selection/managers/MindmapSelectionOrchestrator.ts` | Planned | CLTI-001 |
| CLTI-003 | Regression coverage for drawing translation logic | `components/modules/Canvas/runtime/features/renderer/modules/selection/managers/__tests__/ElementSynchronizer.drawing.test.ts` | Planned | CLTI-001 |
| CLTI-004 | Roadmap entry describing the initiative | `docs/roadmap/Unified-Workspace-Roadmap.md` | Planned | CLTI-001 → CLTI-003 |
| CLTI-005 | Changelog note captured under Unreleased | `CHANGELOG.md` | Planned | CLTI-001 → CLTI-003 |
| CLTI-006 | Memory graph update once work ships | `mcp_mcp_docker_add_observations` (Factory AI) | Pending release | CLTI-001 → CLTI-005 |

> _Status legend_: Planned = not yet started, Active = in progress, Complete = finished & validated, Pending release = waiting on deployment or comms.

---

### CLTI-001 · Propagate live transform deltas into ElementSynchronizer

- **Scope:** Let `SelectionModule` compute per-frame delta during drag/transform and forward it to `ElementSynchronizer.updateElementsFromNodes`. Use the delta to translate drawing point arrays immediately rather than waiting for drag end.
- **Implementation notes:**
  - Extend `updateElementsFromNodes` signature with optional `transformDelta`.
  - When `element.type === 'drawing'`, map over `points` and apply `dx`/`dy`.
  - Pass the delta through `SelectionModule.syncElementsDuringTransform` and ensure connector scheduling stays opt-in.
- **Acceptance criteria:**
  - Drawing strokes remain inside the active transformer throughout the drag.
  - No regression in connector synchronization or history batching.
- **Validation:**
  - `npm run type-check`
  - Targeted unit/vitest coverage where available
  - Manual marquee drag of drawings, shapes, connectors.

### CLTI-002 · Sync mindmap descendants mid-drag

- **Scope:** During transforms initiated on mindmap nodes, update descendant Konva groups via `ElementSynchronizer` so the transformer bounds include the entire branch.
- **Implementation notes:**
  - Gather descendant node groups via renderer APIs and feed them to `updateElementsFromNodes` with the same delta payload.
  - Avoid pushing history or scheduling connectors while mid-drag (batch updates only).
- **Acceptance criteria:** Dragging a mindmap branch keeps descendants aligned; transformer bounds stay accurate.
- **Validation:** Repeat manual mindmap drag scenarios; confirm no state churn in collaborator sessions.

### CLTI-003 · Regression coverage for drawing translation

- **Scope:** Add a focused vitest suite that constructs a Konva line, applies `updateElementsFromNodes` with a delta, and asserts the points translate.
- **Acceptance criteria:** Test fails if drawing points do not shift by the supplied delta.
- **Validation:** `npm run test -- ElementSynchronizer.drawing.test.ts`.

### CLTI-004 · Roadmap documentation

- **Scope:** Insert a Canvas row under the roadmap Objectives describing Live Transform Integrity, status, and owner.
- **Acceptance criteria:** Roadmap readers can quickly identify the initiative, scope, and responsible team.
- **Validation:** Spell-check and peer review during roadmap update PR.

### CLTI-005 · Changelog entry

- **Scope:** Note the fix under `## [Unreleased]` → `### Fixed`.
- **Acceptance criteria:** Entry succinctly describes the behavioural change for release packaging.
- **Validation:** Markdown linting if available.

### CLTI-006 · Memory graph observation

- **Scope:** After shipping, call `mcp_mcp_docker_add_observations` to record completion details for the Factory AI memory graph.
- **Acceptance criteria:** Observation renders under entity “Canvas Live Transform Integrity”.
- **Validation:** Confirm via `mcp_mcp_docker_open_nodes`.

## Deliverables & Reporting

1. Code changes validated through type checks, targeted tests, and manual QA on marquee/mindmap scenarios.
2. Roadmap and changelog sections updated in the same PR series when the fixes merge.
3. Memory graph observation captured immediately post-release.

## Risks & Mitigations

- **Increased mid-drag writes:** Monitor performance; throttle selector updates if profiling shows regressions.
- **Mindmap renderer coupling:** Keep descendant traversal behind renderer helper methods to avoid leaking Konva internals.
- **Connector scheduling:** Ensure delta propagation respects existing connector update cadence to avoid duplicate work.

## Provenance

This document supersedes the scratch plan drafted on 2025-10-24. Historical investigation notes remain in `canvas-tool-selection-audit.txt` and the broader [Canvas Refactor Plan](../guidelines/CanvasRefactorPlan.md). Update this document for all future Live Transform Integrity work.