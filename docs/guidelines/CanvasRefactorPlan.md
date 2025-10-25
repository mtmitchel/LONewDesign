# Canvas Refactor Plan

> **Related documentation**: This plan sequences the five-track canvas stabilisation effort. For canonical geometry conventions and testing requirements, see [`Geometry.md`](./Geometry.md). For the technical audit that identified these issues, see [`../technical/Canvas-Live-Transform-Audit-2025-10-25.md`](../technical/Canvas-Live-Transform-Audit-2025-10-25.md).

## Overview
This plan sequences the five workstreams required to stabilise and scale the canvas module. Each track includes goals, deliverables, checkpoints, and risks. Execution order matters: Track 1 (Canonical Geometry Alignment) unblocks the remaining efforts. All work will be developed on `refactor/sync-service-modularization` unless noted otherwise.

### Current focus (2025-10-25)
- **Canvas Live Transform Integrity** — active task list tracked in `../implementation/Canvas-Live-Transform-Integrity.md`. This initiative delivers Track 3′s live transform guardrails while keeping roadmap/changelog entries in sync.

> **Implementation note:** The canvas runtime is built on **pure Konva** (direct `Konva.Stage`/`Konva.Node` usage). We intentionally do not depend on `react-konva`; renderer adapters manipulate Konva primitives imperatively for performance and tighter control over transformer synchronisation.

---

## Track 1 · Canonical Geometry Alignment

### Goal
Guarantee that every Konva node, especially connectors, shares a single, authoritative geometry definition with the unified canvas store. This eliminates coordinate system mismatches that caused connectors to appear outside selection frames after drag operations.

### Why This Matters
The original bug occurred because connector `Konva.Group` nodes defaulted to position `(0,0)` while their child Arrow/Line shapes used absolute world coordinates. When selection code called `getClientRect()` on the group, it calculated bounds from the child's point array, returning coordinates that didn't match the group's actual position. After dragging a selection, the transformer frame couldn't encompass connectors because it was reading stale or misaligned geometry.

The fix anchors each connector group at its canonical center (midpoint of endpoints) and converts child shape coordinates to group-relative offsets. Now `getClientRect()` returns accurate bounds that align with the store's `x/y` center.

### Tasks
1. **Renderer Inventory**
   - Catalogue how each renderer derives position/size/rotation.
   - Document current divergences between stored geometry and Konva nodes.
2. **Canonical Geometry Schema**
   - Extend the store typings to expose canonical `x`, `y`, `width`, `height`, `rotation`, `scale`, and connector endpoints.
   - Encode schema decisions in `docs/guidelines/Geometry.md`.
3. **Connector Renderer Refactor**
   - Anchor each connector `Konva.Group` at the canonical centre.
   - Translate child points (Arrow/Line) into group-local coordinates.
   - Remove renderer-side `selectBounds` caching.
4. **Synchroniser Update**
   - Ensure `ElementSynchronizer` writes via canonical geometry instead of manual offsets.
   - Add type guards to prevent regressions.
5. **Validation**
   - Integration test: marquee-select mixed content → drag → assert union bounds enclose connectors.
   - Regression scripts for mindmap reroutes and collaborative patches.

### Deliverables
- Updated connector renderer & synchroniser.
- Geometry schema docs.
- Automated tests covering marquee drag.

### Risks & Mitigations
- **Remote updates mid-drag**: throttle geometry recomputation.
- **Mindmap coupling**: coordinate reroute events with new geometry API.

---

## Track 2 · Reactive Store & Memoised Bounds

### Goal
Replace ad-hoc geometry caching with reactive, memoised selectors keyed on canonical state. This ensures marquee selection, transformer overlays, and all geometry-dependent UI pull from a single source of truth derived from store data rather than Konva node measurements.

### Why This Matters
Previously, renderers cached `selectBounds` attributes on Konva nodes, leading to stale geometry after transforms or remote updates. By moving bounds calculation into memoised store selectors, we guarantee that:
- Selection frames always match canonical element positions
- Transformer overlays wrap the correct union bounds during drag/resize
- Remote collaboration updates immediately reflect in selection UI
- No manual cache invalidation is required

### Tasks
1. Select reactive mechanism (MobX, Zustand selectors, or custom observable layer).
2. Implement memoised selectors (`getElementBounds`, `getUnionBounds`, `listVisibleElements`).
3. Refactor selection/renderer code to consume selectors instead of storing `selectBounds`.
4. Instrument recomputation cost and add throttling during sync bursts.

**Status – 2025-10-24**
- ✅ Store slice now exposes `geometry.getElementBounds`, and `MarqueeSelectionController` consumes it for marquee hit-testing.
- ✅ Drawing and connector renderers no longer cache `selectBounds`, relying on canonical geometry selectors instead.
- ✅ `TransformLifecycleCoordinator.getTransformerRect()` now prefers selector-based bounds over Konva's client rect, so transformer overlays and drag/resize operations use canonical geometry throughout.
- ✅ Marquee selection and transform workflows both operate from the same selector-backed source of truth.
- ✅ **Performance instrumentation complete**: Selectors track call frequency, cache hit/miss ratios, and total compute time. Metrics exposed via `geometry.getMetrics()` and `geometry.resetMetrics()`. Dev console logger installed at `window.__logGeometryMetrics()` and `window.__resetGeometryMetrics()`.

**What Works Now:**
- Marquee-selecting mixed content (shapes + connectors + drawings) calculates accurate union bounds from store geometry
- Dragging a selection uses the same canonical bounds for the transformer frame
- No renderer-side caching means bounds stay fresh after remote updates or undo/redo
- Performance metrics visible in browser console for tracking selector efficiency under load

**Remaining Track 2 Work:**
- ⚠️ Throttling/debouncing during sync bursts: Deferred to Track 4 or post-performance profiling. Current memoization in `computeBounds` already prevents redundant recalculation for unchanged elements. Further throttling requires understanding remote collaboration sync architecture and should be data-driven (only add if metrics show recomputation storms).
- ✅ **Track 2 Core Deliverables Complete**: All planned tasks finished; system ready for Track 3 (selection stack modularization)

### Deliverables
- Reactive store layer.
- Memoised bounds selectors.
- Instrumentation dashboard.

### Risks
- Feedback loops between selectors and mutations. Use read-only selectors and audit dependencies.

---

## Track 3 · Selection Stack Modularisation

### Goal
Break the monolithic `SelectionModule` into single-purpose managers.

### Tasks
1. Define interfaces for `SelectionManager`, `TransformerManager`, `ConnectorSelectionManager`, `MarqueeManager`, and an optional event bus.
2. Incrementally extract logic, starting with connectors (leveraging Track 1 output).
3. Write unit tests per manager and integration tests for combined scenarios.
4. Introduce feature flags to switch from legacy module to modular stack.

### Deliverables
- Manager classes with tests.
- Feature toggle plan and migration guide.

### Risks
- Temporary duplication; manage via flags and careful rollout.

**Status – 2025-10-24**
- ✅ Extracted `SelectionSubscriptionManager` to isolate store subscription lifecycle from `SelectionModule`, establishing the manager pattern for Track 3.
- ✅ Extracted `TransformerSelectionManager` to centralise transformer attach/detach logic, async scheduling, and aspect-ratio handling.
- ✅ Extracted `ConnectorSelectionOrchestrator` to encapsulate connector-only selection detection and debouncing, delegating renderer logic away from `SelectionModule`.
- ✅ Extracted `MindmapSelectionOrchestrator` so mindmap reroutes, descendant motion, and live edge updates happen outside `SelectionModule`.
- ⏳ Next extraction: event bus scaffolding to reduce ad-hoc cross-manager calls.

**What Works Now:**
- Selection subscription lifecycle is encapsulated behind a dedicated manager, making it testable and reusable.
- `SelectionModule` delegates subscription setup/teardown, reducing the surface area for future refactors.
- Connector-only selections are routed through the orchestrator, so transformer logic stays focused on non-connector paths.
- Mindmap drags keep descendants and edges in sync via the new orchestrator, and reroutes reuse a consistent entry point.

**Next Up:**
1. Add a **minimal** set of targeted tests covering `SelectionSubscriptionManager`, `TransformerSelectionManager`, `ConnectorSelectionOrchestrator`, and `MindmapSelectionOrchestrator` lifecycles (subscription churn, rapid selection changes). Limit coverage to the highest-risk scenarios so the suite stays fast and lightweight.
2. Define lightweight event bus contracts to decouple `SelectionModule` from future manager interactions.
3. Land feature flag `CANVAS_SELECTION_MANAGERS_V2` so we can stage rollout of the modular stack before legacy teardown.

---

## Track 4 · Spatial Indexing & Offscreen Optimisation

### Goal
Scale rendering performance for large canvases via spatial data structures.

### Tasks
1. Prototype Quadtree vs STR-tree indexing using representative workloads.
2. Implement index service within the data layer; update only after canonical geometry changes (post-interaction).
3. Provide APIs for viewport queries and future hit-testing.
4. Refactor renderers to cull offscreen nodes using the index plus a buffer zone.
5. Stress-test under pan/zoom/drag.
6. Publish `docs/technical/canvas/SpatialIndexing.md` outlining structure choice, tuning knobs (max depth, node capacity), and fallback behaviours.

### Deliverables

### Risks

---
| **4. Spatial indexing & offscreen culling** | Prototype quadtree/STR-tree, integrate with canonical bounds, defer reinserts until transform end, expose `queryVisible` API | 🔄 In progress | Spatial index service spike landed (QuadTree wrapper + deferred rebuilds) and documented in `docs/technical/canvas/SpatialIndexing.md`; renderer wiring still pending once modular selection cleanup finishes. |

## Track 5 · Command-Based Snapshotting & History

### Goal
Ensure undo/redo reliability by encapsulating state changes in command objects backed by canonical snapshots.

### Tasks
1. Design `Command` interface (`execute`, `undo`, optional `redo`).
2. Implement command types (`TransformCommand`, `ConnectorEndpointCommand`, `CreateDeleteCommand`).
3. Capture deep snapshots of canonical state before execution.
4. Wire selection and transform managers to emit commands for every user action.
5. Expand history test coverage to complex sequences.
6. Document architecture in `docs/technical/canvas/HistoryCommands.md`, including snapshot format, coalescing rules, and integration touchpoints.

### Deliverables
- Command framework & history manager.
- Comprehensive history tests.
- Dev tooling to inspect the command stack.

### Risks
- Snapshot size growth; start with deep copies, later optimise via structural sharing once correctness is proven.

---

## Milestones & Sequencing
1. **M1 – Geometry Groundwork**: Tracks 1 deliverables complete. (Blocking milestone.)
2. **M2 – Reactive State**: Track 2 selectors live; legacy caching removed.
3. **M3 – Modular Selection**: Track 3 managers enabled via feature flag.
4. **M4 – Performance Layer**: Spatial index powering viewport culling.
5. **M5 – Durable History**: Command framework covers all interactions.

---

## Tracking & Reporting
- Use GitHub project board “Canvas Stabilisation” with columns for each track.
- Weekly checkpoint notes appended to this document.
- PRs must reference the relevant track task IDs and include before/after GIFs where feasible.
