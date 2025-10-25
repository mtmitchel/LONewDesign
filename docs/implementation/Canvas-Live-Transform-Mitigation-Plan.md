# Canvas Live Transform Mitigation Plan

**Source context:** `docs/technical/live-transform-unified-analysis.md` (25 Oct 2025)  
**Authors:** Canvas Platform Pod  
**Updated:** 2025-10-25

This plan translates the comprehensive analysis into a concrete mitigation program. It addresses the connector and drawing desynchronisation that occurs during marquee drags and transforms, and defines the operational sequence required to restore live transform integrity.

---

## Guiding Objectives
- Re-establish a unified live-transform pipeline so connectors, drawings, and primary shapes remain co-located throughout drag and transform operations.
- Maintain canonical geometry integrity in the Zustand store while providing immediate visual feedback in Konva.
- Protect performance (≥60 FPS during bulk drags).
- Institutionalise safeguards (tests, instrumentation, docs) to prevent regression.

---

## Phase 0 — Readiness & Baseline Confirmation
1. **Review analysis artefacts**  
   - Re-read `docs/technical/live-transform-unified-analysis.md` and `docs/technical/Canvas-Live-Transform-Audit-2025-10-25.md`.  
   - Map outstanding Git status to CLTI tasks (001‑006). Document any drift in `Canvas-Live-Transform-Integrity.md`.
2. **Stabilise local environment**  
   - Ensure `npm install` is current.  
   - Run `npm run type-check` and `npm run test -- ElementSynchronizer.drawing.test.ts` to capture baseline failures.
3. **Set up instrumentation toggles**  
   - Enable logging hooks (`window.__logGeometryMetrics`, ConnectorSelectionManager `debug`).  
   - Prepare FPS monitor utility for later phases.

**Exit Criteria:** Baseline tests pass (or failures recorded), analysis artefacts acknowledged, instrumentation ready.

---

## Phase 1 — Snapshot Enrichment & Dependency Instrumentation
1. **Populate `TransformSnapshot.connectors` and `.drawings`**  
   - In `SelectionModule.buildTransformControllerSnapshot`:  
     - Discover connectors whose `from`/`to` reference selected element IDs using an adjacency helper.  
     - Capture drawings intersecting the selection bounds or owned by selected elements.
2. **Refactor baseline discovery**  
   - Extract `ConnectorAdjacencyCache` service (analysis §6.1) and rebuild cache on store mutations to avoid O(n²) scans.  
   - Reuse cache during snapshot construction and baseline registration.
3. **Add instrumentation & assertions**  
   - Log connector/drawing counts per snapshot (dev-only).  
   - Assert that selections containing dependents never produce empty maps.
4. **Unit coverage**  
   - Add tests around snapshot builder to verify connector/drawing inclusion.

**Exit Criteria:** Snapshot maps populated deterministically; instrumentation flags anomalies; unit tests green. ✅ *(Completed 2025‑10‑25 — connectors/drawings now captured with adjacency cache; added `SelectionModule.snapshot.test.ts` for coverage.)*

---

## Phase 2 — Restored Immediate Visual Updates (Transient Channel)
1. **Introduce transient transform slice**  
   - Extend Zustand store with `transform.transientDelta`, `transform.snapshot`, and lifecycle actions (`beginTransform`, `updateTransform`, `commitTransform`, `cancelTransform`).
2. **Subscribe for imperative updates**  
   - In `SelectionModule`, subscribe to transient delta updates outside React.  
   - Translate Konva nodes, connector groups, and drawings every frame using snapshot baselines.  
   - Batch redraws via a single `dragLayer.batchDraw()` call.
   - ✅ Anchored connectors now reuse snapshot endpoints — `SelectionModule.routeAnchoredConnectorsDuringTransient` applies the delta directly to overriden connector endpoints and Konva groups while routing stays disabled, eliminating the mid-drag freeze.
3. **Lifecycle wiring**  
   - On drag start: populate snapshot, move nodes into drag layer, disable non-essential listeners.  
   - On drag move: emit transient delta (no history push).  
   - On drag end/cancel: commit canonical state (`commitTransform`) and re-enable listeners.
4. **Performance instrumentation**  
   - Hook FPS monitor to drag layer `draw` events; warn when FPS < 55.  
   - Verify no duplicate RAF scheduling.

**Exit Criteria:** Connectors and drawings visually track the pointer with zero frame lag; transient state cleared post-interaction; FPS ≥ 60 in test scene. *(In progress — store slice + SelectionModule subscriber now streaming deltas; remaining work: connector visual sync + drag layer batching.)*
   - ✅ Added `transform` store slice with `begin/update/commit/cancel` actions and exercised it via `transformSlice.test.ts`.
   - ✅ SelectionModule now publishes per-frame deltas, repositions drawings/non-anchored connectors through Konva nodes, and temporarily moves them into an overlay drag container during live transforms.
   - ✅ Transient deltas now operate in stage coordinates (`node.absolutePosition()`); snapshot baselines capture absolute positions so drag-layer reparenting no longer zeroes out deltas mid-drag.
   - ✅ Expanded transient updates to route anchored connector geometry during live drags and batch redraws via the overlay drag container to keep frame budgets intact.
   - ✅ Pointer-driven marquee drags now piggyback on the same lifecycle: `useMarqueeDrag` forwards drag start/progress/end to `SelectionModule`, so the transient channel powers live updates without duplicating connector/drawing math. Manual fallback logic only executes when the module API is unavailable.

---

## Phase 3 — Drawing Translation Harmonisation
1. **Snapshot baselines**  
   - ✅ Drawing snapshots now capture origin coordinates and cloned point arrays alongside node handles (`SelectionModule.buildTransformControllerSnapshot`).
2. **During drag**  
   - ✅ Transient channel translates drawing Konva nodes via baseline + delta while leaving point arrays untouched to avoid drift.
3. **On commit**  
   - ✅ `ElementSynchronizer.updateElementsFromNodes` persists final `x`/`y` offsets and keeps points relative when `pushHistory` runs, clearing stored baselines afterward.
4. **Testing**  
   - ✅ Added Vitest coverage across `ElementSynchronizer.drawing.test.ts` and `SelectionModule.transient.test.ts` to confirm transient + commit behaviour.

**Exit Criteria:** Drawings move as unified objects during drag and remain aligned after release.

---

## Phase 4 — Connector Participation Strategy
1. **Primary path (snapshot-driven translation)**  
   - ✅ Connectors stay out of the transformer node list while the transient subscription translates snapshots per frame.  
   - ✅ Anchored connectors now leverage `connectorSelectionManager.updateVisuals(delta)` only when required, letting the overlay drag container handle group translation without redundant reroutes.
2. **Safety nets**  
   - ✅ `applyConnectorDelta` continues to stream store updates for downstream consumers while the transient path batches redraws.  
   - ✅ Transient updates normalise scale/rotation for anchored connector groups before rerouting to prevent geometry drift.
3. **Optional fallback (if snapshot path insufficient)**  
   - ⬜ Evaluate connector drag proxies if future routing issues reappear.

**Exit Criteria:** Connectors remain inside transformer bounds mid-drag; no transformer artefacts (handles or scaling) appear on connectors.

---

## Phase 5 — Rendering Optimisation & Memory Hygiene
1. **Overlay drag container hardening**  
   - ✅ Drag-layer attach/detach flow restores original parents/z-order on commit/cancel; transient tests confirm no stray children remain.
2. **Batch redraw discipline**
   - ✅ Completed stray `.draw()` → `.batchDraw()` sweep across renderer modules (leaving `RafBatcher`'s opt-in immediate branch as the sole direct draw path) and confirmed stage hit detection now auto-toggles during drags to reduce pointer overhead.
3. **Test harness resilience**
   - ✅ Added a Vitest-safe Konva canvas stub and patched SelectionModule transient suites to rely on module-internal mocks so Phase 5 regressions stay covered without native bindings. Documented follow-up consideration to swap in `vitest-canvas-mock` (per current research) for a maintained shim once threads configuration stabilises.  
   - ✅ Removed lingering `vitest-canvas-mock` imports (`SelectionResolver.test.ts`) in favour of the shared canvas stub so suites run cleanly under the new harness.
3. **Subscription lifecycle**  
   - ✅ Stage hit detection now records its pre-transform state and restores it for every exit path (`commit`, `cancel`, transient stream collapse, and no-snapshot bailouts); expanded Vitest coverage (`SelectionModule.transient.test.ts`) exercises all three flows, including the guard when snapshot capture fails.  
   - ✅ Added transient-node regression coverage confirming drag-layer participants are returned to their original parents on commit and the parent cache fully clears.
   - ✅ Added a deactivation regression ensuring `handleTransformState` restores both stage listening and transient nodes whenever the transform stream goes inactive.
   - Standardise teardown for remaining transient subscriptions, FPS monitors, and log instrumentation so nothing leaks after drag completion.
   - ✅ Added `components/dev/CanvasStressHarness.tsx`, a 120-node Konva harness that wires `CanvasMonitor` metrics into a lightweight dashboard with optional jitter simulation for repeatable FPS spot checks. Access via the app module key `canvas-stress`.
4. **Performance validation**  
   - Use the stress harness to validate ≥60 FPS at ≥100 elements. Initial 120-node baseline (auto jitter enabled) holds ~164 FPS / 6.1 ms frame time on dev hardware.

**Exit Criteria:** Stress tests (≥100 elements) maintain ≥60 FPS; no lingering listeners after drag completion.


## Phase 6 — Validation & Regression Safety
1. **Automated coverage**  
   - ✅ Playwright stage listening coverage landed — `transform-stage-listening.test.ts` now launches the Canvas, injects a sticky note via the store API, and drives `SelectionModule.beginSelectionTransform`/`endSelectionTransform` inside the browser to validate Konva stage listening toggles.
   - ✅ Added comprehensive marquee regression (`marquee-all-elements.test.ts`) that seeds every canvas element type, marquee-selects them, applies a scripted delta, and asserts connectors/drawings remain aligned while absolute-position deltas flow through the transient channel.  
   - Add performance budget checks to CI (custom script or Lighthouse) focused on drag frame times.
2. **Manual QA matrix**  
   - Desktop (Chrome, Edge, Safari, Firefox) at 1× and 2× zoom.  
   - Touch/stylus devices validating `pointerrawupdate` path.
3. **Metrics review**  
   - Use instrumentation logs to confirm connector/drawing counts and bounds alignment.  
   - Capture before/after videos for regression library.

**Exit Criteria:** All automated suites green; manual matrix signed off; metrics within tolerances.

**Phase 6 Status Notes (2025-10-26):**
- ✅ Installed @playwright/test and browser binaries
- ✅ Created test utilities (launchTestCanvas, waitForCanvasReady, selectTool helpers)
- ✅ Exposed Konva stage, layers, and store on window in dev mode (useCanvasStageLifecycle)
- ✅ Established E2E test infrastructure - Canvas module loads correctly, elements can be created/selected
- ✅ Resolved transformer event gap by invoking SelectionModule lifecycle directly in-browser (programmatic `beginSelectionTransform` / `endSelectionTransform`)
  - Playwright test `transform-stage-listening.test.ts` now exercises stage listening toggles without relying on raw pointer simulation
  - Reuses transformer-attached nodes captured pre-transform to avoid Konva detachment edge cases
- ✅ Phase 5 completion confirmed: Stage listening restoration, transient node cleanup, unmount coverage all validated via unit tests

---

## Phase 7 — Documentation, Comms, and Memory Graph
1. **Update canonical docs**  
   - Revise `docs/technical/live-transform-unified-analysis.md` with implementation outcomes.  
   - Update `docs/implementation/Canvas-Live-Transform-Integrity.md` statuses (CLTI‑001 → CLTI‑006).  
   - Capture roadmap (`docs/roadmap/Unified-Workspace-Roadmap.md`) and changelog (`CHANGELOG.md`) entries once fixes merge.
2. **Knowledge propagation**  
   - Summarise mitigations and instrumentation in engineer onboarding snippets or weekly update.  
   - Record post-release observation via memory graph (`mcp_mcp_docker_add_observations`).

**Exit Criteria:** Documentation reflects final architecture; comms artefacts ready for stakeholders; memory graph updated post-release.

---

## Risks & Mitigations Snapshot
| Risk | Mitigation Path |
| --- | --- |
| Snapshot discovery spikes (O(n²)) on large documents | Implement adjacency cache (Phase 1) and reuse across features |
| Imperative updates diverge from canonical state | Commit final state at drag end, unit test `commitTransform` |
| Subscription leaks causing memory bloat | Standardise teardown hooks in `SelectionModule` and associated managers |
| Performance regressions post-fix | Maintain FPS monitor, CI perf budgets, and manual stress tests |

---

## Timeline & Ownership
| Phase | Est. Effort | Suggested Owner(s) | Notes |
| --- | --- | --- | --- |
| 0 | 0.5 sprint | Canvas pod | Prep + baseline |
| 1 | 1 sprint | SelectionModule/Geometry owners | Snapshot work |
| 2 | 2 sprints | Renderer & store engineers | Largest change set |
| 3 | 0.5 sprint | Drawing module owner | Focused delta |
| 4 | 0.5 sprint | Renderer perf lead | May overlap with Phase 2 |
| 5 | 1 sprint | QA + platform | Tests & validation |
| 6 | 0.5 sprint | Docs & PM | Comms + memory graph |

Total estimated window: **6–7 sprints** (can accelerate with parallelisation of Phases 3–5 once Phase 2 stabilises).

---

## Acceptance Definition
The mitigation effort is complete when:
1. Mid-drag visuals stay aligned for shapes, connectors, and drawings across marquee and transform workflows.  
2. Transformer bounds never expand unexpectedly after drag release.  
3. Automated and manual regressions remain green for two consecutive releases.  
4. Documentation, roadmap, changelog, and memory graph all reflect the shipped solution.  
5. Performance instrumentation confirms ≥60 FPS in stress scenarios.

This plan should be reviewed weekly during stand-ups and updated as implementation details evolve.
