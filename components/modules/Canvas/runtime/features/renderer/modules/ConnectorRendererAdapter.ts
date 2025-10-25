// Adapter for ConnectorRenderer to implement RendererModule interface
import Konva from "konva";
import type { ModuleRendererCtx, RendererModule } from "../types";
import { ConnectorRenderer, type RendererLayers } from "./ConnectorRenderer";
import type { ConnectorElement } from "../../types/connector";
import type { CanvasElement } from "../../../../../types";
import { getWorldViewportBounds } from "../../utils/viewBounds";
import type { Bounds } from "../../../../../types";

type Id = string;

const INDEX_QUERY_PADDING = 256;
const GEOMETRY_PADDING = 128;
const FALLBACK_FULL_SCAN_LIMIT = 200;

type StoreState = ReturnType<ModuleRendererCtx["store"]["getState"]>;

export class ConnectorRendererAdapter implements RendererModule {
  private renderer?: ConnectorRenderer;
  private unsubscribe?: () => void;
  private viewportUnsubscribe?: () => void;
  private readonly elementNodes = new Map<Id, Konva.Group>();
  private connectorsById = new Map<Id, ConnectorElement>();
  private elementsById = new Map<Id, CanvasElement>();
  private visibleIds = new Set<Id>();
  private visibilityScheduled = false;
  private visibilityRaf?: number;
  private visibilityTimeout?: ReturnType<typeof setTimeout>;
  private store?: ModuleRendererCtx["store"];
  private layers?: ModuleRendererCtx["layers"];

  mount(ctx: ModuleRendererCtx): () => void {
    this.store = ctx.store;
    this.layers = ctx.layers;
    // Create renderer with node resolver
    this.renderer = new ConnectorRenderer(ctx.layers as RendererLayers, {
      getNodeById: (id: string) => {
        // Find the node in the main layer
        const node = ctx.layers.main.findOne(`#${id}`);
        if (node) return node;

        // Fallback to cached nodes
        return this.elementNodes.get(id) || null;
      },
    });

    const initialState = ctx.store.getState();
    const initialConnectors = new Map<Id, ConnectorElement>();
    const initialElements = new Map<Id, CanvasElement>();

    for (const [id, element] of initialState.elements.entries()) {
      if (element.type === "connector") {
        initialConnectors.set(id, element as ConnectorElement);
      } else {
        initialElements.set(id, element);
      }
    }
    this.connectorsById = initialConnectors;
    this.elementsById = initialElements;
    this.rebuildElementNodes(initialElements);

    // Subscribe to store changes - watch connector elements AND viewport changes
    this.unsubscribe = ctx.store.subscribe(
      // Selector: extract connectors, elements, and viewport state
      (state) => {
        const connectors = new Map<Id, ConnectorElement>();
        const elements = new Map<Id, CanvasElement>();

        for (const [id, element] of state.elements.entries()) {
          if (element.type === "connector") {
            connectors.set(id, element as ConnectorElement);
          } else {
            // Cache other elements for endpoint resolution
            elements.set(id, element);
          }
        }

        return { connectors, elements };
      },
      // Callback: reconcile changes when elements OR viewport changes
      ({ connectors, elements }) => {
        this.handleStateUpdate(connectors, elements);
      },
    );

    this.viewportUnsubscribe = ctx.store.subscribe(
      (state) => state.viewport,
      () => this.requestVisibilityUpdate(),
      { fireImmediately: true },
    );

    this.requestVisibilityUpdate();

    // Return cleanup function
    return () => this.unmount();
  }

  private unmount() {
    this.unsubscribe?.();
    this.viewportUnsubscribe?.();
    this.cancelScheduledVisibility();
    if (this.renderer) {
      // Manually clear connectors since ConnectorRenderer doesn't have a clear method
      const layer = (this.renderer as unknown as { layers: RendererLayers })
        .layers.main;
      if (layer) {
        layer.find(".connector").forEach((node: Konva.Node) => node.destroy());
        layer.batchDraw();
      }
    }
    this.elementNodes.clear();
    this.connectorsById.clear();
    this.elementsById.clear();
    this.visibleIds.clear();
  }

  private handleStateUpdate(
    connectors: Map<Id, ConnectorElement>,
    elements: Map<Id, CanvasElement>,
  ) {
    this.connectorsById = connectors;
    this.elementsById = elements;
    this.rebuildElementNodes(elements);
    this.pruneRemovedConnectors(connectors);
    this.requestVisibilityUpdate();
  }

  private rebuildElementNodes(elements: Map<Id, CanvasElement>) {
    this.elementNodes.clear();
    for (const [id, element] of elements) {
      const group = new Konva.Group({
        id,
        x: typeof element.x === "number" ? element.x : 0,
        y: typeof element.y === "number" ? element.y : 0,
        width: typeof element.width === "number" ? element.width : 0,
        height: typeof element.height === "number" ? element.height : 0,
      });
      group.setAttr("elementId", id);
      this.elementNodes.set(id, group);
    }
  }

  private pruneRemovedConnectors(connectors: Map<Id, ConnectorElement>) {
    if (!this.renderer) {
      return;
    }

    for (const id of Array.from(this.visibleIds)) {
      if (!connectors.has(id)) {
        this.visibleIds.delete(id);
      }
    }

    for (const id of Array.from(this.rendererKeys())) {
      if (!connectors.has(id)) {
        this.renderer.destroy(id);
      }
    }
  }

  private *rendererKeys(): Iterable<string> {
    if (!this.renderer) {
      return;
    }
    // Access underlying layer to enumerate connector groups safely
    const layer = (this.renderer as unknown as { layers: RendererLayers }).layers
      .main;
    if (!layer) {
      return;
    }
    for (const node of layer.find(".connector")) {
      const id = node.id();
      if (id) {
        yield id;
      }
    }
  }

  private requestVisibilityUpdate() {
    if (this.visibilityScheduled) {
      return;
    }

    this.visibilityScheduled = true;
    const scheduleWithRaf =
      typeof window !== "undefined" &&
      typeof window.requestAnimationFrame === "function";

    const run = () => {
      this.visibilityScheduled = false;
      this.visibilityRaf = undefined;
      this.visibilityTimeout = undefined;
      this.updateVisibleConnectors();
    };

    if (scheduleWithRaf) {
      this.visibilityRaf = window.requestAnimationFrame(run);
    } else {
      this.visibilityTimeout = setTimeout(run, 16);
    }
  }

  private cancelScheduledVisibility() {
    if (
      typeof window !== "undefined" &&
      typeof window.cancelAnimationFrame === "function" &&
      this.visibilityRaf !== undefined
    ) {
      window.cancelAnimationFrame(this.visibilityRaf);
    }
    if (this.visibilityTimeout !== undefined) {
      clearTimeout(this.visibilityTimeout);
    }
    this.visibilityScheduled = false;
    this.visibilityRaf = undefined;
    this.visibilityTimeout = undefined;
  }

  private updateVisibleConnectors() {
    if (!this.renderer || !this.layers) {
      return;
    }

    const stage = this.layers.main.getStage();
    const storeState = this.store?.getState?.() as StoreState | undefined;
    if (!stage || !storeState) {
      return;
    }

    const nextVisible = this.computeVisibleIds(stage, storeState);

    for (const id of nextVisible) {
      const connector = this.connectorsById.get(id);
      if (!connector) {
        continue;
      }
      this.ensureConnectorRendered(id, connector);
    }

    for (const id of this.visibleIds) {
      if (!nextVisible.has(id)) {
        this.ensureConnectorHidden(id);
      }
    }

    this.visibleIds = nextVisible;
  }

  private computeVisibleIds(stage: Konva.Stage, storeState: StoreState): Set<Id> {
    const world = getWorldViewportBounds(stage);
    const width = world.maxX - world.minX;
    const height = world.maxY - world.minY;

    const candidateIds = new Set<Id>();
    try {
      const ids = storeState.spatialIndex?.queryBounds?.({
        x: world.minX,
        y: world.minY,
        width,
        height,
        padding: INDEX_QUERY_PADDING,
      });
      if (Array.isArray(ids)) {
        for (const id of ids) {
          if (this.connectorsById.has(id as Id)) {
            candidateIds.add(id as Id);
          }
        }
      }
    } catch {
      // Fallback handled below
    }

    for (const id of this.visibleIds) {
      if (this.connectorsById.has(id)) {
        candidateIds.add(id);
      }
    }

    const selectedIds = storeState.selectedElementIds;
    if (selectedIds) {
      for (const id of selectedIds) {
        if (this.connectorsById.has(id as Id)) {
          candidateIds.add(id as Id);
        }
      }
    }

    if (candidateIds.size === 0) {
      const stats = storeState.spatialIndex?.getStats?.();
      if (!stats || stats.itemCount === 0 || this.connectorsById.size <= FALLBACK_FULL_SCAN_LIMIT) {
        for (const id of this.connectorsById.keys()) {
          candidateIds.add(id);
        }
      }
    }

    const viewportRect: Bounds = {
      x: world.minX,
      y: world.minY,
      width,
      height,
    };

    const geometryApi = storeState.geometry;
    const nextVisible = new Set<Id>();

    for (const id of candidateIds) {
      const connector = this.connectorsById.get(id);
      if (!connector) {
        continue;
      }

      const bounds =
        geometryApi?.getElementBounds?.(id) ?? this.deriveBoundsFromConnector(connector);
      if (!bounds) {
        continue;
      }

      const expanded = inflateBounds(bounds, GEOMETRY_PADDING);
      if (rectsIntersect(expanded, viewportRect)) {
        nextVisible.add(id);
      }
    }

    return nextVisible;
  }

  private ensureConnectorRendered(id: Id, connector: ConnectorElement) {
    this.renderer?.render(connector).then(() => {
      this.renderer?.setVisibility(id, true);
    }).catch(() => {
      // noop
    });
  }

  private ensureConnectorHidden(id: Id) {
    this.renderer?.setVisibility(id, false);
  }

  private deriveBoundsFromConnector(conn: ConnectorElement): Bounds | null {
    if (Array.isArray(conn.points) && conn.points.length >= 2) {
      let minX = Number.POSITIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;
      for (let i = 0; i < conn.points.length; i += 2) {
        const px = conn.points[i];
        const py = conn.points[i + 1];
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }

      const stroke = Math.max(conn.style.strokeWidth ?? 1, 1);
      const padding = stroke / 2;

      return {
        x: minX - padding,
        y: minY - padding,
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2,
      } satisfies Bounds;
    }

    if (
      typeof conn.x === "number" &&
      typeof conn.y === "number" &&
      typeof conn.width === "number" &&
      typeof conn.height === "number"
    ) {
      return {
        x: conn.x - conn.width / 2,
        y: conn.y - conn.height / 2,
        width: conn.width,
        height: conn.height,
      } satisfies Bounds;
    }

    return null;
  }
}

function inflateBounds(bounds: Bounds, padding: number): Bounds {
  if (padding <= 0) {
    return { ...bounds };
  }

  return {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2,
  } satisfies Bounds;
}

function rectsIntersect(a: Bounds, b: Bounds): boolean {
  const aRight = a.x + a.width;
  const aBottom = a.y + a.height;
  const bRight = b.x + b.width;
  const bBottom = b.y + b.height;

  return aRight >= b.x && bRight >= a.x && aBottom >= b.y && bBottom >= a.y;
}
