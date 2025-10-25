import type Konva from "konva";
import { batchMindmapReroute } from "../../mindmapWire";
import type { ModuleRendererCtx } from "../../../types";
import type { MindmapSelectionManager } from "./MindmapSelectionManager";
import { mindmapSelectionManager, isMindmapRenderer } from "./MindmapSelectionManager";
import type { ElementSynchronizer } from "./ElementSynchronizer";
import { elementSynchronizer as defaultElementSynchronizer } from "./ElementSynchronizer";

type TransformSource = "drag" | "transform";

export interface MindmapSelectionOrchestratorConfig {
  getStoreContext: () => ModuleRendererCtx | undefined;
  mindmapManager?: MindmapSelectionManager;
  elementSynchronizer?: ElementSynchronizer;
  registerConnectorBaselines?: (ids: Set<string>) => void;
  debug?: (message: string, data?: unknown) => void;
}

/**
 * Centralises mindmap-specific behaviour previously embedded in SelectionModule.
 * Handles descendant bookkeeping during drags, edge visual updates, and reroutes.
 */
export class MindmapSelectionOrchestrator {
  private readonly getStoreContext: () => ModuleRendererCtx | undefined;
  private readonly mindmapManager: MindmapSelectionManager;
  private readonly elementSynchronizer: ElementSynchronizer;
  private readonly registerConnectorBaselines?: (ids: Set<string>) => void;
  private readonly debug?: (message: string, data?: unknown) => void;
  private readonly mindmapDescendantInitialPositions = new Map<string, { x: number; y: number }>();

  constructor(config: MindmapSelectionOrchestratorConfig) {
    this.getStoreContext = config.getStoreContext;
    this.mindmapManager = config.mindmapManager ?? mindmapSelectionManager;
    this.elementSynchronizer = config.elementSynchronizer ?? defaultElementSynchronizer;
    this.registerConnectorBaselines = config.registerConnectorBaselines;
    this.debug = config.debug;
  }

  handleTransformBegin(nodes: Konva.Node[], source: TransformSource): void {
    this.mindmapDescendantInitialPositions.clear();

    if (source !== "drag") {
      return;
    }

    const ctx = this.getStoreContext();
    if (!ctx) {
      return;
    }

    const renderer = this.mindmapManager.getRenderer();
    if (!renderer) {
      return;
    }

    const state = ctx.store.getState();
    const elements = state.elements;
    if (!elements) {
      return;
    }

    const connectorBaselineCandidates = new Set<string>();

    nodes.forEach((node) => {
      const id = node.id();
      const element = elements.get(id);

      if (element?.type !== "mindmap-node") {
        return;
      }

      connectorBaselineCandidates.add(id);

      const descendants = renderer.getAllDescendants?.(id);
      if (!descendants) {
        return;
      }

      descendants.forEach((descendantId: string) => {
        const descendantGroup = renderer.getNodeGroup?.(descendantId);
        if (!descendantGroup) {
          return;
        }

        this.mindmapDescendantInitialPositions.set(descendantId, {
          x: descendantGroup.x(),
          y: descendantGroup.y(),
        });
        connectorBaselineCandidates.add(descendantId);
      });
    });

    if (connectorBaselineCandidates.size > 0) {
      this.registerConnectorBaselines?.(connectorBaselineCandidates);
    }
  }

  handleTransformProgress(
    nodes: Konva.Node[],
    source: TransformSource,
    delta: { dx: number; dy: number } | null,
  ): void {
    if (!delta) {
      return;
    }

    this.mindmapManager.updateEdgeVisuals(delta);

    if (source !== "drag") {
      return;
    }

    const ctx = this.getStoreContext();
    if (!ctx) {
      return;
    }

    const state = ctx.store.getState();
    const elements = state.elements;
    if (!elements) {
      return;
    }

    const mindmapNodeIds = nodes
      .map((node) => node.id())
      .filter((id) => elements.get(id)?.type === "mindmap-node");

    if (mindmapNodeIds.length === 0) {
      return;
    }

    const connectorBaselineCandidates = new Set<string>(mindmapNodeIds);

    const renderer = this.mindmapManager.getRenderer();

    this.mindmapManager.moveMindmapDescendants(
      mindmapNodeIds,
      delta,
      this.mindmapDescendantInitialPositions,
    );

    if (!renderer) {
      if (connectorBaselineCandidates.size > 0) {
        this.registerConnectorBaselines?.(connectorBaselineCandidates);
      }
      return;
    }

    const nodesToSync = new Set<Konva.Node>();

    mindmapNodeIds.forEach((nodeId) => {
      const descendants = renderer.getAllDescendants?.(nodeId);
      if (!descendants || descendants.size === 0) {
        return;
      }

      descendants.forEach((descendantId: string) => {
        const descendantGroup = renderer.getNodeGroup?.(descendantId);
        if (descendantGroup) {
          nodesToSync.add(descendantGroup);
        }
        connectorBaselineCandidates.add(descendantId);
      });
    });

    if (nodesToSync.size > 0) {
      this.elementSynchronizer.updateElementsFromNodes(
        Array.from(nodesToSync),
        source,
        {
          pushHistory: false,
          batchUpdates: true,
          skipConnectorScheduling: true,
          transformDelta: delta,
        },
      );
    }

    if (connectorBaselineCandidates.size > 0) {
      this.registerConnectorBaselines?.(connectorBaselineCandidates);
    }
  }

  handleTransformEnd(params: {
    nodes: Konva.Node[];
    nonConnectorNodes: Konva.Node[];
    source: TransformSource;
  }): boolean {
    const { nodes, nonConnectorNodes, source } = params;

    const shouldHandleMindmap = source === "drag" && nonConnectorNodes.length > 0;
    if (!shouldHandleMindmap) {
      this.mindmapDescendantInitialPositions.clear();
      return false;
    }

    const ctx = this.getStoreContext();
    if (!ctx) {
      this.mindmapDescendantInitialPositions.clear();
      return false;
    }

    const state = ctx.store.getState();
    const elements = state.elements;
    if (!elements) {
      this.mindmapDescendantInitialPositions.clear();
      return false;
    }

    const mindmapNodes = nonConnectorNodes.filter((node) => {
      const element = elements.get(node.id());
      return element?.type === "mindmap-node";
    });

    if (mindmapNodes.length === 0) {
      this.mindmapDescendantInitialPositions.clear();
      return false;
    }

    const renderer = this.mindmapManager.getRenderer();
    const allNodesToUpdate = new Set<Konva.Node>(nodes);

    if (renderer) {
      mindmapNodes.forEach((node) => {
        const descendants = renderer.getAllDescendants?.(node.id());
        if (!descendants || descendants.size === 0) {
          return;
        }

        descendants.forEach((descendantId: string) => {
          const descendantGroup = renderer.getNodeGroup?.(descendantId);
          if (descendantGroup) {
            allNodesToUpdate.add(descendantGroup);
          }
        });
      });
    }

    this.elementSynchronizer.updateElementsFromNodes(
      Array.from(allNodesToUpdate),
      "transform",
      {
        pushHistory: true,
        batchUpdates: true,
      },
    );

    this.mindmapDescendantInitialPositions.clear();
    return true;
  }

  setLiveRoutingEnabled(enabled: boolean): void {
    this.mindmapManager.setLiveRoutingEnabled(enabled);
  }

  rerouteMindmapNodes(nodeIds: string[]): void {
    if (nodeIds.length === 0) {
      return;
    }

    const renderer = this.mindmapManager.getRenderer();
    if (!renderer || !isMindmapRenderer(renderer)) {
      return;
    }

    try {
      this.debug?.("MindmapSelectionOrchestrator: rerouting mindmap nodes", {
        category: "selection/mindmap",
        data: { nodeIds },
      });
      batchMindmapReroute(renderer, nodeIds);
    } catch {
      // Ignore reroute errors – legacy renderer can throw when detached mid-operation.
    }
  }

  destroy(): void {
    this.mindmapDescendantInitialPositions.clear();
  }
}
