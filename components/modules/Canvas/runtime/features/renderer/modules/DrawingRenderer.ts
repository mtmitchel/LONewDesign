// Drawing renderer module for rendering pen, marker, and highlighter paths
import Konva from "konva";
import { getWorldViewportBounds } from "../../utils/viewBounds";
import type { ModuleRendererCtx, RendererModule } from "../index";

type Id = string;

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

  mount(ctx: ModuleRendererCtx): () => void {
    this.mainLayer = ctx.layers.main;
    this.highlighterGroup = ctx.layers.highlighter;

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
      (drawings) => this.reconcile(drawings),
    );

    // Initial render
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
    this.reconcile(initialDrawings);

    // Return cleanup function
    return () => this.unmount();
  }

  private unmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    for (const node of this.drawingNodes.values()) {
      node.destroy();
    }
    this.drawingNodes.clear();
    if (this.mainLayer) {
      this.mainLayer.batchDraw();
    }
    this.highlighterGroup?.getLayer()?.batchDraw();
  }

  private reconcile(drawings: Map<Id, DrawingElement>) {
    if (!this.mainLayer || !this.highlighterGroup) return;

    const seen = new Set<Id>();
    const highlighterLayer = this.highlighterGroup.getLayer();
    const stage = this.mainLayer.getStage();
    const viewBounds = stage ? getWorldViewportBounds(stage) : null;

    // Add/update drawing elements
    for (const [id, drawing] of drawings) {
      seen.add(id);
      const existingNode = this.drawingNodes.get(id);

      if (viewBounds && drawing.points.length >= 2) {
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
        const isOffscreen =
          maxX < viewBounds.minX ||
          maxY < viewBounds.minY ||
          minX > viewBounds.maxX ||
          minY > viewBounds.maxY;

        if (isOffscreen) {
          existingNode?.visible(false);
          continue;
        }
      }
      const needsHighlighterGroup =
        drawing.subtype === "highlighter" || drawing.subtype === "marker";
      let node = existingNode;

      if (!node) {
        node = this.createDrawingNode(drawing);
        this.drawingNodes.set(id, node);
        if (needsHighlighterGroup) {
          this.highlighterGroup.add(node);
        } else {
          this.mainLayer.add(node);
        }
      } else {
        this.updateDrawingNode(node, drawing);
        const parent = node.getParent();
        if (needsHighlighterGroup && parent !== this.highlighterGroup) {
          this.highlighterGroup.add(node);
        } else if (!needsHighlighterGroup && parent !== this.mainLayer) {
          this.mainLayer.add(node);
        }
        if (!node.visible()) {
          node.visible(true);
        }
      }

    }

    // Remove deleted drawing elements
    for (const [id, node] of this.drawingNodes) {
      if (!seen.has(id)) {
        node.destroy();
        this.drawingNodes.delete(id);
      }
    }

    this.mainLayer.batchDraw();
    highlighterLayer?.batchDraw();
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
