import type Konva from "konva";
import type { TransformLifecycleCoordinator } from "../controllers/TransformLifecycleCoordinator";
import {
  filterTransformableNodes,
  resolveElementsToNodes,
} from "../SelectionResolver";
import { transformStateManager } from "./TransformStateManager";

export interface TransformerSelectionManagerConfig {
  transformLifecycle: TransformLifecycleCoordinator;
  getStage: () => Konva.Stage | null;
  getLayers: () => Array<Konva.Container | null | undefined>;
  debug?: (message: string, data?: unknown) => void;
}

export interface TransformerAttachOptions {
  delay?: number;
}

export class TransformerSelectionManager {
  private pendingTimer?: ReturnType<typeof setTimeout>;

  constructor(private readonly config: TransformerSelectionManagerConfig) {}

  scheduleAttach(selectedIds: Set<string>, options: TransformerAttachOptions = {}): void {
    this.clearPending();

    if (selectedIds.size === 0) {
      this.detachTransformer();
      return;
    }

    const delay = options.delay ?? 75;

    this.pendingTimer = setTimeout(() => {
      this.pendingTimer = undefined;
      this.attachNow(selectedIds);
    }, delay);
  }

  refresh(selectedIds: Set<string>, options: TransformerAttachOptions = {}): void {
    this.clearPending();

    if (selectedIds.size === 0) {
      this.detachTransformer();
      return;
    }

    // Default to a shorter delay when refreshing after geometry changes
    const delay = options.delay ?? 50;

    this.pendingTimer = setTimeout(() => {
      this.pendingTimer = undefined;
      this.attachNow(selectedIds);
    }, delay);
  }

  attachImmediately(selectedIds: Set<string>): void {
    this.clearPending();

    if (selectedIds.size === 0) {
      this.detachTransformer();
      return;
    }

    this.attachNow(selectedIds);
  }

  detach(): void {
    this.clearPending();
    this.detachTransformer();
  }

  cancelPending(): void {
    this.clearPending();
  }

  destroy(): void {
    this.detach();
  }

  private attachNow(selectedIds: Set<string>): void {
    const stage = this.config.getStage();
    const layers = this.config.getLayers();

    if (!stage && (!layers || layers.length === 0)) {
      this.detachTransformer();
      return;
    }

    const selectionSnapshot = new Set(selectedIds);

    const rawNodes = resolveElementsToNodes({
      stage,
      layers,
      elementIds: selectionSnapshot,
    });
    const nodes = filterTransformableNodes(rawNodes, this.config.debug);

    this.config.debug?.("Resolved nodes for transformer", {
      requestedIds: Array.from(selectionSnapshot),
      raw: rawNodes.map((node) => ({
        id: node.getAttr("elementId") || node.id(),
        name: node.name(),
        nodeType: node.getAttr("nodeType"),
        elementType: node.getAttr("elementType"),
      })),
      filtered: nodes.map((node) => ({
        id: node.getAttr("elementId") || node.id(),
        name: node.name(),
        nodeType: node.getAttr("nodeType"),
        elementType: node.getAttr("elementType"),
      })),
    });

    if (nodes.length === 0) {
      this.detachTransformer();
      return;
    }

    this.config.transformLifecycle.detach();
    this.config.transformLifecycle.attach(nodes);

    const lockAspect = transformStateManager.shouldLockAspectRatio(selectionSnapshot);
    this.config.transformLifecycle.setKeepRatio(lockAspect);
    this.config.transformLifecycle.show();

    // Ensure the transformer is visible after Konva updates
    setTimeout(() => {
      this.config.transformLifecycle.ensureVisible();
    }, 10);
  }

  private clearPending(): void {
    if (this.pendingTimer) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = undefined;
    }
  }

  private detachTransformer(): void {
    this.config.transformLifecycle.setKeepRatio(false);
    this.config.transformLifecycle.detach();
  }
}
