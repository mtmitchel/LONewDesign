import type Konva from "konva";
import type { TransformerManager } from "../../../../managers/TransformerManager";

type TransformSource = "drag" | "transform";

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TransformLifecycleEvents {
  onBegin: (nodes: Konva.Node[], source: TransformSource) => void;
  onProgress: (nodes: Konva.Node[], source: TransformSource) => void;
  onEnd: (nodes: Konva.Node[], source: TransformSource) => void;
}

export class TransformLifecycleCoordinator {
  private readonly dragMonitoredNodes = new Set<Konva.Node>();
  private dragSessionActive = false;
  private getSelectionBounds?: () => Bounds | null;

  constructor(
    private readonly transformerManager: TransformerManager,
    private readonly events: TransformLifecycleEvents,
    private readonly debug?: (message: string, data?: unknown) => void,
  ) {}

  /**
   * Provide a function that returns canonical selection bounds from the store.
   * When set, getTransformerRect() will prefer these bounds over Konva's transformer client rect.
   */
  setSelectionBoundsProvider(provider: (() => Bounds | null) | undefined) {
    this.getSelectionBounds = provider;
  }

  attach(nodes: Konva.Node[]) {
    this.detachDragHandlers();
    this.transformerManager.detach();

    if (nodes.length === 0) {
      return;
    }

    this.transformerManager.attachToNodes(nodes);
    this.attachDragHandlers(nodes);
  }

  detach() {
    this.detachDragHandlers();
    this.transformerManager.detach();
  }

  getTransformer(): Konva.Transformer | null {
    return this.transformerManager.getTransformer();
  }

  getTransformerRect(): Bounds | null {
    // Prefer canonical selector-based bounds when available
    if (this.getSelectionBounds) {
      const bounds = this.getSelectionBounds();
      if (bounds) return bounds;
    }
    // Fallback to Konva transformer client rect
    const transformer = this.getTransformer();
    return transformer ? transformer.getClientRect() : null;
  }

  refresh() {
    this.transformerManager.refresh();
  }

  setKeepRatio(keep: boolean) {
    this.transformerManager.setKeepRatio(keep);
  }

  show() {
    this.transformerManager.show();
  }

  ensureVisible() {
    const transformer = this.transformerManager.getTransformer();
    if (transformer && !transformer.visible()) {
      transformer.visible(true);
      transformer.getLayer()?.batchDraw();
    }
  }

  handleTransformStart = (nodes: Konva.Node[]) => {
    this.events.onBegin(nodes, "transform");
  };

  handleTransformProgress = (nodes: Konva.Node[]) => {
    this.events.onProgress(nodes, "transform");
  };

  handleTransformEnd = (nodes: Konva.Node[]) => {
    this.events.onEnd(nodes, "transform");
  };

  private attachDragHandlers(nodes: Konva.Node[]) {
    nodes.forEach((node) => {
      try {
        node.on("dragstart.selection-transform", this.handleDragStart);
        node.on("dragmove.selection-transform", this.handleDragMove);
        node.on("dragend.selection-transform", this.handleDragEnd);
        node.on("dragcancel.selection-transform", this.handleDragEnd);
        this.dragMonitoredNodes.add(node);
      } catch (error) {
        this.debug?.("attachDragHandlers failed", { error });
      }
    });
  }

  private detachDragHandlers() {
    this.dragMonitoredNodes.forEach((node) => {
      try {
        node.off(".selection-transform");
      } catch (error) {
        this.debug?.("detachDragHandlers failed", { error });
      }
    });
    this.dragMonitoredNodes.clear();
    this.dragSessionActive = false;
  }

  private readonly handleDragStart = () => {
    const nodes = this.transformerManager.getTransformer()?.nodes() ?? [];
    if (nodes.length === 0) {
      return;
    }

    if (!this.dragSessionActive) {
      this.dragSessionActive = true;
      this.events.onBegin(nodes, "drag");
    }
  };

  private readonly handleDragMove = () => {
    if (!this.dragSessionActive) {
      return;
    }
    const nodes = this.transformerManager.getTransformer()?.nodes() ?? [];
    if (nodes.length === 0) {
      return;
    }
    this.events.onProgress(nodes, "drag");
  };

  private readonly handleDragEnd = () => {
    if (!this.dragSessionActive) {
      return;
    }
    this.dragSessionActive = false;
    const nodes = this.transformerManager.getTransformer()?.nodes() ?? [];
    this.events.onEnd(nodes, "drag");
  };
}
