// Shape renderer module for rendering basic shapes (rectangle, circle, triangle)
import Konva from "konva";
import { getWorldViewportBounds } from "../../utils/viewBounds";
import type { ModuleRendererCtx, RendererModule } from "../index";
import { StoreActions } from "../../stores/facade";
import type { useUnifiedCanvasStore } from "../../stores/unifiedCanvasStore";
import {
  computeShapeInnerBox,
  type BaseShape,
} from "../../utils/text/computeShapeInnerBox";
import { getTextConfig } from "../../constants/TextConstants";
import type { Bounds } from "../../../../../types/index";

// Extended shape data interface
interface ShapeDataWithExtras {
  text?: string;
  padding?: number;
  radius?: number;
  textLineHeight?: number;
}

type Id = string;

// Safety limits to prevent extreme dimensions
const MAX_DIMENSION = 5000;
const MIN_DIMENSION = 1;

const INDEX_QUERY_PADDING = 256;
const GEOMETRY_PADDING = 128;
const FALLBACK_FULL_SCAN_LIMIT = 200;

interface ShapeTextAttachment {
  text: Konva.Text;
  primaryNode: Konva.Group | Konva.Text;
  container?: Konva.Group;
}

interface ShapeElement {
  id: Id;
  type: "rectangle" | "circle" | "triangle" | "ellipse";
  x: number;
  y: number;
  width?: number;
  height?: number;
  style?: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    fontSize?: number;
    fontFamily?: string;
    textAlign?: "left" | "center" | "right";
  };
  data?: {
    text?: string;
    padding?: number;
    radius?: number; // Circle radius stored in data
  };
  textColor?: string;
  rotation?: number;
}

type StoreState = ReturnType<ModuleRendererCtx["store"]["getState"]>;

export class ShapeRenderer implements RendererModule {
  private readonly shapeNodes = new Map<Id, Konva.Shape>();
  private readonly textNodes = new Map<Id, ShapeTextAttachment>(); // Track text nodes for shapes
  private layer?: Konva.Layer;
  private unsubscribe?: () => void;
  private viewportUnsubscribe?: () => void;
  private store?: typeof useUnifiedCanvasStore;
  private shapesById = new Map<Id, ShapeElement>();
  private visibleIds = new Set<Id>();
  private visibilityScheduled = false;
  private visibilityRaf?: number;
  private visibilityTimeout?: ReturnType<typeof setTimeout>;

  mount(ctx: ModuleRendererCtx): () => void {
    this.layer = ctx.layers.main;
    this.store = ctx.store;

    // Seed local cache before subscriptions start firing
    const initialState = ctx.store.getState();
    const initialShapes = new Map<Id, ShapeElement>();
    for (const [id, element] of initialState.elements.entries()) {
      if (
        element.type === "rectangle" ||
        element.type === "circle" ||
        element.type === "triangle" ||
        element.type === "ellipse"
      ) {
        initialShapes.set(id, element as ShapeElement);
      }
    }
    this.shapesById = initialShapes;

    // Subscribe to store changes - watch shape elements AND selectedTool
    this.unsubscribe = ctx.store.subscribe(
      // Selector: extract shape elements AND selectedTool (for draggable state)
      (state) => {
        const shapes = new Map<Id, ShapeElement>();
        for (const [id, element] of state.elements.entries()) {
          if (
            element.type === "rectangle" ||
            element.type === "circle" ||
            element.type === "triangle" ||
            element.type === "ellipse"
          ) {
            shapes.set(id, element as ShapeElement);
          }
        }
        // CRITICAL FIX: Include selectedTool so draggable state updates when tool changes
        return { shapes, selectedTool: state.ui?.selectedTool };
      },
      // Callback: reconcile changes (extract shapes from returned object)
      (payload) => this.handleStateUpdate(payload),
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
    for (const node of this.shapeNodes.values()) {
      node.destroy();
    }
    this.shapeNodes.clear();

    // Clean up text nodes
    for (const attachment of this.textNodes.values()) {
      attachment.primaryNode.destroy();
    }
    this.textNodes.clear();

    if (this.layer) {
      this.layer.batchDraw();
    }
  }

  private handleStateUpdate({
    shapes,
  }: {
    shapes: Map<Id, ShapeElement>;
    selectedTool?: string;
  }) {
    this.shapesById = shapes;
    this.pruneRemovedNodes(shapes);
    this.requestVisibilityUpdate();
  }

  private pruneRemovedNodes(shapes: Map<Id, ShapeElement>) {
    for (const [id, node] of Array.from(this.shapeNodes.entries())) {
      if (shapes.has(id)) {
        continue;
      }
      node.destroy();
      this.shapeNodes.delete(id);
      const attachment = this.textNodes.get(id);
      if (attachment) {
        attachment.primaryNode.destroy();
        this.textNodes.delete(id);
      }
      this.visibleIds.delete(id);
    }

    for (const [id, attachment] of Array.from(this.textNodes.entries())) {
      if (shapes.has(id)) {
        continue;
      }
      attachment.primaryNode.destroy();
      this.textNodes.delete(id);
      this.visibleIds.delete(id);
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
      this.updateVisibleShapes();
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

  private updateVisibleShapes() {
    if (!this.layer) {
      return;
    }

    const stage = this.layer.getStage();
    const storeState = this.store?.getState?.() as StoreState | undefined;
    if (!stage || !storeState) {
      return;
    }

    const nextVisible = this.computeVisibleIds(stage, storeState);

    for (const id of nextVisible) {
      const shape = this.shapesById.get(id);
      if (!shape) {
        continue;
      }
      this.ensureShapeNode(shape);
    }

    for (const [id, node] of this.shapeNodes) {
      const shouldBeVisible = nextVisible.has(id);
      node.visible(shouldBeVisible);
      node.listening(shouldBeVisible);
      if (!shouldBeVisible) {
        const attachment = this.textNodes.get(id);
        if (attachment) {
          attachment.primaryNode.visible(false);
        }
      }
    }

    this.visibleIds = nextVisible;
    this.layer.batchDraw();
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
          if (this.shapesById.has(id as Id)) {
            candidateIds.add(id as Id);
          }
        }
      }
    } catch {
      // Fallback covered below
    }

    for (const id of this.visibleIds) {
      if (this.shapesById.has(id)) {
        candidateIds.add(id);
      }
    }

    const selectedIds = storeState.selectedElementIds;
    if (selectedIds) {
      for (const id of selectedIds) {
        if (this.shapesById.has(id as Id)) {
          candidateIds.add(id as Id);
        }
      }
    }

    if (candidateIds.size === 0) {
      const stats = storeState.spatialIndex?.getStats?.();
      if (!stats || stats.itemCount === 0 || this.shapesById.size <= FALLBACK_FULL_SCAN_LIMIT) {
        for (const id of this.shapesById.keys()) {
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
      const shape = this.shapesById.get(id);
      if (!shape) {
        continue;
      }

      const bounds =
        geometryApi?.getElementBounds?.(id) ?? this.deriveBoundsFromShape(shape);
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

  private ensureShapeNode(shape: ShapeElement) {
    if (!this.layer) {
      return;
    }

    let node = this.shapeNodes.get(shape.id);

    if (!node) {
      node = this.createShapeNode(shape);
      if (!node) {
        return;
      }

      node.on("click", (e) => {
        e.cancelBubble = true;
        StoreActions.selectSingle(shape.id);
      });

      node.on("tap", (e) => {
        e.cancelBubble = true;
        StoreActions.selectSingle(shape.id);
      });

      node.on("dblclick", (e) => {
        e.cancelBubble = true;
        const stageRef = this.layer?.getStage();
        if (stageRef) {
          void import("../../utils/editors/openShapeTextEditor")
            .then(({ openShapeTextEditor }) => {
              openShapeTextEditor(stageRef, shape.id);
            })
            .catch(() => {
              // noop
            });
        }
      });

      node.on("dbltap", (e) => {
        e.cancelBubble = true;
        const stageRef = this.layer?.getStage();
        if (stageRef) {
          void import("../../utils/editors/openShapeTextEditor")
            .then(({ openShapeTextEditor }) => {
              openShapeTextEditor(stageRef, shape.id);
            })
            .catch(() => {
              // noop
            });
        }
      });

      node.on("dragend", (e) => {
        const shapeNode = e.target as Konva.Shape;
        const nx = shapeNode.x();
        const ny = shapeNode.y();

        try {
          StoreActions.updateElement(shape.id, { x: nx, y: ny });
        } catch {
          // noop
        }
      });

      this.shapeNodes.set(shape.id, node);
      this.layer.add(node);
    } else {
      this.updateShapeNode(node, shape);
    }

    this.attachLiveDragUpdate(node, shape.id);
    node.visible(true);
    node.listening(true);

    this.handleShapeText(shape, shape.id);
  }

  private deriveBoundsFromShape(shape: ShapeElement): Bounds | null {
    const radius = shape.data?.radius ?? 0;
    const width = typeof shape.width === "number" ? shape.width : radius * 2;
    const height = typeof shape.height === "number" ? shape.height : radius * 2;

    if (!isFinite(width) || !isFinite(height)) {
      return null;
    }

    return {
      x: typeof shape.x === "number" ? shape.x : 0,
      y: typeof shape.y === "number" ? shape.y : 0,
      width: Math.max(0, width),
      height: Math.max(0, height),
    } satisfies Bounds;
  }

  private attachLiveDragUpdate(node: Konva.Shape, id: string) {
    let ticking = false;
    node.off("dragmove.live-update");
    node.on("dragmove.live-update", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        try {
          const s = this.store?.getState?.();
          s?.updateElement?.(
            id,
            { x: Math.round(node.x()), y: Math.round(node.y()) },
            { pushHistory: false },
          );
        } catch (error) {
          // Ignore error
        }
      });
    });
  }

  private createShapeNode(shape: ShapeElement): Konva.Shape | undefined {
    // Apply safety limits to dimensions
    const safeWidth = Math.max(
      MIN_DIMENSION,
      Math.min(MAX_DIMENSION, shape.width || 100),
    );
    const safeHeight = Math.max(
      MIN_DIMENSION,
      Math.min(MAX_DIMENSION, shape.height || 100),
    );

    // Check if pan tool is active - if so, disable dragging on elements
    const storeState = this.store?.getState();
    const isPanToolActive = storeState?.ui?.selectedTool === "pan";

    const commonAttrs = {
      id: shape.id,
      x: shape.x,
      y: shape.y,
      fill: shape.style?.fill || "#E5E7EB",
      stroke: shape.style?.stroke || "#6B7280",
      strokeWidth: shape.style?.strokeWidth || 2,
      opacity: shape.style?.opacity || 1,
      rotation: shape.rotation || 0,
      listening: true,
      draggable: !isPanToolActive, // disable dragging when pan tool is active
    };

    switch (shape.type) {
      case "rectangle": {
        const rectNode = new Konva.Rect({
          ...commonAttrs,
          width: safeWidth,
          height: safeHeight,
        });
        rectNode.setAttr("elementType", "rectangle");
        rectNode.setAttr("shapeType", "rectangle");
        rectNode.setAttr("nodeType", "shape");
        return rectNode;
      }

      case "circle": {
        const radiusX = safeWidth / 2;
        const radiusY = safeHeight / 2;

        const ellipseNode = new Konva.Ellipse({
          ...commonAttrs,
          radiusX,
          radiusY,
        });

        // CRITICAL FIX: Set elementType attribute for circle detection in AnchorSnapping
        ellipseNode.setAttr("elementType", "circle");
        ellipseNode.setAttr("shapeType", "circle");
        ellipseNode.setAttr("nodeType", "shape");

        ellipseNode.on("dragmove.text-follow", () =>
          this.syncTextFollower(shape.id, ellipseNode),
        );

        return ellipseNode;
      }

      case "ellipse": {
        const ellipseNode = new Konva.Ellipse({
          ...commonAttrs,
          radiusX: safeWidth / 2,
          radiusY: safeHeight / 2,
        });

        // CRITICAL FIX: Set elementType attribute for ellipse detection in AnchorSnapping
        ellipseNode.setAttr("elementType", "ellipse");
        ellipseNode.setAttr("shapeType", "ellipse");
        ellipseNode.setAttr("nodeType", "shape");

        ellipseNode.on("dragmove.text-follow", () =>
          this.syncTextFollower(shape.id, ellipseNode),
        );

        return ellipseNode;
      }

      case "triangle": {
        // Create isosceles triangle using Shape with sceneFunc for proper geometry
        // This prevents deformation during resize and provides accurate bounds
        const triangleShape = new Konva.Shape({
          ...commonAttrs,
          width: safeWidth,
          height: safeHeight,
          sceneFunc: function (context, shape) {
            // Get current dimensions from the shape attributes
            const w = shape.width();
            const h = shape.height();

            // Draw isosceles triangle with proper geometry
            context.beginPath();
            context.moveTo(w / 2, 0); // top center
            context.lineTo(0, h); // bottom left
            context.lineTo(w, h); // bottom right
            context.closePath();

            // Fill and stroke the shape
            context.fillStrokeShape(shape);
          },
        });

        triangleShape.on("dragmove.text-follow", () =>
          this.syncTextFollower(shape.id, triangleShape),
        );

        // Set attributes for selection categorization
        triangleShape.setAttr("elementType", "triangle");
        triangleShape.setAttr("shapeType", "triangle");
        triangleShape.setAttr("nodeType", "shape");

        return triangleShape;
      }

      default:
        return undefined;
    }
  }

  private updateShapeNode(node: Konva.Shape, shape: ShapeElement) {
    // Apply safety limits to dimensions
    const safeWidth = Math.max(
      MIN_DIMENSION,
      Math.min(MAX_DIMENSION, shape.width || 100),
    );
    const safeHeight = Math.max(
      MIN_DIMENSION,
      Math.min(MAX_DIMENSION, shape.height || 100),
    );

    // Check if pan tool is active - if so, disable dragging on elements
    const storeState = this.store?.getState();
    const isPanToolActive = storeState?.ui?.selectedTool === "pan";

    const commonAttrs = {
      x: shape.x,
      y: shape.y,
      fill: shape.style?.fill || "#E5E7EB",
      stroke: shape.style?.stroke || "#6B7280",
      strokeWidth: shape.style?.strokeWidth || 2,
      opacity: shape.style?.opacity || 1,
      rotation: shape.rotation || 0,
      draggable: !isPanToolActive, // update draggable when tool changes
    };

    if (shape.type === "rectangle" && node instanceof Konva.Rect) {
      node.setAttrs({
        ...commonAttrs,
        width: safeWidth,
        height: safeHeight,
      });

      node.off("dragmove.text-follow");
      node.on("dragmove.text-follow", () =>
        this.syncTextFollower(shape.id, node),
      );
    } else if (
      (shape.type === "circle" || shape.type === "ellipse") &&
      node instanceof Konva.Ellipse
    ) {
      const radiusX = safeWidth / 2;
      const radiusY = safeHeight / 2;

      node.setAttrs({
        ...commonAttrs,
        radiusX,
        radiusY,
      });

      node.off("dragmove.text-follow");
      node.on("dragmove.text-follow", () =>
        this.syncTextFollower(shape.id, node),
      );
    } else if (shape.type === "triangle" && node instanceof Konva.Shape) {
      // Update triangle dimensions - sceneFunc will automatically recalculate geometry
      node.setAttrs({
        ...commonAttrs,
        width: safeWidth,
        height: safeHeight,
      });

      node.off("dragmove.text-follow");
      node.on("dragmove.text-follow", () =>
        this.syncTextFollower(shape.id, node),
      );
    }
  }

  private handleShapeText(shape: ShapeElement, id: Id) {
    const hasText = shape.data?.text && shape.data.text.trim().length > 0;
    const isTextEditableShape =
      shape.type === "rectangle" ||
      shape.type === "circle" ||
      shape.type === "triangle";

    if (isTextEditableShape) {
      let attachment = this.textNodes.get(id);

      if (!attachment) {
        attachment = this.createShapeTextAttachment(shape, !hasText); // Pass isEmpty flag
        if (attachment) {
          this.textNodes.set(id, attachment);
          this.layer?.add(attachment.primaryNode);
        }
      } else {
        this.updateShapeTextAttachment(attachment, shape, !hasText); // Pass isEmpty flag
      }
    } else {
      const existingTextNode = this.textNodes.get(id);
      if (existingTextNode) {
        existingTextNode.primaryNode.destroy();
        this.textNodes.delete(id);
      }
    }
  }

  private createShapeTextAttachment(
    shape: ShapeElement,
    isEmpty?: boolean,
  ): ShapeTextAttachment | undefined {
    if (!this.layer) return undefined;

    try {
      // Apply consistent text styling based on shape type
      const textConfig = getTextConfig(
        shape.type === "circle" ? "CIRCLE" : "SHAPE",
      );
      const fontSize = shape.style?.fontSize ?? textConfig.fontSize;
      const fontFamily = shape.style?.fontFamily || textConfig.fontFamily;
      const textColor = shape.textColor || "#111827";
      const padding = shape.data?.padding ?? (shape.type === "circle" ? 0 : 8);
      const lineHeight =
        (shape.data as ShapeDataWithExtras)?.textLineHeight ?? 1.25;

      const innerBox = computeShapeInnerBox(shape as BaseShape, padding);
      const textContent = shape.data?.text || ""; // Allow empty text
      const textNode = new Konva.Text({
        id: `${shape.id}-text`,
        name: `shape-text-${shape.id}`,
        x: innerBox.x,
        y: innerBox.y,
        width: innerBox.width,
        height: innerBox.height,
        text: textContent,
        fontSize,
        fontFamily,
        fill: textColor,
        align: "center",
        verticalAlign: "middle",
        lineHeight,
        wrap: "word",
        listening: false,
        perfectDrawEnabled: false,
        shadowForStrokeEnabled: false,
        visible: !isEmpty,
      });

      textNode.setAttr("elementId", shape.id);
      textNode.setAttr("nodeType", "shape-text");

      const primaryNode: Konva.Group | Konva.Text = textNode;

      const relativeDX = primaryNode.x() - shape.x;
      const relativeDY = primaryNode.y() - shape.y;
      primaryNode.setAttr("relativeDX", relativeDX);
      primaryNode.setAttr("relativeDY", relativeDY);
      primaryNode.setAttr("elementId", shape.id);
      primaryNode.setAttr("nodeType", "shape-text-root");

      return { text: textNode, primaryNode };
    } catch (error) {
      return undefined;
    }
  }

  private updateShapeTextAttachment(
    attachment: ShapeTextAttachment,
    shape: ShapeElement,
    isEmpty?: boolean,
  ) {
    try {
      // Apply consistent text styling based on shape type
      const textConfig = getTextConfig(
        shape.type === "circle" ? "CIRCLE" : "SHAPE",
      );
      const fontSize = shape.style?.fontSize ?? textConfig.fontSize;
      const fontFamily = shape.style?.fontFamily || textConfig.fontFamily;
      const textColor = shape.textColor || "#111827";
      const padding = shape.data?.padding ?? (shape.type === "circle" ? 0 : 8);
      const lineHeight =
        (shape.data as ShapeDataWithExtras)?.textLineHeight ?? 1.25;

      const innerBox = computeShapeInnerBox(shape as BaseShape, padding);
      const { text: textNode, primaryNode } = attachment;
      const textContent = shape.data?.text || ""; // Allow empty text

      textNode.setAttrs({
        x: innerBox.x,
        y: innerBox.y,
        width: innerBox.width,
        height: innerBox.height,
        text: textContent,
        fontSize,
        fontFamily,
        fill: textColor,
        align: "center",
        verticalAlign: "middle",
        lineHeight,
        visible: !isEmpty,
      });

      const relativeDX = primaryNode.x() - shape.x;
      const relativeDY = primaryNode.y() - shape.y;
      primaryNode.setAttr("relativeDX", relativeDX);
      primaryNode.setAttr("relativeDY", relativeDY);
    } catch (error) {
      // Ignore error
    }
  }

  private syncTextFollower(id: Id, node: Konva.Shape) {
    const attachment = this.textNodes.get(id);
    if (!attachment) return;

    const dx = attachment.primaryNode.getAttr("relativeDX");
    const dy = attachment.primaryNode.getAttr("relativeDY");

    if (typeof dx !== "number" || typeof dy !== "number") return;

    attachment.primaryNode.position({ x: node.x() + dx, y: node.y() + dy });
    attachment.primaryNode.getLayer()?.batchDraw();
  }

  /**
   * CRITICAL FIX: Synchronize text positioning during transform operations
   * This method is called during real-time transforms to keep text properly positioned
   */
  public syncTextDuringTransform(elementId: Id) {
    const attachment = this.textNodes.get(elementId);
    if (!attachment || !this.store) return;

    // Get the current element data from store
    const store = this.store.getState();
    const element = store.elements.get(elementId) as ShapeElement | undefined;
    if (!element) return;

    // Find the corresponding Konva shape node
    const shapeNode = this.shapeNodes.get(elementId);
    if (!shapeNode) return;

    try {
      // CRITICAL FIX: Calculate visual dimensions directly from node properties during transform
      // Don't use getClientRect during transform as it can be inaccurate
      const nodePos = shapeNode.position();
      const nodeSize = shapeNode.size();
      const nodeScale = shapeNode.scale();
      const nodeRotation = shapeNode.rotation();

      // Calculate actual visual dimensions accounting for scale
      const scaleX = Math.abs(nodeScale?.x ?? 1);
      const scaleY = Math.abs(nodeScale?.y ?? 1);
      const visualWidth = nodeSize.width * scaleX;
      const visualHeight = nodeSize.height * scaleY;

      // Create a temporary shape element with current visual dimensions
      const visualElement: ShapeElement = {
        ...element,
        x: nodePos.x,
        y: nodePos.y,
        width: visualWidth,
        height: visualHeight,
        rotation: nodeRotation,
      };

      // Apply consistent text styling and positioning
      const padding =
        element.data?.padding ?? (element.type === "circle" ? 0 : 8);
      const innerBox = computeShapeInnerBox(
        visualElement as BaseShape,
        padding,
      );

      // CRITICAL FIX: For circles/ellipses, ensure text stays perfectly centered
      if (element.type === "circle" || element.type === "ellipse") {
        // Calculate center-based positioning for circles to prevent text jumping
        const centerX = nodePos.x;
        const centerY = nodePos.y;
        const textWidth = Math.min(visualWidth * 0.8, innerBox.width); // Leave 20% padding
        const textHeight = Math.min(visualHeight * 0.8, innerBox.height); // Leave 20% padding

        attachment.text.setAttrs({
          x: centerX - textWidth / 2,
          y: centerY - textHeight / 2,
          width: textWidth,
          height: textHeight,
        });
      } else {
        // For rectangles and triangles, use the computed inner box
        attachment.text.setAttrs({
          x: innerBox.x,
          y: innerBox.y,
          width: innerBox.width,
          height: innerBox.height,
        });
      }

      // Update relative positioning for consistent drag behavior
      const relativeDX = attachment.text.x() - visualElement.x;
      const relativeDY = attachment.text.y() - visualElement.y;
      attachment.primaryNode.setAttr("relativeDX", relativeDX);
      attachment.primaryNode.setAttr("relativeDY", relativeDY);

      // Immediately redraw the text layer for smooth visual feedback
      attachment.text.getLayer()?.batchDraw();
    } catch (error) {
      // Ignore error
    }
  }

  /**
   * CRITICAL FIX: Synchronize all text nodes during global transform operations
   * This method can be called to update all shape text positions simultaneously
   */
  public syncAllTextDuringTransform() {
    for (const elementId of this.textNodes.keys()) {
      this.syncTextDuringTransform(elementId);
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
