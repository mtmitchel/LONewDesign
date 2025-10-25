// Drawing renderer module for rendering pen, marker, and highlighter paths
import Konva from "konva";
import { getWorldViewportBounds } from "../../utils/viewBounds";
import type { ModuleRendererCtx, RendererModule } from "../index";
import type { Bounds } from "../../../../../types";

type Id = string;

const INDEX_QUERY_PADDING = 256;
const GEOMETRY_PADDING = 128;
const FALLBACK_FULL_SCAN_LIMIT = 200;

type StoreState = ReturnType<ModuleRendererCtx["store"]["getState"]>;

interface DrawingElement {
  id: Id;
  type: "drawing";
  subtype: "pen" | "marker" | "highlighter" | "eraser";
  points: number[]; // Flattened array of [x1, y1, x2, y2, ...]
  style?: {
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
  };
}

export class DrawingRenderer implements RendererModule {
  private readonly drawingNodes = new Map<Id, Konva.Line>();
  private mainLayer?: Konva.Layer;
  private highlighterGroup?: Konva.Group;
  private unsubscribe?: () => void;
  private viewportUnsubscribe?: () => void;
  private store?: ModuleRendererCtx["store"];
  private drawingsById = new Map<Id, DrawingElement>();
  private visibleIds = new Set<Id>();
  private visibilityScheduled = false;
  private visibilityRaf?: number;
  private visibilityTimeout?: ReturnType<typeof setTimeout>;

  mount(ctx: ModuleRendererCtx): () => void {
    this.mainLayer = ctx.layers.main;
    this.highlighterGroup = ctx.layers.highlighter;
    this.store = ctx.store;

    const initialState = ctx.store.getState();
    const initialDrawings = new Map<Id, DrawingElement>();
    for (const [id, element] of initialState.elements.entries()) {
      if (
        element.type === "drawing" &&
        element.subtype &&
        ["pen", "marker", "highlighter", "eraser"].includes(element.subtype)
      ) {
        initialDrawings.set(id, element as DrawingElement);
      }
    }
    this.drawingsById = initialDrawings;

    // Subscribe to store changes - watch drawing elements
    this.unsubscribe = ctx.store.subscribe(
      // Selector: extract drawing elements
      (state) => {
        const drawings = new Map<Id, DrawingElement>();
        for (const [id, element] of state.elements.entries()) {
          if (
            element.type === "drawing" &&
            element.subtype &&
            ["pen", "marker", "highlighter", "eraser"].includes(element.subtype)
          ) {
            drawings.set(id, element as DrawingElement);
          }
        }
        return drawings;
      },
      // Callback: reconcile changes
      (drawings) => this.handleStateUpdate(drawings),
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
    for (const node of this.drawingNodes.values()) {
      node.destroy();
    }
    this.drawingNodes.clear();
    if (this.mainLayer) {
      this.mainLayer.batchDraw();
    }
    this.highlighterGroup?.getLayer()?.batchDraw();
  }

  private handleStateUpdate(drawings: Map<Id, DrawingElement>) {
    this.drawingsById = drawings;
    this.pruneRemovedNodes(drawings);
    this.requestVisibilityUpdate();
  }

  private pruneRemovedNodes(drawings: Map<Id, DrawingElement>) {
    for (const [id, node] of Array.from(this.drawingNodes.entries())) {
      if (drawings.has(id)) {
        continue;
      }
      node.destroy();
      this.drawingNodes.delete(id);
      this.visibleIds.delete(id);
    }
  }

  private requestVisibilityUpdate() {
    if (this.visibilityScheduled) {
      return;
    }

    this.visibilityScheduled = true;
    const shouldUseRaf =
      typeof window !== "undefined" &&
      typeof window.requestAnimationFrame === "function";

    const run = () => {
      this.visibilityScheduled = false;
      this.visibilityRaf = undefined;
      this.visibilityTimeout = undefined;
      this.updateVisibleDrawings();
    };

    if (shouldUseRaf) {
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

  private updateVisibleDrawings() {
    if (!this.mainLayer) {
      return;
    }

    const stage = this.mainLayer.getStage();
    const storeState = this.store?.getState?.() as StoreState | undefined;
    if (!stage || !storeState) {
      return;
    }

    const nextVisible = this.computeVisibleIds(stage, storeState);

    for (const id of nextVisible) {
      const drawing = this.drawingsById.get(id);
      if (!drawing) {
        continue;
      }
      this.ensureDrawingNode(drawing);
    }

    for (const [id, node] of this.drawingNodes) {
      const shouldBeVisible = nextVisible.has(id);
      node.visible(shouldBeVisible);
      node.listening(shouldBeVisible);
      if (!shouldBeVisible) {
        continue;
      }
      const drawing = this.drawingsById.get(id);
      if (drawing) {
        this.ensureParentForNode(node, drawing);
      }
    }

    this.visibleIds = nextVisible;
    this.mainLayer.batchDraw();
    this.highlighterGroup?.getLayer()?.batchDraw();
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
          if (this.drawingsById.has(id as Id)) {
            candidateIds.add(id as Id);
          }
        }
      }
    } catch {
      // Fallback handled below
    }

    for (const id of this.visibleIds) {
      if (this.drawingsById.has(id)) {
        candidateIds.add(id);
      }
    }

    const selectedIds = storeState.selectedElementIds;
    if (selectedIds) {
      for (const id of selectedIds) {
        if (this.drawingsById.has(id as Id)) {
          candidateIds.add(id as Id);
        }
      }
    }

    if (candidateIds.size === 0) {
      const stats = storeState.spatialIndex?.getStats?.();
      if (!stats || stats.itemCount === 0 || this.drawingsById.size <= FALLBACK_FULL_SCAN_LIMIT) {
        for (const id of this.drawingsById.keys()) {
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
      const drawing = this.drawingsById.get(id);
      if (!drawing) {
        continue;
      }

      const bounds =
        geometryApi?.getElementBounds?.(id) ?? this.deriveBoundsFromDrawing(drawing);
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

  private ensureDrawingNode(drawing: DrawingElement) {
    if (!this.mainLayer) {
      return;
    }

    this.ensureHighlightContainer();

    let node = this.drawingNodes.get(drawing.id);

    if (!node) {
      node = this.createDrawingNode(drawing);
      this.drawingNodes.set(drawing.id, node);
      this.ensureParentForNode(node, drawing);
    } else {
      this.updateDrawingNode(node, drawing);
      this.ensureParentForNode(node, drawing);
    }

    node.visible(true);
    node.listening(true);
  }

  private ensureParentForNode(node: Konva.Line, drawing: DrawingElement) {
    const needsHighlighterGroup =
      drawing.subtype === "highlighter" || drawing.subtype === "marker";
    const desiredParent = needsHighlighterGroup ? this.highlighterGroup ?? this.ensureHighlightContainer() : this.mainLayer;
    if (!desiredParent) {
      return;
    }
    if (node.getParent() !== desiredParent) {
      desiredParent.add(node);
    }
  }

  private ensureHighlightContainer() {
    if (!this.mainLayer) {
      return;
    }

    const groupNeedsRebuild =
      !this.highlighterGroup || this.highlighterGroup.getStage() === null;

    if (groupNeedsRebuild) {
      const existing = this.mainLayer.findOne<Konva.Group>(".main-highlighter");
      this.highlighterGroup = existing ?? new Konva.Group({
        listening: false,
        name: "main-highlighter",
      });
    }

    if (!this.highlighterGroup) {
      return undefined;
    }

    const needsReattach = this.highlighterGroup.getParent() !== this.mainLayer;
    if (needsReattach) {
      this.mainLayer.add(this.highlighterGroup);
    }

    if (needsReattach && typeof this.highlighterGroup.moveToTop === "function") {
      this.highlighterGroup.moveToTop();
      this.mainLayer.batchDraw();
    }

    return this.highlighterGroup;
  }

  private deriveBoundsFromDrawing(drawing: DrawingElement): Bounds | null {
    if (drawing.points.length < 2) {
      return null;
    }

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < drawing.points.length; i += 2) {
      const px = drawing.points[i];
      const py = drawing.points[i + 1];
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }

    const strokeWidth = this.getStrokeWidth(drawing);
    const padding = strokeWidth / 2;

    return {
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
    } satisfies Bounds;
  }

  private createDrawingNode(drawing: DrawingElement): Konva.Line {
    const isHighlighter = drawing.subtype === "highlighter";
    const isEraser = drawing.subtype === "eraser";
    const { originX, originY, relativePoints } = this.normalizePoints(drawing.points);
    const node = new Konva.Line({
      id: drawing.id,
      points: relativePoints,
      x: originX,
      y: originY,
      stroke: this.getStrokeColor(drawing),
      strokeWidth: this.getStrokeWidth(drawing),
      opacity: this.getOpacity(drawing),
      lineCap: "round",
      lineJoin: "round",
      listening: true,
      perfectDrawEnabled: false,
      shadowForStrokeEnabled: false,
      tension: 0,
      globalCompositeOperation: isEraser
        ? "destination-out"
        : isHighlighter
          ? "multiply"
          : "source-over",
    });
    node.setAttr("elementId", drawing.id);
    node.setAttr("nodeType", "drawing");
    node.setAttr("originX", originX);
    node.setAttr("originY", originY);
    return node;
  }

  private updateDrawingNode(node: Konva.Line, drawing: DrawingElement) {
    const isHighlighter = drawing.subtype === "highlighter";
    const isEraser = drawing.subtype === "eraser";
    const { originX, originY, relativePoints } = this.normalizePoints(drawing.points);

    node.setAttrs({
      points: relativePoints,
      x: originX,
      y: originY,
      stroke: this.getStrokeColor(drawing),
      strokeWidth: this.getStrokeWidth(drawing),
      opacity: this.getOpacity(drawing),
      globalCompositeOperation: isEraser
        ? "destination-out"
        : isHighlighter
          ? "multiply"
          : "source-over",
    });
    node.setAttr("originX", originX);
    node.setAttr("originY", originY);
  }

  private normalizePoints(points: number[]): {
    originX: number;
    originY: number;
    relativePoints: number[];
  } {
    if (points.length >= 2) {
      const originX = points[0];
      const originY = points[1];
      const relativePoints = new Array(points.length);
      for (let i = 0; i < points.length; i += 2) {
        relativePoints[i] = points[i] - originX;
        relativePoints[i + 1] = points[i + 1] - originY;
      }
      return { originX, originY, relativePoints };
    }

    return {
      originX: 0,
      originY: 0,
      relativePoints: points.slice(),
    };
  }

  private getStrokeColor(drawing: DrawingElement): string {
    if (drawing.style?.stroke) return drawing.style.stroke;

    switch (drawing.subtype) {
      case "pen":
        return "#000000";
      case "marker":
        return "#EF4444";
      case "highlighter":
        return "#FDE047";
      case "eraser":
        return "#FFFFFF"; // Eraser uses white for destination-out
      default:
        return "#000000";
    }
  }

  private getStrokeWidth(drawing: DrawingElement): number {
    if (drawing.style?.strokeWidth) return drawing.style.strokeWidth;

    switch (drawing.subtype) {
      case "pen":
        return 2;
      case "marker":
        return 4;
      case "highlighter":
        return 12;
      case "eraser":
        return 20;
      default:
        return 2;
    }
  }

  private getOpacity(drawing: DrawingElement): number {
    if (drawing.style?.opacity !== undefined) return drawing.style.opacity;

    switch (drawing.subtype) {
      case "pen":
        return 1;
      case "marker":
        return 0.9;
      case "highlighter":
        return 0.4;
      case "eraser":
        return 1; // Full opacity for eraser effect
      default:
        return 1;
    }
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
