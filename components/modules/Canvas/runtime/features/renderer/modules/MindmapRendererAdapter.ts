// Adapter for MindmapRenderer to implement RendererModule interface with spatial culling
import type Konva from "konva";
import type { ModuleRendererCtx, RendererModule } from "../index";
import { MindmapRenderer } from "./MindmapRenderer";
import {
  DEFAULT_BRANCH_STYLE,
  DEFAULT_NODE_STYLE,
  MINDMAP_CONFIG,
  MINDMAP_THEME,
  getNodeConnectionPoint,
  measureMindmapLabel,
  type BranchStyle,
  type MindmapEdgeElement,
  type MindmapNodeElement,
  type MindmapNodeStyle,
} from "@/features/canvas/types/mindmap";
import { getWorldViewportBounds } from "../../utils/viewBounds";
import type { Bounds, CanvasElement } from "../../../../../types";

type Id = string;

type StoreState = ReturnType<ModuleRendererCtx["store"]["getState"]>;

interface MindmapCanvasElement extends Omit<CanvasElement, "style"> {
  level?: number;
  color?: string;
  style?: MindmapNodeStyle | BranchStyle;
  data?: {
    level?: number;
    color?: string;
    style?: MindmapNodeStyle | BranchStyle;
    text?: string;
    parentId?: string | null;
    textWidth?: number;
    textHeight?: number;
    width?: number;
    height?: number;
    fromId?: string;
    toId?: string;
  };
  text?: string;
  parentId?: string | null;
  textWidth?: number;
  textHeight?: number;
  fromId?: string;
  toId?: string;
}

const INDEX_QUERY_PADDING = 256;
const GEOMETRY_PADDING = 144;
const EDGE_CURVE_PADDING = 96;
const FALLBACK_FULL_SCAN_LIMIT = 160;

export class MindmapRendererAdapter implements RendererModule {
  private renderer?: MindmapRenderer;
  private store?: ModuleRendererCtx["store"];
  private layers?: ModuleRendererCtx["layers"];
  private unsubscribe?: () => void;
  private viewportUnsubscribe?: () => void;
  private readonly previousNodeHeights = new Map<string, number>();
  private nodesById = new Map<Id, MindmapNodeElement>();
  private edgesById = new Map<Id, MindmapEdgeElement>();
  private visibleNodeIds = new Set<Id>();
  private visibleEdgeIds = new Set<Id>();
  private visibilityScheduled = false;
  private visibilityRaf?: number;
  private visibilityTimeout?: ReturnType<typeof setTimeout>;

  mount(ctx: ModuleRendererCtx): () => void {
    this.store = ctx.store;
    this.layers = ctx.layers;

    this.renderer = new MindmapRenderer(ctx.layers, ctx.store);
    if (typeof window !== "undefined") {
      (window as Window & { mindmapRenderer?: MindmapRenderer }).mindmapRenderer =
        this.renderer;
    }

    this.unsubscribe = ctx.store.subscribe(
      (state) => {
        const nodes = new Map<Id, MindmapNodeElement>();
        const edges = new Map<Id, MindmapEdgeElement>();

        for (const [id, element] of state.elements.entries()) {
          const node = toMindmapNode(element as CanvasElement);
          if (node) {
            nodes.set(id, node);
            continue;
          }

          const edge = toMindmapEdge(element as CanvasElement);
          if (edge) {
            edges.set(id, edge);
          }
        }

        return { nodes, edges, selectedTool: state.ui?.selectedTool };
      },
      ({ nodes, edges }) => {
        this.handleStateUpdate(nodes, edges);
      },
      { fireImmediately: true },
    );

    this.viewportUnsubscribe = ctx.store.subscribe(
      (state) => state.viewport,
      () => this.requestVisibilityUpdate(),
      { fireImmediately: true },
    );

    // Return cleanup function
    return () => this.unmount();
  }

  private unmount() {
    this.unsubscribe?.();
    this.viewportUnsubscribe?.();
    this.cancelScheduledVisibility();
    if (typeof window !== "undefined") {
      delete (window as Window & { mindmapRenderer?: MindmapRenderer }).mindmapRenderer;
    }

    this.renderer?.clear();
    this.renderer = undefined;

    this.previousNodeHeights.clear();
    this.nodesById.clear();
    this.edgesById.clear();
    this.visibleNodeIds.clear();
    this.visibleEdgeIds.clear();
  }

  private handleStateUpdate(
    nodes: Map<Id, MindmapNodeElement>,
    edges: Map<Id, MindmapEdgeElement>,
  ) {
    const prevNodes = new Map(this.nodesById);
    const prevEdges = new Map(this.edgesById);

    this.nodesById = new Map(nodes);
    this.edgesById = new Map(edges);

    this.repositionSiblingsIfNeeded();
    this.pruneRemovedElements(prevNodes, prevEdges);
    this.requestVisibilityUpdate();
  }

  private pruneRemovedElements(
    prevNodes: Map<Id, MindmapNodeElement>,
    prevEdges: Map<Id, MindmapEdgeElement>,
  ) {
    if (!this.renderer) return;

    for (const id of prevNodes.keys()) {
      if (this.nodesById.has(id)) continue;
      this.previousNodeHeights.delete(id);
      this.visibleNodeIds.delete(id);
      this.renderer.remove(id);
    }

    for (const id of prevEdges.keys()) {
      if (this.edgesById.has(id)) continue;
      this.visibleEdgeIds.delete(id);
      this.renderer.remove(id);
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
      this.updateVisibleElements();
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

  private updateVisibleElements() {
    if (!this.renderer || !this.layers || !this.store) {
      return;
    }

    const stage = this.layers.main.getStage();
    const storeState = this.store.getState?.() as StoreState | undefined;
    if (!stage || !storeState) {
      return;
    }

    const { nodes: nextNodes, edges: nextEdges } = this.computeVisibleElements(
      stage,
      storeState,
    );

    for (const id of nextNodes) {
      const node = this.nodesById.get(id);
      if (!node) continue;
      this.ensureNodeRendered(node);
    }

    for (const id of this.visibleNodeIds) {
      if (nextNodes.has(id)) continue;
      this.ensureNodeHidden(id);
    }

    for (const id of nextEdges) {
      const edge = this.edgesById.get(id);
      if (!edge) continue;
      this.ensureEdgeRendered(edge);
    }

    for (const id of this.visibleEdgeIds) {
      if (nextEdges.has(id)) continue;
      this.ensureEdgeHidden(id);
    }

    this.visibleNodeIds = nextNodes;
    this.visibleEdgeIds = nextEdges;
  }

  private computeVisibleElements(stage: Konva.Stage, storeState: StoreState) {
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
          candidateIds.add(id as Id);
        }
      }
    } catch {
      // Spatial index unavailable; rely on fallbacks below
    }

    for (const id of this.visibleNodeIds) {
      candidateIds.add(id);
    }
    for (const id of this.visibleEdgeIds) {
      candidateIds.add(id);
    }

    const selectedIds = storeState.selectedElementIds;
    if (selectedIds) {
      for (const id of selectedIds) {
        candidateIds.add(id as Id);
      }
    }

    if (candidateIds.size === 0) {
      const stats = storeState.spatialIndex?.getStats?.();
      const totalElements = this.nodesById.size + this.edgesById.size;
      if (!stats || stats.itemCount === 0 || totalElements <= FALLBACK_FULL_SCAN_LIMIT) {
        for (const id of this.nodesById.keys()) {
          candidateIds.add(id);
        }
        for (const id of this.edgesById.keys()) {
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
    const nextNodes = new Set<Id>();
    const nextEdges = new Set<Id>();

    for (const id of candidateIds) {
      if (this.nodesById.has(id)) {
        const node = this.nodesById.get(id)!;
        const bounds =
          geometryApi?.getElementBounds?.(id) ?? this.deriveBoundsFromNode(node);
        if (!bounds) continue;
        const expanded = inflateBounds(bounds, GEOMETRY_PADDING);
        if (rectsIntersect(expanded, viewportRect)) {
          nextNodes.add(id);
        }
      } else if (this.edgesById.has(id)) {
        const edge = this.edgesById.get(id)!;
        const bounds =
          geometryApi?.getElementBounds?.(id) ??
          this.deriveBoundsFromEdge(edge);
        if (!bounds) continue;
        const expanded = inflateBounds(bounds, GEOMETRY_PADDING + EDGE_CURVE_PADDING);
        if (rectsIntersect(expanded, viewportRect)) {
          nextEdges.add(id);
        }
      }
    }

    // Keep edges visible whenever their endpoints are visible
    for (const edge of this.edgesById.values()) {
      if (nextEdges.has(edge.id)) continue;
      if (nextNodes.has(edge.fromId) || nextNodes.has(edge.toId)) {
        nextEdges.add(edge.id);
      }
    }

    return { nodes: nextNodes, edges: nextEdges };
  }

  private ensureNodeRendered(node: MindmapNodeElement) {
    this.renderer?.renderNode(node);
    const group = this.renderer?.getNodeGroup(node.id);
    group?.show();
    group?.listening(true);
    this.previousNodeHeights.set(node.id, node.height);
  }

  private ensureNodeHidden(id: Id) {
    const group = this.renderer?.getNodeGroup(id);
    if (!group) {
      return;
    }
    group.hide();
    group.listening(false);
  }

  private ensureEdgeRendered(edge: MindmapEdgeElement) {
    if (!this.renderer) return;
    this.renderer.renderEdge(edge, (nodeId, side) => this.getNodePoint(nodeId, side));
    const shape = this.getEdgeShape(edge.id);
    shape?.show();
  }

  private ensureEdgeHidden(id: Id) {
    const shape = this.getEdgeShape(id);
    if (!shape) {
      return;
    }
    shape.hide();
  }

  private getNodePoint(id: string, side: "left" | "right") {
    const node = this.nodesById.get(id);
    if (!node) return null;
    return getNodeConnectionPoint(node, side);
  }

  private getEdgeShape(id: Id): Konva.Shape | undefined {
    const renderer = this.renderer as unknown as {
      edgeShapes?: Map<Id, Konva.Shape>;
    };
    return renderer?.edgeShapes?.get(id);
  }

  private deriveBoundsFromNode(node: MindmapNodeElement): Bounds {
    return {
      x: node.x,
      y: node.y,
      width: Math.max(1, node.width ?? MINDMAP_CONFIG.minNodeWidth),
      height: Math.max(1, node.height ?? MINDMAP_CONFIG.minNodeHeight),
    } satisfies Bounds;
  }

  private deriveBoundsFromEdge(edge: MindmapEdgeElement): Bounds | null {
    const fromNode = this.nodesById.get(edge.fromId);
    const toNode = this.nodesById.get(edge.toId);
    if (!fromNode || !toNode) {
      return null;
    }

    const start = getNodeConnectionPoint(fromNode, "right");
    const end = getNodeConnectionPoint(toNode, "left");
    if (!start || !end) {
      return null;
    }

    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    return {
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
    } satisfies Bounds;
  }

  private repositionSiblingsIfNeeded() {
    if (!this.store) return;

    const nodesByParent = new Map<string | null | undefined, MindmapNodeElement[]>();
    for (const node of this.nodesById.values()) {
      const parentId = node.parentId ?? null;
      if (!nodesByParent.has(parentId)) {
        nodesByParent.set(parentId, []);
      }
      nodesByParent.get(parentId)!.push(node);
    }

    for (const siblings of nodesByParent.values()) {
      if (siblings.length <= 1) continue;

      let hasHeightChange = false;
      for (const sibling of siblings) {
        const previous = this.previousNodeHeights.get(sibling.id);
        if (previous !== undefined && previous !== sibling.height) {
          hasHeightChange = true;
          break;
        }
      }
      if (!hasHeightChange) continue;

      siblings.sort((a, b) => a.y - b.y);

      const SIBLING_SPACING = 20;
      let currentY = siblings[0].y;
      const updates: Array<{ id: string; y: number }> = [];

      for (let index = 1; index < siblings.length; index += 1) {
        const previous = siblings[index - 1];
        const sibling = siblings[index];
        const minY = currentY + previous.height + SIBLING_SPACING;
        if (sibling.y < minY) {
          updates.push({ id: sibling.id, y: minY });
          currentY = minY;
        } else {
          currentY = sibling.y;
        }
      }

      if (!updates.length) {
        continue;
      }

      const state = this.store.getState() as {
        updateElement?: (id: string, data: { y: number }, options?: { pushHistory: boolean }) => void;
        element?: {
          update?: (id: string, data: { y: number }, options?: { pushHistory: boolean }) => void;
        };
      };

      const update = state.updateElement ?? state.element?.update;
      if (typeof update !== "function") {
        continue;
      }

      for (const { id, y } of updates) {
        update(id, { y }, { pushHistory: false });
        const node = this.nodesById.get(id);
        if (node) {
          node.y = y;
        }
      }
    }
  }
}

function mergeNodeStyle(style?: MindmapNodeStyle): MindmapNodeStyle {
  return { ...DEFAULT_NODE_STYLE, ...(style ?? {}) };
}

function mergeBranchStyle(style?: BranchStyle): BranchStyle {
  return { ...DEFAULT_BRANCH_STYLE, ...(style ?? {}) };
}

function toMindmapNode(element: CanvasElement): MindmapNodeElement | null {
  if (element.type !== "mindmap-node") return null;

  const mindmapElement = element as MindmapCanvasElement;
  const level =
    mindmapElement.level ??
    mindmapElement.data?.level ??
    ((mindmapElement.parentId ?? mindmapElement.data?.parentId) ? 1 : 0);
  const color =
    mindmapElement.color ??
    mindmapElement.data?.color ??
    MINDMAP_THEME.nodeColors[level % MINDMAP_THEME.nodeColors.length];

  const nodeStyle = mindmapElement.style ?? mindmapElement.data?.style;
  const style = mergeNodeStyle(
    isMindmapNodeStyleCandidate(nodeStyle) ? nodeStyle : undefined,
  );

  const paletteIndex = level % MINDMAP_THEME.nodeColors.length;
  const borderPalette = MINDMAP_THEME.nodeBorderColors ?? [];
  const themeBorder = borderPalette[paletteIndex] ?? DEFAULT_NODE_STYLE.stroke;
  const hydratedStyle: MindmapNodeStyle = {
    ...style,
    fill: style.fill ?? color,
    textColor: style.textColor ?? MINDMAP_THEME.textColor,
    fontStyle: style.fontStyle ?? (level === 0 ? "bold" : "normal"),
    fontSize: style.fontSize ?? (level === 0 ? 18 : 15),
    cornerRadius: style.cornerRadius ?? MINDMAP_THEME.nodeRadius,
    stroke: style.stroke ?? themeBorder,
    strokeWidth: style.strokeWidth ?? (level === 0 ? 2 : 1.5),
    shadowColor: style.shadowColor ?? MINDMAP_THEME.shadow.color,
    shadowBlur: style.shadowBlur ?? MINDMAP_THEME.shadow.blur,
    shadowOffsetX: style.shadowOffsetX ?? MINDMAP_THEME.shadow.offsetX,
    shadowOffsetY: style.shadowOffsetY ?? MINDMAP_THEME.shadow.offsetY,
  };

  const existingTextWidth =
    mindmapElement.textWidth ?? mindmapElement.data?.textWidth;
  const existingTextHeight =
    mindmapElement.textHeight ?? mindmapElement.data?.textHeight;
  const existingWidth = element.width ?? mindmapElement.data?.width;
  const existingHeight = element.height ?? mindmapElement.data?.height;

  let textWidth: number;
  let textHeight: number;
  let width: number;
  let height: number;

  if (existingTextWidth && existingTextHeight) {
    textWidth = existingTextWidth;
    textHeight = existingTextHeight;
    width =
      existingWidth ??
      Math.max(textWidth + hydratedStyle.paddingX * 2, MINDMAP_CONFIG.minNodeWidth);
    height =
      existingHeight ??
      Math.max(textHeight + hydratedStyle.paddingY * 2, MINDMAP_CONFIG.minNodeHeight);
  } else {
    const metrics = measureMindmapLabel(
      mindmapElement.text ?? mindmapElement.data?.text ?? MINDMAP_CONFIG.defaultText,
      hydratedStyle,
    );
    textWidth = metrics.width;
    textHeight = metrics.height;
    width = Math.max(textWidth + hydratedStyle.paddingX * 2, MINDMAP_CONFIG.minNodeWidth);
    height = Math.max(textHeight + hydratedStyle.paddingY * 2, MINDMAP_CONFIG.minNodeHeight);
  }

  return {
    id: element.id,
    type: "mindmap-node",
    x: element.x ?? 0,
    y: element.y ?? 0,
    width,
    height,
    text:
      mindmapElement.text ??
      mindmapElement.data?.text ??
      MINDMAP_CONFIG.defaultText,
    style: hydratedStyle,
    parentId: mindmapElement.parentId ?? mindmapElement.data?.parentId ?? null,
    textWidth,
    textHeight,
    level,
    color,
  };
}

function toMindmapEdge(element: CanvasElement): MindmapEdgeElement | null {
  if (element.type !== "mindmap-edge") return null;

  const mindmapElement = element as MindmapCanvasElement;
  const branchStyle = mindmapElement.style ?? mindmapElement.data?.style;
  const rawStyle = mergeBranchStyle(
    isBranchStyleCandidate(branchStyle) ? branchStyle : undefined,
  );
  const hydratedStyle: BranchStyle = {
    ...rawStyle,
    color: rawStyle.color ?? MINDMAP_THEME.branchColors[0],
  };

  const result: MindmapEdgeElement = {
    id: element.id,
    type: "mindmap-edge",
    x: 0,
    y: 0,
    fromId: mindmapElement.fromId ?? mindmapElement.data?.fromId ?? "",
    toId: mindmapElement.toId ?? mindmapElement.data?.toId ?? "",
    style: hydratedStyle,
  };

  return result;
}

function isMindmapNodeStyleCandidate(
  style: MindmapNodeStyle | BranchStyle | undefined,
): style is MindmapNodeStyle {
  return !!style && typeof (style as MindmapNodeStyle).fill !== "undefined";
}

function isBranchStyleCandidate(
  style: MindmapNodeStyle | BranchStyle | undefined,
): style is BranchStyle {
  return !!style && typeof (style as BranchStyle).color !== "undefined";
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
