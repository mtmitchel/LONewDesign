# Canvas Live Transform Audit — 25 Oct 2025

This document replaces the earlier `Canvas-Audit-Report.txt` and `canvas-tool-selection-audit.txt`. It captures the current state of the live-transform stack, the symptoms still reproduced today, and the precise code paths involved. Every code section referenced below is inlined verbatim to keep this report self-contained for downstream analysis.

## Reproduction Summary

Environment: desktop app build from branch `refactor/sync-service-modularization` (commit HEAD at time of writing). Konva 9.3.22, Zustand 5.0.8.

1. Open any canvas containing: sticky, circle, marquee strokes, two freehand drawings, a horizontal connector (mindmap branch) and two loose arrows (plain connectors).
2. Drag a marquee selection so every element is captured. Observe transformer fits tightly (Screenshot #1).
3. Drag the selection to the right while holding mouse. During drag the free connectors lag behind transformer bounds; drawings appear to move but remain partially anchored (Screenshot #2).
4. Release mouse. Transformer expands to include the old connector positions; drawings snap toward their original origin; mindmap descendants now track correctly after the latest change (Screenshot #3).

## Observed Behaviour (Current)

| Stage | Expected | Actual |
|-------|----------|--------|
|After marquee capture|Transformer encloses elements; baseline recorded|✅ matches expectation|
|During drag|All elements, connectors, drawings follow transformer|❌ connectors remain at original endpoints; drawings drift|
|On mouse up|Transformer bounds shrink to final extents; store canonical|❌ transformer stretches to include original connector positions; store geometry for drawings reverts|

The regression scope is connectors and drawings; mindmap descendants now remain inside the transformer thanks to the baseline registration added today.

## Pipeline Trace

### Geometry Selectors (Store Canonical Source)

The selector pipeline still derives connector bounds exclusively from resolved endpoints. Any missed endpoint patch leaves canonical geometry at the original coordinates. Excerpt from `components/modules/Canvas/runtime/features/stores/selectors/geometrySelectors.ts`:

```ts
function computeConnectorBounds(
  ctx: ResolverContext,
  connector: ConnectorElement,
): ElementBounds | null {
  const from = resolveEndpointPoint(ctx, connector.from);
  const to = resolveEndpointPoint(ctx, connector.to);
  if (!from || !to) {
    if (Array.isArray(connector.points) && connector.points.length >= 2) {
      return computeBoundsFromPoints(connector.points, connector.style?.strokeWidth);
    }
    if (
      typeof connector.x === "number" &&
      typeof connector.y === "number" &&
      typeof connector.width === "number" &&
      typeof connector.height === "number"
    ) {
      return {
        x: connector.x - connector.width / 2,
        y: connector.y - connector.height / 2,
        width: connector.width,
        height: connector.height,
      } satisfies ElementBounds;
    }
    return null;
  }

  let minX = Math.min(from.x, to.x);
  let minY = Math.min(from.y, to.y);
  let maxX = Math.max(from.x, to.x);
  let maxY = Math.max(from.y, to.y);

  const strokeHalf = Math.max(0, connector.style?.strokeWidth ?? 0) / 2;
  let padding = strokeHalf;

  if (connector.variant === "arrow") {
    const arrowSize = connector.style?.arrowSize ?? 10;
    const pointerWidth = arrowSize * 0.7;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy);
    if (length > 0) {
      const ux = dx / length;
      const uy = dy / length;
      const headX = to.x + ux * arrowSize;
      const headY = to.y + uy * arrowSize;
      minX = Math.min(minX, headX);
      minY = Math.min(minY, headY);
      maxX = Math.max(maxX, headX);
      maxY = Math.max(maxY, headY);
    }
    padding = Math.max(padding, pointerWidth / 2);
  }

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  } satisfies ElementBounds;
}
```

Any failure to update `connector.from`/`connector.to` results in stale bounds, which we still observe.

### SelectionModule — Live Transform Loop

Two relevant methods from `components/modules/Canvas/runtime/features/renderer/modules/SelectionModule.ts`:

```ts
private progressSelectionTransform(
  nodes: Konva.Node[],
  source: "drag" | "transform",
) {
  // ... logging omitted ...
  transformStateManager.progressTransform(nodes, source);

  const delta = this.transformController?.computeDelta(nodes);
  if (delta) {
    const elementIds = nodes
      .map((node) => node.getAttr("elementId") || node.id())
      .filter((id): id is string => Boolean(id));
    if (elementIds.length > 0) {
      this.registerConnectorBaselinesForElements(elementIds, false);
    }

    const snapshot = this.transformController?.getSnapshot();
    if (snapshot) {
      this.transformController?.updateConnectorShapes(
        delta,
        (connectorId, shape) => {
          if (shape) {
            connectorSelectionManager.updateShapeGeometry(connectorId, shape);
          }
        },
      );
    }
    this.applyConnectorDelta(delta);
    this.mindmapSelectionOrchestrator?.handleTransformProgress(
      nodes,
      source,
      delta,
    );
  }

  this.syncElementsDuringTransform(nodes, source, delta ?? undefined);
}

private registerConnectorBaselinesForElements(
  elementIds: Iterable<string>,
  includeConnectorSelf: boolean,
): void {
  const ids = Array.from(elementIds);
  if (ids.length === 0) {
    return;
  }

  const state = ctx.store.getState();
  const elements = state.elements;
  if (!elements) {
    return;
  }

  const idSet = new Set(ids);

  const addBaseline = (connectorId: string, connector: ConnectorElement) => {
    if (this.connectorBaselines.has(connectorId)) {
      return;
    }

    const position = {
      x: typeof connector.x === "number" ? connector.x : 0,
      y: typeof connector.y === "number" ? connector.y : 0,
    };

    this.connectorBaselines.set(connectorId, {
      position,
      from: this.cloneConnectorEndpoint(connector.from),
      to: this.cloneConnectorEndpoint(connector.to),
    });
    this.activeConnectorIds.add(connectorId);
  };

  elements.forEach((element, elementId) => {
    if (!element || element.type !== "connector") {
      return;
    }

    const connector = element as ConnectorElement;

    if (includeConnectorSelf && idSet.has(elementId)) {
      addBaseline(elementId, connector);
    }

    const fromElementId =
      connector.from?.kind === "element" ? connector.from.elementId : undefined;
    const toElementId =
      connector.to?.kind === "element" ? connector.to.elementId : undefined;

    if (
      (fromElementId && idSet.has(fromElementId)) ||
      (toElementId && idSet.has(toElementId))
    ) {
      addBaseline(elementId, connector);
    }
  });
}
```

Key insight: `updateConnectorShapes` depends on `snapshot.connectors`. As shown later, that map is never populated for connectors attached indirectly to selected elements.

### Transform Snapshot Content

`buildTransformControllerSnapshot` currently seeds only base positions; `connectors` map remains empty:

```ts
return {
  basePositions,
  connectors: new Map(),
  mindmapEdges: new Map(),
  movedMindmapNodes: new Set(),
  transformerBox: transformerRect
    ? { x: transformerRect.x, y: transformerRect.y }
    : undefined,
};
```

Without connector entries here, `updateConnectorShapes` never executes its body, so Konva groups stay in their original positions despite baseline registration.

### ElementSynchronizer — Connector Pathway

`components/modules/Canvas/runtime/features/renderer/modules/selection/managers/ElementSynchronizer.ts` handles per-node store updates. The connector branch is exercised only if nodes in `updateElementsFromNodes` include the connector group; during marquee drags they do not.

```ts
case "connector": {
  connectorIds.add(elementId);
  if (isConnectorElementType(element)) {
    this.syncConnectorFromNode(node, element, patch);
  }
  break;
}

// ... later ...

if (!options.skipConnectorScheduling && connectorIds.size > 0) {
  this.scheduleConnectorRefresh(connectorIds);
}
```

Because connector Konva groups are not part of the drag node array, the connector branch never runs. The only remaining pathway is the baseline-based `moveSelectedConnectors` below.

### ConnectorSelectionManager — Store Updates

`components/modules/Canvas/runtime/features/renderer/modules/selection/managers/ConnectorSelectionManager.ts`:

```ts
moveSelectedConnectors(
  connectorIds: Set<string>,
  delta: { dx: number; dy: number },
  baselines?: Map<string, { position: { x: number; y: number }; from?: ConnectorEndpoint; to?: ConnectorEndpoint }>,
): void {
  debug("ConnectorSelectionManager: moving selected connectors", {
    category: LOG_CATEGORY,
    data: {
      connectorCount: connectorIds.size,
      delta,
      sampleConnectorIds: Array.from(connectorIds).slice(0, 5),
    },
  });

  this.moveSelectedConnectorsWasCalled = true;

  const store = useUnifiedCanvasStore.getState();
  const elements = store.elements;
  if (!elements || !store.updateElement) {
    // warn omitted
    return;
  }

  connectorIds.forEach(connectorId => {
    const element = elements.get(connectorId);
    if (!element || element.type !== 'connector') {
      return;
    }

    const connector = element as ConnectorElement;
    const baseline = baselines?.get(connectorId);
    const basePosition = baseline?.position ?? {
      x: typeof connector.x === "number" ? connector.x : 0,
      y: typeof connector.y === "number" ? connector.y : 0,
    };

    const baselineFrom = baseline?.from ?? connector.from;
    const baselineTo = baseline?.to ?? connector.to;
    const fromIsPoint = baselineFrom?.kind === "point";
    const toIsPoint = baselineTo?.kind === "point";

    const connectorPatch: Partial<ConnectorElement> = {};

    if (!Number.isNaN(basePosition.x) && !Number.isNaN(basePosition.y)) {
      connectorPatch.x = basePosition.x + delta.dx;
      connectorPatch.y = basePosition.y + delta.dy;
    }

    if (fromIsPoint && baselineFrom?.kind === "point") {
      connectorPatch.from = {
        ...baselineFrom,
        x: baselineFrom.x + delta.dx,
        y: baselineFrom.y + delta.dy,
      };
    }

    if (toIsPoint && baselineTo?.kind === "point") {
      connectorPatch.to = {
        ...baselineTo,
        x: baselineTo.x + delta.dx,
        y: baselineTo.y + delta.dy,
      };
    }

    if (Object.keys(connectorPatch).length === 0) {
      return;
    }

    store.updateElement(connectorId, connectorPatch, { pushHistory: false });

    if (this.liveRoutingEnabled) {
      this.updateConnectorRouting(connectorId);
    }
  });
}
```

The store updates do fire, but without `updateConnectorShapes` moving the Konva group and without any transformed snapshot, the rendered shape remains at the original coordinates until the renderer reacts to the store change on the next full reconciliation. During the drag we observe the mismatch as the transformer outruns the connector.

## Failure Analysis

1. **Transform snapshot never captures dependent connectors.** `buildTransformControllerSnapshot` seeds `connectors: new Map()`. Nothing populates it with connectors whose `from`/`to` reference the selected elements. Consequently, `updateConnectorShapes` never runs, leaving Konva groups static mid-drag.

2. **Konva groups are excluded from drag node list.** `MarqueeSelectionController.prepareNodesForDrag` intentionally skips connectors: they never reach `ElementSynchronizer`, which could otherwise derive patches via `syncConnectorFromNode`.

3. **Store updates lag renderer.** `moveSelectedConnectors` writes to the store, but the renderer redraw depends on subscription that runs on RAF. During the drag frame, the Konva group still sits at its pre-drag coordinates, so transformer bounds include stale endpoints. When the drag completes, `computeConnectorBounds` still sees the old endpoint coordinates, so the transformer encloses a huge area.

4. **Drawings rely solely on baseline cloning.** Drawings convert `points` arrays relative to initial baseline. Because Konva nodes remain staged at their original origin (no transform snapshot), the renderer re-normalises points on each update, effectively anchoring the stroke even as we translate the store data.

## Outstanding Questions / Instrumentation Ideas

1. **Populate `snapshot.connectors`.** In `buildTransformControllerSnapshot`, iterate selected IDs and add entries for connectors whose endpoints reference those IDs. This would allow `updateConnectorShapes` to translate Konva groups in sync with the transformer.

2. **Include mindmap edges with connectors.** `snapshot.mindmapEdges` is currently unused; either remove or implement analogous handling via `MindmapController` to keep edges aligned mid-drag.

3. **Revisit connector exclusion from drag nodes.** Evaluate re-including connector Konva groups in `prepareNodesForDrag` (with a flag to prevent transformer handles) so `ElementSynchronizer` can produce patches directly.

4. **Verify store subscribers.** Add temporary logging around `ConnectorRenderer.handleStateUpdate` to confirm it observes mid-drag connector patches. If it runs, the remaining lag is purely visual (Konva group vs. store); if it never fires, there is still an upstream issue with the store update path.

5. **Drawings: align Konva node translation.** Investigate whether `DrawingRenderer.updateVisibleDrawings` re-normalises relative points each frame, overwriting the translated baseline. If so, capture initial absolute origin and apply delta there rather than mutating `points` alone.

## Recommended Next Steps for Implementer

1. Instrument `buildTransformControllerSnapshot` to log discovered connectors and confirm the snapshot is populated.
2. If snapshot remains empty, implement a helper that walks selected IDs → connected connectors to fill `snapshot.connectors` with the same baseline data used by `registerConnectorBaselinesForElements`.
3. Once `updateConnectorShapes` runs, verify Konva groups move live; transformer bounds should shrink accordingly. Confirm `ConnectorRenderer` receives store updates as a safety net.
4. For drawings, trace `DrawingRenderer.normalizePoints` to ensure it respects translated `points`; consider translating the Konva group (`node.position`) alongside `points` to avoid re-normalisation drift.
5. After fixes, rerun marquee scenarios, collaborative sessions, and transformer rotations to confirm canon alignment remains intact.

---

Prepared by: Codex (GPT-5) — 25 Oct 2025.

