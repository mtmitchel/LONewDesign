import type Konva from "konva";
import type { ConnectorElement } from "@features/canvas/types/connector";
import { categorizeSelection } from "../SelectionResolver";

import type { CanvasElement } from "../../../../../../../types/index";

export interface MarqueeSelectionControllerDeps {
  elements: () => Map<string, CanvasElement>;
  setSelection: (ids: string[]) => void;
  onSelectionComplete?: (selectedIds: string[]) => void;
  debug?: (message: string, data?: unknown) => void;
  getElementBounds?: (id: string) => { x: number; y: number; width: number; height: number } | null;
  querySpatialIndex?: (bounds: { x: number; y: number; width: number; height: number; padding?: number }) => string[];
}

/**
 * MarqueeSelectionController - handles marquee selection logic
 * Part of the modular SelectionModule refactor
 */
export class MarqueeSelectionController {
  private readonly deps: MarqueeSelectionControllerDeps;

  constructor(deps: MarqueeSelectionControllerDeps) {
    this.deps = deps;
  }

  /**
   * Process marquee selection bounds and determine selected elements
   */
  selectElementsInBounds(
    stage: Konva.Stage,
    bounds: { x: number; y: number; width: number; height: number },
    options: { additive?: boolean } = {}
  ): string[] {
    this.deps.debug?.("MarqueeSelectionController: selectElementsInBounds", bounds);

    const elements = this.deps.elements();
    const candidateIdSet = new Set<string>();

    if (this.deps.querySpatialIndex) {
      try {
        const hits = this.deps.querySpatialIndex({ ...bounds });
        for (const id of hits) {
          if (typeof id === "string" && elements.has(id)) {
            candidateIdSet.add(id);
          }
        }
      } catch (error) {
        this.deps.debug?.("MarqueeSelectionController: spatial index query failed", error);
      }
    }

    const selectedIds = new Set<string>();
    const visitedIds = new Set<string>();

    const candidateNodes = stage.find<Konva.Node>((node: Konva.Node) => {
      if (typeof node.getAttr !== "function") return false;
      const elementId = node.getAttr("elementId") || node.id();
      if (!elementId) return false;
      return candidateIdSet.size === 0 || candidateIdSet.has(elementId);
    });

    this.deps.debug?.("MarqueeSelectionController: candidateNodes found", candidateNodes.length);

    for (const node of candidateNodes) {
      const elementId = node.getAttr("elementId") || node.id();
      if (!elementId || !elements.has(elementId)) {
        continue;
      }

      visitedIds.add(elementId);

      const rect =
        this.deps.getElementBounds?.(elementId) ??
        node.getClientRect({
          skipStroke: false,
          skipShadow: true,
        });

      if (rectsIntersect(bounds, rect)) {
        selectedIds.add(elementId);
        this.deps.debug?.("MarqueeSelectionController: selected element", {
          elementId,
          nodeType: node.getAttr("nodeType"),
          elementType: node.getAttr("elementType"),
        });
      }
    }

    if (candidateIdSet.size > 0) {
      for (const id of candidateIdSet) {
        if (visitedIds.has(id) || !elements.has(id)) {
          continue;
        }

        const rect = this.deps.getElementBounds?.(id);
        if (!rect) {
          continue;
        }

        if (rectsIntersect(bounds, rect)) {
          selectedIds.add(id);
          this.deps.debug?.("MarqueeSelectionController: selected element (spatial only)", {
            elementId: id,
          });
        }
      }
    }

    const selectedIdsArray = Array.from(selectedIds);
    this.deps.debug?.("MarqueeSelectionController: final selection", selectedIdsArray);

    // Use the module system for selection
    if (selectedIdsArray.length > 0) {
      this.performSelection(selectedIdsArray, options);
    }

    return selectedIdsArray;
  }

  /**
   * Calculate connector center position for drag operations
   */
  getConnectorCenterPosition(connectorElement: ConnectorElement): { x: number; y: number } | null {
    if (!connectorElement.from || !connectorElement.to) return null;

    let fromX = 0, fromY = 0, toX = 0, toY = 0;

    if (connectorElement.from.kind === 'point') {
      fromX = connectorElement.from.x;
      fromY = connectorElement.from.y;
    }
    if (connectorElement.to.kind === 'point') {
      toX = connectorElement.to.x;
      toY = connectorElement.to.y;
    }

    return {
      x: (fromX + toX) / 2,
      y: (fromY + toY) / 2
    };
  }

  /**
   * Get effective position for any element (handles connectors specially)
   */
  getElementPosition(elementId: string, node: Konva.Node): { x: number; y: number } {
    const elements = this.deps.elements();
    const element = elements.get(elementId);
    const nodePos = node.position();

    // For connectors with (0,0) position, calculate center from endpoints
    if (nodePos.x === 0 && nodePos.y === 0 && element?.type === 'connector') {
      const centerPos = this.getConnectorCenterPosition(element as ConnectorElement);
      if (centerPos) {
        this.deps.debug?.("MarqueeSelectionController: calculated connector center", {
          elementId,
          centerPos
        });
        return centerPos;
      }
    }

    // For other elements, use store position if available
    if (element && typeof element.x === 'number' && typeof element.y === 'number') {
      return { x: element.x, y: element.y };
    }

    // Fallback to Konva position
    return nodePos;
  }

  /**
   * Perform the actual selection through the module system
   */
  private performSelection(selectedIds: string[], options: { additive?: boolean } = {}) {
    this.deps.debug?.("MarqueeSelectionController: performing selection", {
      selectedIds,
      length: selectedIds.length,
      additive: options.additive
    });

    // Categorize the selection to understand what we're dealing with
    const elements = this.deps.elements();
    const categorized = categorizeSelection({
      selectedIds: new Set(selectedIds),
      elements,
    });

    this.deps.debug?.("MarqueeSelectionController: categorized selection", categorized);

    // Use a small delay to avoid conflicts with event handlers
    setTimeout(() => {
      this.deps.debug?.("MarqueeSelectionController: executing delayed setSelection", selectedIds);
      this.deps.setSelection(selectedIds);
      this.deps.onSelectionComplete?.(selectedIds);
      
      // Additional delay to check if selection persists
      setTimeout(() => {
        this.deps.debug?.("MarqueeSelectionController: checking selection persistence after 50ms");
      }, 50);
    }, 0);
  }

  /**
   * Prepare nodes for drag operations by capturing base positions
   * Excludes connectors from position-based dragging since they use endpoints
   */
  prepareNodesForDrag(
    stage: Konva.Stage, 
    selectedIds: string[]
  ): { nodes: Konva.Node[]; basePositions: Map<string, { x: number; y: number }> } {
    const nodes: Konva.Node[] = [];
    const basePositions = new Map<string, { x: number; y: number }>();

    const candidateNodes = stage.find<Konva.Node>((node: Konva.Node) => {
      const elementId = node.getAttr("elementId") || node.id();
      return elementId && selectedIds.includes(elementId);
    });

    const elements = this.deps.elements();

    for (const node of candidateNodes) {
      const elementId = node.getAttr("elementId") || node.id();
      if (!elementId) continue;

      const element = elements.get(elementId);
      
      // Skip connectors from position-based dragging - they should move via endpoint updates
      if (element?.type === 'connector') {
        this.deps.debug?.("MarqueeSelectionController: skipping connector from drag preparation", {
          elementId,
          reason: "connectors use endpoint-based positioning"
        });
        continue;
      }

      nodes.push(node);
      const position = this.getElementPosition(elementId, node);
      basePositions.set(elementId, position);

      this.deps.debug?.("MarqueeSelectionController: prepared node for drag", {
        elementId,
        position,
        nodeType: node.getAttr("nodeType"),
        elementType: element?.type
      });
    }

    this.deps.debug?.("MarqueeSelectionController: prepared drag nodes", {
      totalSelected: selectedIds.length,
      draggableNodes: nodes.length,
      skippedConnectors: selectedIds.length - nodes.length
    });

    return { nodes, basePositions };
  }
}

function rectsIntersect(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  const aRight = a.x + a.width;
  const aBottom = a.y + a.height;
  const bRight = b.x + b.width;
  const bBottom = b.y + b.height;

  return aRight >= b.x && bRight >= a.x && aBottom >= b.y && bBottom >= a.y;
}