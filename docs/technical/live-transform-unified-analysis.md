# Canvas Live Transform – Unified Analysis

**Updated:** 25 Oct 2025  
**Scope:** Multi-element marquee drag behaviour across shapes, connectors, drawings, and mindmap descendants.  
**Environment:** Konva 9.3.22, Zustand 5.0.8, desktop build (`refactor/sync-service-modularization`).

This document consolidates the previous audit, research, and design artefacts into a single reference. Pair it with the mitigation execution guide (`docs/implementation/Canvas-Live-Transform-Mitigation-Plan.md`) and the initiative tracker (`docs/implementation/Canvas-Live-Transform-Integrity.md`) when driving remediation work.

---

## Executive Summary
- **Primary symptom:** During marquee drags, connectors and freehand drawings lag behind the transformer and then snap back when the pointer is released. Mindmap descendants now follow, but overall geometry parity fails mid-drag.
- **Root cause:** The transform snapshot never includes dependent connectors/drawings, leaving the “fast path” for per-frame Konva updates empty. Store-only updates arrive a frame late, inflating transformer bounds and causing visual jumpiness.
- **Mitigation strategy:** Enrich the snapshot, stream deltas through a transient state channel, translate connected Konva groups in real time, and commit canonical geometry after drag completion. Reinforce with drag-layer rendering, instrumentation, and regression coverage.

---

## 1. Problem Statement

### 1.1 Current Symptoms

| Phase | Expected | Actual |
| --- | --- | --- |
| After marquee capture | Transformer encloses all selected content; baselines recorded | ✅ Behaves correctly |
| During drag | Shapes, connectors, drawings, mindmap descendants move together | ❌ Connectors remain anchored; drawings rubber-band |
| On release | Transformer shrinks to final extents; store geometry canonical | ❌ Bounds expand to include stale connector endpoints; drawings snap toward origin |

### 1.2 Reproduction Setup
- Canvas composition: sticky, circle, two freehand drawings, mindmap branch connector, two loose arrow connectors.
- Steps: marquee select all → drag horizontally → observe connector lag mid-drag → release pointer → observe bounding box jump.

### 1.3 Impact
- Transformer sizing becomes unreliable for precise transforms.
- Drawings teleport, eroding user trust.
- Collaboration timelines broadcast stale geometry, causing jitter for remote participants.
- QA captures (see `codex-clipboard-Dq2vBm.png`, `codex-clipboard-8T5aOl.png`, `codex-clipboard-Vl8bg9.png`) demonstrate regressions on current branch.

---

## 2. Root Cause Breakdown

| Failure Point | Evidence | Resulting Behaviour |
| --- | --- | --- |
| **Unpopulated transform snapshot** | `buildTransformControllerSnapshot` returns `connectors: new Map()` and never inserts dependents captured in `registerConnectorBaselinesForElements` | `updateConnectorShapes` never executes; connectors stay at drag-start coordinates |
| **Connector omission from drag nodes** | `MarqueeSelectionController.prepareNodesForDrag` filters out connector groups | `ElementSynchronizer.updateElementsFromNodes` never patches connector endpoints mid-drag |
| **Store-to-renderer latency** | `ConnectorSelectionManager.moveSelectedConnectors` writes to Zustand; Konva redraw occurs next RAF | Mid-drag frame mixes new shape positions with old connector endpoints |
| **Drawing baseline-only updates** | Drawings mutate `points` relative to a static node origin (`{0,0}`) | `DrawingRenderer.normalizePoints` reanchors strokes each frame, producing rubber-banding |
| **Fragmented transform loop** | Transform controller, synchronizer, connector manager, and Zustand subscribers each run independently | Dependents never receive a shared delta application, creating timing gaps |

### 2.1 Architectural Notes
- The intended design is **dual path**: (1) immediate Konva mutations for visuals, (2) deferred store commits for canonical geometry. Path (1) is currently inactive.
- Imperative updates must bypass React reconciliation; Zustand’s `subscribeWithSelector` middleware supports a transient channel that does not wait for React re-render.
- Konva groups should move via parent translation rather than mutating child coordinates, aligning with official guidance on connected objects ([Konva Connected Objects](https://konvajs.org/docs/sandbox/Connected_Objects.html)).

---

## 3. Mitigation Program Overview

Full execution details live in `docs/implementation/Canvas-Live-Transform-Mitigation-Plan.md`. The phases are summarised below:

1. **Phase 0 – Readiness:** Confirm baseline behaviour, enable instrumentation, align on CLTI tasks.
2. **Phase 1 – Snapshot Enrichment:** Populate connector/drawing baselines and add adjacency caching + assertions.
3. **Phase 2 – Transient Channel:** Stream deltas through a transient Zustand slice; translate Konva nodes in real time.
4. **Phase 3 – Drawing Harmonisation:** Translate drawing nodes alongside their point arrays; update synchroniser pathways.
5. **Phase 4 – Connector Participation:** Keep connectors out of transformer nodes, translate via snapshot, guard against scale/rotate.
6. **Phase 5 – Rendering Optimisation:** Introduce a dedicated drag layer, batch redraws, and clean up listeners.
7. **Phase 6 – Validation & Comms:** Expand automated and manual tests, update roadmap/changelog, and record completion in the memory graph.

---

## 4. Implementation Guidance

### 4.1 Snapshot Enrichment
Populate dependent connectors and drawings when the transform starts:

```typescript
function buildTransformControllerSnapshot(nodes: Konva.Node[]): TransformSnapshot {
  const selectedIds = new Set(nodes.map((node) => node.getAttr("elementId")));
  const { elements } = useUnifiedCanvasStore.getState();

  const connectors = new Map<string, ConnectorBaseline>();
  const drawings = new Map<string, DrawingBaseline>();

  elements?.forEach((element, elementId) => {
    if (!element) return;

    if (element.type === "connector") {
      const connector = element as ConnectorElement;
      const fromId =
        connector.from?.kind === "element" ? connector.from.elementId : undefined;
      const toId =
        connector.to?.kind === "element" ? connector.to.elementId : undefined;

      if ((fromId && selectedIds.has(fromId)) || (toId && selectedIds.has(toId))) {
        connectors.set(elementId, {
          position: { x: connector.x ?? 0, y: connector.y ?? 0 },
          from: cloneEndpoint(connector.from),
          to: cloneEndpoint(connector.to),
        });
      }
    }

    if (element.type === "drawing" && isDrawingWithinSelection(element, selectedIds)) {
      const drawing = element as DrawingElement;
      drawings.set(elementId, {
        x: drawing.x ?? 0,
        y: drawing.y ?? 0,
        points: [...drawing.points],
      });
    }
  });

  return {
    basePositions: captureBasePositions(nodes),
    connectors,
    drawings,
    mindmapEdges: new Map(),
    movedMindmapNodes: new Set(),
    transformerBox: computeTransformerBox(nodes),
  };
}
```

**Performance:** Maintain a `ConnectorAdjacencyCache` keyed by element ID → connector IDs. Rebuild on store updates to avoid O(n²) scans during drag start.

### 4.2 Transient State Channel (Immediate Visuals)
- Store now exposes a dedicated `transform` slice (`snapshot`, `transientDelta`, `begin/update/clear/commit/cancel`), letting renderers consume live deltas without touching selection internals.
- `SelectionModule` serialises connector/drawing baselines into that slice at drag start and publishes each computed delta mid-drag.
- The module also subscribes back to `transform` so it can translate drawings and non-anchored connectors directly via Konva nodes and batch redraw the affected layers. This keeps the visuals synchronized even before store updates propagate through React.
- On drag end, `commitTransform` resets transient state; existing synchronisers/finalisers still write the canonical geometry and history entries.

### 4.3 Drawing Translation
- Snapshot each drawing’s `x`, `y`, and cloned `points`.
- During drag, move the Konva node: `node.position({ x: baseline.x + dx, y: baseline.y + dy })`. Leave `points` untouched during transient updates.
- On commit, persist the final `x`, `y` in the store; keep `points` relative. Update `ElementSynchronizer.updateElementsFromNodes` to accept optional `transformDelta` so direct Konva node syncing continues working.

### 4.4 Connector Handling
- **Preferred approach:** Keep connectors out of the transformer node list. Translate each connector group via the enriched snapshot:

```typescript
snapshot.connectors.forEach((baseline, connectorId) => {
  const group = this.stage.findOne<Konva.Group>(`#${connectorId}`);
  if (!group) return;
  group.position({
    x: baseline.position.x + delta.dx,
    y: baseline.position.y + delta.dy,
  });

  if (this.liveRoutingEnabled) {
    this.connectorManager.updateShapeGeometry(
      connectorId,
      baseline.from && {
        ...baseline.from,
        x: baseline.from.x! + delta.dx,
        y: baseline.from.y! + delta.dy,
      },
      baseline.to && {
        ...baseline.to,
        x: baseline.to.x! + delta.dx,
        y: baseline.to.y! + delta.dy,
      },
    );
  }
});
```

- **Fallback:** If a unified node list is required, mark connectors as `isConnectorDragProxy` so the transformer excludes them from handles and force translation-only (`scaleX = 1`, `scaleY = 1`, `rotation = 0`) during `transform` events.

### 4.5 Rendering Performance
- Introduce a dedicated drag container (implemented as an overlay sub-group) and move all transforming nodes (plus dependents) into it on `dragstart`. Return them on commit/cancel so the main layers stay static during drags.
- Limit repaints to a single `dragLayer.batchDraw()` call per frame. Avoid `.draw()` within loops.
- Temporarily disable stage hit detection (`stage.listening(false)`) during drags to reduce pointer overhead.

### 4.6 Pointer & Input Fidelity
- Use `pointerdown`, `pointermove`, `pointerup` and apply `touch-action: none` to the canvas container.
- Adjust deltas for zoom: `deltaX = (clientX - startX) / stage.scaleX()`.
- Handle `getCoalescedEvents()` (and `pointerrawupdate` where supported) to avoid jitter during stylus or rapid mouse movement. See MDN pointer-event guidance for browser compatibility.

### 4.7 Transform Mathematics Reference
For translation-only drags:

$$
\begin{bmatrix}
x' \\
y' \\
1
\end{bmatrix}
=
\begin{bmatrix}
1 & 0 & \Delta x \\
0 & 1 & \Delta y \\
0 & 0 & 1
\end{bmatrix}
\begin{bmatrix}
x \\
y \\
1
\end{bmatrix}
$$

Baseline snapshots ensure these deltas accumulate correctly across multiple drag sessions without floating-point drift.

---

## 5. Testing & Instrumentation

### 5.1 Instrumentation Hooks
- **Snapshot counts:** Log connector/drawing totals when a transform starts. In development builds, assert that selections containing dependents never produce empty maps.
- **Bounds parity:** During drag, compare transformer bounds with the union of participating node bounds (tolerance ≤ 5 px). Emit warnings when they diverge.
- **Connector updates:** Count executions of `updateConnectorShapes`; the per-frame total should match the number of connectors in the snapshot.
- **Performance monitor:** Attach an `FPSMonitor` to the drag layer’s `draw` event. Warn if FPS drops below 55.

### 5.2 Automated Coverage

```typescript
describe("Marquee Transform", () => {
  it("moves connectors when one endpoint belongs to the selection", () => { /* ... */ });
  it("moves connectors when both endpoints are selected", () => { /* ... */ });
  it("keeps drawings aligned mid-drag", () => { /* ... */ });
  it("handles rapid drag/release cycles", () => { /* ... */ });
  it("keeps transformer bounds tight after release", () => { /* ... */ });
});
```

- Extend `ElementSynchronizer.drawing.test.ts` to cover both transient and final commit flows.
- Add Playwright (or equivalent) integration tests covering marquee drags, connectors, drawings, and mindmap branches.
- Enforce performance budgets in CI (≥60 FPS, <10 ms scripting time during synthetic drags).

### 5.3 Manual QA Matrix
- Browsers: Chrome, Edge, Firefox, Safari at 1× and 2× zoom.
- Input types: mouse, touch, stylus (ensure pointer event path is validated).
- Collaboration: two clients performing marquee drags; confirm remote visual updates remain smooth. Optionally send throttled previews every ~500 ms during long drags for UX polish.

---

## 6. Risks & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Heavy dependency scans on large canvases | Mid-drag stutter | Introduce adjacency cache; reuse across features |
| Imperative updates diverge from canonical store state | Collaboration desync | Commit final geometry at drag end; add regression tests for `commitTransform` |
| Subscription/listener leaks | Memory bloat over long sessions | Standardise teardown in `commitTransform` (`unsubscribe`, `dragLayer.off`) |
| Connector scaling when reintroduced to transformer nodes | Distorted geometry | Force translation-only semantics or prefer snapshot-driven path |
| Collaboration jitter (local-only transient updates) | Remote clients see jumps | Optionally broadcast throttled preview payloads; ensure final commit carries full geometry |

---

## 7. Reference Map

### Internal References
- `docs/implementation/Canvas-Live-Transform-Mitigation-Plan.md` — sequential execution plan.
- `docs/implementation/Canvas-Live-Transform-Integrity.md` — task breakdown (CLTI-001…006), status tracking.
- `docs/technical/Canvas-Live-Transform-Audit-2025-10-25.md` — verbatim code traces and historical reproduction logs.
- `docs/guidelines/CanvasRefactorPlan.md` — overarching canvas refactor context.
- `docs/guidelines/Geometry.md` — canonical geometry conventions and selector instrumentation guidance.

### External References
- Konva connected objects and manual line updates — <https://konvajs.org/docs/sandbox/Connected_Objects.html>
- Konva line dragging semantics (`x`, `y`, `points`) — <https://konvajs.org/docs/drag_and_drop/Drag_a_Line.html>
- Konva transformer API events — <https://konvajs.org/api/Konva.Transformer.html>
- Zustand `subscribeWithSelector` middleware — <https://zustand.docs.pmnd.rs/middlewares/subscribe-with-selector>

---

## 8. Success Criteria
Completion requires:
1. Mid-drag visuals remain aligned for shapes, connectors, and drawings across marquee/transform workflows.
2. Transformer bounds stay tight on release; canonical store geometry mirrors rendered state.
3. Automated regression + performance suites stay green for two consecutive releases.
4. Manual QA (browser + collaboration matrix) reports no lag or artefacts.
5. Documentation, roadmap, changelog, and memory graph are updated to reflect the shipped solution.

Keep this document as the authoritative analysis. Update it in tandem with the mitigation plan as new findings emerge.
