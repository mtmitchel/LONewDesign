# Canvas Refactor Plan

## Overview
This plan sequences the five workstreams required to stabilise and scale the canvas module. Each track includes goals, deliverables, checkpoints, and risks. Execution order matters: Track 1 (Canonical Geometry Alignment) unblocks the remaining efforts. All work will be developed on `refactor/sync-service-modularization` unless noted otherwise.

---

## Track 1 · Canonical Geometry Alignment

### Goal
Guarantee that every Konva node, especially connectors, shares a single, authoritative geometry definition with the unified canvas store.

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
Replace ad-hoc geometry caching with reactive, memoised selectors keyed on canonical state.

### Tasks
1. Select reactive mechanism (MobX, Zustand selectors, or custom observable layer).
2. Implement memoised selectors (`getElementBounds`, `getUnionBounds`, `listVisibleElements`).
3. Refactor selection/renderer code to consume selectors instead of storing `selectBounds`.
4. Instrument recomputation cost and add throttling during sync bursts.

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

### Deliverables
- Spatial index module.
- Benchmark report.
- Tuning knobs (max depth, node capacity).

### Risks
- High mutation cost during live transforms; defer reinserts until interaction end, fall back to memoised bounds for live feedback.

---

## Track 5 · Command-Based Snapshotting & History

### Goal
Ensure undo/redo reliability by encapsulating state changes in command objects backed by canonical snapshots.

### Tasks
1. Design `Command` interface (`execute`, `undo`, optional `redo`).
2. Implement command types (`TransformCommand`, `ConnectorEndpointCommand`, `CreateDeleteCommand`).
3. Capture deep snapshots of canonical state before execution.
4. Wire selection and transform managers to emit commands for every user action.
5. Expand history test coverage to complex sequences.

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
