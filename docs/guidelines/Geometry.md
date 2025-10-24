# Canvas Geometry Conventions

> **Related documentation**: This file defines the canonical geometry model for the canvas module. For the overall refactor plan and implementation status, see [`CanvasRefactorPlan.md`](./CanvasRefactorPlan.md).

## Canonical Element Geometry
All canvas elements share a canonical geometry definition provided by the unified canvas store:

- `x`, `y`: World-space coordinates of the element's anchor point (centre for symmetric items, top-left for rectangular items unless stated otherwise).
- `width`, `height`: World-space dimensions before scale is applied.
- `rotation`: Clockwise rotation in degrees around the anchor point.
- `scaleX`, `scaleY`: Horizontal and vertical scale factors relative to canonical dimensions.
- `endpoints`: For connectors, world-space positions of the `from` and `to` endpoints.

The renderer layer must treat store geometry as the single source of truth. Konva nodes derive their transforms from canon data and may not maintain independent copies.

## Connector-Specific Rules

1. Every connector is rendered as a `Konva.Group` whose position equals the canonical centre:
   ```ts
   const centerX = (from.x + to.x) / 2;
   const centerY = (from.y + to.y) / 2;
   group.position({ x: centerX, y: centerY });
   ```
2. Child shapes (arrow/line) use group-local coordinates by subtracting the centre from each endpoint.
3. `ElementSynchronizer` reads the group position to update `element.x`/`element.y` and recomputes endpoints relative to the stored centre.
4. Renderer-side caches (for example `selectBounds` attributes or bespoke offsets) are deprecated. When a renderer needs a rectangle it should compute it on demand from canonical geometry or `getClientRect` and avoid persisting the result on the Konva node.

## Selection & Bounds

- Selection controllers request bounding boxes via memoised selectors exposed by the store. Selectors derive rects from canonical geometry, so no renderer-provided cache is required.
- Renderers should treat selector output as authoritative and avoid storing long-lived `selectBounds` hints on nodes.
- SelectionModule exposes `getSelectionBounds`; contextual tooling should call this accessor to stay in sync with store-derived geometry instead of reading from Konva nodes.

### Performance Instrumentation
The geometry selector system tracks:
- Call frequency for `getElementBounds` and `getUnionBounds`
- Cache hits/misses from the internal `computeBounds` memoization
- Total compute time spent in selector functions

**Dev Console Access**:
```js
window.__logGeometryMetrics()   // View current metrics
window.__resetGeometryMetrics() // Reset all counters
```

Metrics are exposed via `store.getState().geometry.getMetrics()` for programmatic access. Use this data to identify expensive selection operations or sync-burst scenarios requiring optimization.

## Testing Checklist

- Marquee-selecting a heterogeneous element set keeps connectors fully enclosed after translation.
- Undo/redo restores connector endpoints and group centres without drift.
- Remote sync updates that patch connector endpoints do not leave stale Konva positions.
- Selector metrics show high cache hit rates (>80%) during steady-state interaction; cache misses should spike only during batch transforms or sync bursts.
