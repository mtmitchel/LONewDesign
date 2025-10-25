# Canvas Spatial Indexing Prototype

_Date: 2025-10-25_

## Goals
- Provide a queryable spatial structure for canvas elements that relies on canonical bounds from the Zustand store.
- Support fast viewport culling and hit-testing ahead of the Track 4 spatial indexing milestone.
- Allow interaction code (drag/transform) to defer expensive rebuilds until the user finishes an operation.

## Implementation snapshot
- **Service:** `SpatialIndexService` (`components/modules/Canvas/runtime/features/stores/spatialIndex/SpatialIndexService.ts`).
  - Wraps the existing generic `QuadTree` utility with canvas-specific policies.
  - Consumes canonical element bounds via a `BoundsSource` factory produced by the unified canvas store.
  - Exposes range and point query helpers plus basic stats (item count, last build time, etc.).
  - Supports `beginDeferred` / `endDeferred` to pause rebuilds during transforms and drags.
- **Store integration:**
  - `useUnifiedCanvasStore` now exposes a `spatialIndex` slice with `queryBounds`, `queryPoint`, `beginInteraction`, `endInteraction`, and `getStats` helpers.
  - A `subscribeWithSelector` listener rebuilds (or marks dirty) whenever the `elements` map changes. During deferred sessions the latest bounds source is cached and replayed when the interaction ends.
- **Selection module hook:** When the transformer starts a `"transform"` session, the selection module calls `spatialIndex.beginInteraction("selection-transform")` and flushes the index on completion, ensuring all drag-induced element updates are collapsed into a single rebuild.

## Query API
```
const hits = store.getState().spatialIndex.queryBounds({
  x,
  y,
  width,
  height,
  padding: optionalPaddingInPx,
});
const hitIds = store.getState().spatialIndex.queryPoint(worldX, worldY, optionalRadius);
```
- Bounds queries return element IDs whose canonical bounds intersect the padded rectangle.
- Point queries normalise to a tiny range when no radius is provided.
- `padding` defaults to 8px via the service configuration to tolerate minor drifts.

## Deferred rebuilds (drag/transform)
1. Transformer begins (`source === "transform"`): selection module calls `beginInteraction`. The index records a deferred depth > 0.
2. Element synchroniser pushes updates; the store publishes a new `elements` map. The subscription marks the index as dirty but **does not rebuild** while deferred.
3. Transformer ends: selection module calls `endInteraction`. The index rebuilds once using the latest canonical bounds snapshot.

This eliminates dozens of quadtree rebuilds during a single drag operation while still guaranteeing fresh results once the interaction completes.

## Stats + instrumentation
`store.getState().spatialIndex.getStats()` returns:
- `itemCount`: elements indexed in the last build.
- `nodeCount`: lightweight estimate of quadtree node usage.
- `maxDepthReached`: configured depth ceiling (currently 8).
- `lastBuildDurationMs` + `lastBuildTimestamp`: basic performance telemetry.
- `deferredSessions`: active deferral depth (0 when idle).
- `pendingRebuild`: whether a rebuild is queued once deferral ends.

## Follow-ups
- **Viewport plumbing:** `ShapeRenderer`, `DrawingRenderer`, and `ConnectorRenderer` now query the spatial index to toggle visibility, but the remaining renderer modules (`CanvasModule`, previews) still need to adopt the same pattern before Track 4 completes.
- **Mindmap/connector overlays:** verify that derived renderer bounds (connectors, mindmap descendants) are represented accurately; consider eager recompute for derived geometry slices if needed.
- **Metrics:** emit structured telemetry (e.g., `canvas.spatial_index.build_ms`) once the service is exercised in production flows.
- **Index resizing:** evaluate adaptive root bounds or a tiling strategy when canvases exceed the initial combined world bounds.

This spike establishes the data-path and integration points needed to finish the Track 4 spatial indexing milestone while keeping the canonical geometry selectors as the single source of truth.
