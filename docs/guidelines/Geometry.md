# Canvas Geometry Conventions

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
4. Renderer-side caches (`selectBounds`, bespoke offsets) must not diverge from canonical geometry; use `getClientRect` when an explicit rectangle is required.

## Selection & Bounds

- Selection controllers request bounding boxes via computed selectors exposed by the store (Track 2). Store selectors memoise `getClientRect` output based on canonical geometry.
- Renderers may provide `selectBounds` as a convenience hint, but values must originate from canonical data or fresh `getClientRect` calls.

## Testing Checklist

- Marquee-selecting a heterogeneous element set keeps connectors fully enclosed after translation.
- Undo/redo restores connector endpoints and group centres without drift.
- Remote sync updates that patch connector endpoints do not leave stale Konva positions.
