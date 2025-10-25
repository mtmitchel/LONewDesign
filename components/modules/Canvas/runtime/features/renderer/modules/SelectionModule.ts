// features/canvas/renderer/modules/SelectionModule.ts
import type Konva from "konva";
import type { ModuleRendererCtx, RendererModule } from "../index";
import { TransformerManager } from "../../managers/TransformerManager";
import { ConnectorSelectionManager } from "../../managers/ConnectorSelectionManager";
import {
  categorizeSelection,
  filterTransformableNodes,
  resolveElementsToNodes,
} from "./selection/SelectionResolver";
import { TransformController } from "./selection/controllers/TransformController";
import { ConnectorTransformFinalizer } from "./selection/controllers/ConnectorTransformFinalizer";
import {
  transformStateManager,
  elementSynchronizer,
  connectorSelectionManager,
  SelectionSubscriptionManager,
  TransformerSelectionManager,
  ConnectorSelectionOrchestrator,
  MindmapSelectionOrchestrator,
} from "./selection/managers";
import { TransformLifecycleCoordinator } from "./selection/controllers/TransformLifecycleCoordinator";
import { MarqueeSelectionController } from "./selection/controllers/MarqueeSelectionController";
import { KeyboardHandler } from "./selection/utils/KeyboardHandler";
import { SelectionStateManager } from "./selection/managers/SelectionStateManager";
import { debug } from "../../../../utils/debug";
import type { UnifiedCanvasStore } from "../../stores/unifiedCanvasStore";
import type { TransformSnapshot as ControllerTransformSnapshot } from "./selection/types";

const FEATURE_FLAG_SELECTION_MANAGERS_V2 = "CANVAS_SELECTION_MANAGERS_V2";

type LegacySelectionMode = "schedule" | "refresh" | "immediate";

declare global {
  interface Window {
    __featureFlags?: Record<string, unknown>;
  }
}

function normaliseFlagValue(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalised = value.trim().toLowerCase();
    if (["0", "false", "off", "no"].includes(normalised)) {
      return false;
    }
    if (["1", "true", "on", "yes"].includes(normalised)) {
      return true;
    }
  }

  return undefined;
}

function readFeatureFlag(name: string): boolean | undefined {
  if (typeof window !== "undefined") {
    const value = window.__featureFlags?.[name];
    const parsed = normaliseFlagValue(value);
    if (typeof parsed === "boolean") {
      return parsed;
    }
  }

  const envValue =
    (typeof process !== "undefined" && typeof process.env !== "undefined"
      ? process.env[name]
      : undefined) ??
    (typeof import.meta !== "undefined" && (import.meta as unknown as { env?: Record<string, unknown> })?.env
      ? ((import.meta as unknown as { env?: Record<string, unknown> }).env?.[name])
      : undefined);

  const parsedEnv = normaliseFlagValue(envValue);
  if (typeof parsedEnv === "boolean") {
    return parsedEnv;
  }

  return undefined;
}

function isSelectionManagersV2Enabled(): boolean {
  const value = readFeatureFlag(FEATURE_FLAG_SELECTION_MANAGERS_V2);
  return value ?? true;
}

const LOG_CATEGORY = "selection/module";

export class SelectionModule implements RendererModule {
  private transformerManager?: TransformerManager;
  private connectorSelectionManager?: ConnectorSelectionManager;
  private storeCtx?: ModuleRendererCtx;
  private transformController?: TransformController;
  private marqueeSelectionController?: MarqueeSelectionController;
  private transformLifecycle?: TransformLifecycleCoordinator;
  private connectorTransformFinalizer?: ConnectorTransformFinalizer;
  private keyboardHandler?: KeyboardHandler;
  private selectionStateManager?: SelectionStateManager;
  private autoSelectTimers = new Map<string, ReturnType<typeof setTimeout>[]>();
  private selectionSubscriptionManager?: SelectionSubscriptionManager;
  private transformerSelectionManager?: TransformerSelectionManager;
  private connectorSelectionOrchestrator?: ConnectorSelectionOrchestrator;
  private mindmapSelectionOrchestrator?: MindmapSelectionOrchestrator;
  private useSelectionManagersV2 = true;
  private spatialIndex?: UnifiedCanvasStore["spatialIndex"];

  mount(ctx: ModuleRendererCtx): () => void {
    this.storeCtx = ctx;
    this.useSelectionManagersV2 = isSelectionManagersV2Enabled();
    this.spatialIndex = ctx.store.getState().spatialIndex;

    // Initialize SelectionStateManager
    this.selectionStateManager = new SelectionStateManager(ctx);

    // Create transformer manager on overlay layer with dynamic aspect ratio control
    try {
      this.connectorSelectionManager = new ConnectorSelectionManager(
        ctx.stage,
        {
          overlayLayer: ctx.layers.overlay,
          // Real-time connector endpoint update during drag
          // The actual store update happens on drag end in ConnectorSelectionManager
          onEndpointDrag: () => {
            // Placeholder for real-time visual updates
            // ConnectorSelectionManager handles visual feedback with endpoint dots
          },
        },
      );
    } catch (error) {
      // Ignore error
    }

    // Create transformer manager on overlay layer with dynamic aspect ratio control
    this.transformerManager = new TransformerManager(ctx.stage, {
      overlayLayer: ctx.layers.overlay,
      enabledAnchors: [
        "top-left",
        "top-right",
        "bottom-left",
        "bottom-right",
        "middle-left",
        "middle-right",
        "top-center",
        "bottom-center",
      ],
      rotateEnabled: true,
      padding: 4,
      anchorSize: 8,
      borderStroke: "#4F46E5",
      borderStrokeWidth: 2,
      anchorStroke: "#FFFFFF",
      anchorFill: "#4F46E5",
      ignoreStroke: false,
      keepRatioKey: "Shift", // Hold Shift to maintain aspect ratio
      lockAspectRatio: false, // Default to free resize for tables and other elements
      rotationSnapDeg: 15,
      onTransformStart: (nodes) => {
        this.beginSelectionTransform(nodes, "transform");
      },
      onTransform: (nodes) => {
        this.progressSelectionTransform(nodes, "transform");
      },
      onTransformEnd: (nodes) => {
        this.endSelectionTransform(nodes, "transform");
      },
    });

    this.connectorSelectionOrchestrator = new ConnectorSelectionOrchestrator({
      getStoreContext: () => this.storeCtx,
      getConnectorSelectionManager: () => this.connectorSelectionManager,
      debug: (message, data) => this.debugLog(message, data),
    });

    this.mindmapSelectionOrchestrator = new MindmapSelectionOrchestrator({
      getStoreContext: () => this.storeCtx,
      debug: (message, data) => this.debugLog(message, data),
    });

    this.transformController = new TransformController({
      getTransformer: () => this.transformLifecycle?.getTransformer() ?? null,
      applyAnchoredOverride: (id, from, to) => {
        connectorSelectionManager.updateElement(id, { from, to });
      },
      setConnectorRoutingEnabled: (enabled: boolean) =>
        connectorSelectionManager.setLiveRoutingEnabled(enabled),
      setMindmapRoutingEnabled: (enabled: boolean) =>
        this.mindmapSelectionOrchestrator?.setLiveRoutingEnabled(enabled),
      updateConnectorElement: (id: string, changes) =>
        connectorSelectionManager.updateElement(id, changes),
      rerouteAllConnectors: () => {
        const connectorService =
          typeof window !== "undefined"
            ? window.connectorService ?? null
            : null;
        try {
          connectorService?.forceRerouteAll();
        } catch {
          // ignore reroute errors
        }
      },
      rerouteMindmapNodes: (ids: string[]) => {
        if (ids.length === 0) {
          return;
        }
        this.debugLog("Triggering mindmap reroute after transform", {
          category: "selection/transform",
          data: { nodes: ids },
        });
        this.mindmapSelectionOrchestrator?.rerouteMindmapNodes(ids);
      },
      debug: (message: string, data?: unknown) => this.debugLog(message, data),
    });

    // Create connector transform finalizer
    this.connectorTransformFinalizer = new ConnectorTransformFinalizer(
      ctx,
      this.transformController,
    );

    // Initialize MarqueeSelectionController
    this.marqueeSelectionController = new MarqueeSelectionController({
      elements: () => {
        const state = this.storeCtx?.store.getState();
        return state?.elements || new Map();
      },
      setSelection: (ids) => {
        const state = this.storeCtx?.store.getState();
        if (state?.setSelection) {
          state.setSelection(ids);
        }
      },
      onSelectionComplete: (selectedIds) => {
        this.debugLog(
          "MarqueeSelectionController: selection completed",
          selectedIds,
        );
      },
      getElementBounds: (id) => {
        const state = this.storeCtx?.store.getState();
        return state?.geometry?.getElementBounds(id) ?? null;
      },
      querySpatialIndex: (queryBounds) => {
        const state = this.storeCtx?.store.getState();
        const query = state?.spatialIndex?.queryBounds;
        if (typeof query !== "function") {
          return [];
        }
        return query(queryBounds) ?? [];
      },
      debug: (message, data) => this.debugLog(message, data),
    });

    if (typeof window !== "undefined") {
      window.marqueeSelectionController = this.marqueeSelectionController;
    }
    this.keyboardHandler = new KeyboardHandler({
      onEscape: () => this.clearSelection(),
      onDelete: (selectedIds) => this.handleDelete(selectedIds),
      onSelectAll: () => this.handleSelectAll(),
      onCopy: (selectedIds) => this.handleCopy(selectedIds),
      onPaste: () => this.handlePaste(),
      onDuplicate: (selectedIds) => this.handleDuplicate(selectedIds),
      onArrowKey: (direction, shiftKey) => this.handleArrowKey(direction, shiftKey),
    });

    if (typeof document !== "undefined") {
      this.keyboardHandler.enable();
      const initialSelection = ctx.store.getState().selectedElementIds;
      if (initialSelection) {
        const selectionArray = initialSelection instanceof Set
          ? Array.from(initialSelection)
          : Array.isArray(initialSelection)
            ? [...initialSelection]
            : [];
        this.keyboardHandler.updateSelectedIds(selectionArray);
      }
    }

    this.transformLifecycle = new TransformLifecycleCoordinator(
      this.transformerManager,
      {
        onBegin: (nodes, source) => this.beginSelectionTransform(nodes, source),
        onProgress: (nodes, source) =>
          this.progressSelectionTransform(nodes, source),
        onEnd: (nodes, source) => this.endSelectionTransform(nodes, source),
      },
      (message, data) => this.debugLog(message, data),
    );

    // Wire transformer to use selector-based bounds
    this.transformLifecycle.setSelectionBoundsProvider(() => {
      const state = this.storeCtx?.store.getState();
      if (!state) return null;
      const selectedIds = state.selectedElementIds || new Set<string>();
      return this.getSelectionBounds(selectedIds);
    });

    this.transformerSelectionManager = new TransformerSelectionManager({
      transformLifecycle: this.transformLifecycle,
      getStage: () => this.getStage(),
      getLayers: () => this.getLayers(),
      debug: (message, data) => this.debugLog(message, data),
    });

    this.selectionSubscriptionManager = new SelectionSubscriptionManager(
      { store: ctx.store },
      {
        onSelectionChange: (selectedIds) => this.updateSelection(selectedIds),
        onSelectionVersionChange: (version) =>
          this.handleSelectionVersionChange(version),
      },
    );
    this.selectionSubscriptionManager.start();

    return () => this.unmount();
  }
  private unmount() {
    this.connectorSelectionOrchestrator?.cancelPending();
    this.transformLifecycle?.detach();
    this.selectionSubscriptionManager?.stop();
    this.selectionSubscriptionManager = undefined;
    this.transformerSelectionManager?.destroy();
    this.transformerSelectionManager = undefined;
    this.connectorSelectionOrchestrator?.destroy();
    this.connectorSelectionOrchestrator = undefined;
    this.mindmapSelectionOrchestrator?.destroy();
    this.mindmapSelectionOrchestrator = undefined;
    if (this.transformerManager) {
      this.transformerManager.destroy();
      this.transformerManager = undefined;
    }
    if (this.connectorSelectionManager) {
      this.connectorSelectionManager.destroy();
      this.connectorSelectionManager = undefined;
    }
    this.transformLifecycle = undefined;
    this.transformController = undefined;
    this.marqueeSelectionController = undefined;
    this.keyboardHandler?.destroy();
    this.keyboardHandler = undefined;
    this.selectionStateManager?.destroy();
    this.selectionStateManager = undefined;
    if (typeof window !== "undefined") {
      delete window.marqueeSelectionController;
    }
    this.spatialIndex = undefined;
  }

  private handleSelectionVersionChange(_version: number): void {
    if (!this.transformLifecycle || !this.storeCtx) {
      return;
    }

    const currentState = this.storeCtx.store.getState();
    const rawSelected = currentState.selectedElementIds;
    const selectedIds =
      rawSelected instanceof Set
        ? new Set(rawSelected)
        : new Set<string>(Array.isArray(rawSelected) ? rawSelected : []);

    if (selectedIds.size > 0) {
      this.refreshTransformerForSelection(selectedIds);
    }
  }

  private updateSelection(selectedIds: Set<string>) {
    if (!this.transformLifecycle || !this.storeCtx) {
      return;
    }

    this.debugLog("updateSelection", { ids: Array.from(selectedIds) });

    this.selectionStateManager?.updateFromExternal(selectedIds);
    this.keyboardHandler?.updateSelectedIds(Array.from(selectedIds));
    this.syncSelectionBounds(selectedIds);

    // CRITICAL FIX: Always clear both selection systems first to prevent conflicts
    this.transformerSelectionManager?.detach();
    this.connectorSelectionManager?.clearSelection();

    if (selectedIds.size === 0) {
      return;
    }

    // Handle connector-only selection via debouncer
    if (this.useSelectionManagersV2) {
      if (this.connectorSelectionOrchestrator?.handleSelectionChange(selectedIds)) {
        return;
      }
    } else if (this.handleLegacySelection(selectedIds, "schedule")) {
      return;
    }

    // Handle non-connector selection
    const state = this.storeCtx.store.getState();
    const { nonConnectorIds } = categorizeSelection({
      selectedIds,
      elements: (state.elements as Map<string, { type?: string }>) ?? new Map(),
      getElementById: state.element?.getById?.bind(state.element),
    });

    if (nonConnectorIds.length === 0) {
      return;
    }

    // CRITICAL FIX: Handle mixed or non-connector selection
    const selectionSnapshot = new Set(nonConnectorIds);

    this.transformerSelectionManager?.scheduleAttach(selectionSnapshot, {
      delay: 75,
    });
  }

  private debugLog(message: string, data?: unknown) {
    const forceLogging =
      typeof window !== "undefined" &&
      Boolean((window as Window & { __selectionDebug?: boolean }).__selectionDebug);

    debug(`SelectionModule: ${message}`, {
      category: LOG_CATEGORY,
      data,
      force: forceLogging,
    });
  }

  private getStage(): Konva.Stage | null {
    return (
      this.storeCtx?.stage ??
      (typeof window !== "undefined"
        ? ((window as Window & { konvaStage?: Konva.Stage }).konvaStage ?? null)
        : null)
    );
  }

  private getLayers(): Array<Konva.Container | null | undefined> {
    return this.storeCtx
      ? [
          this.storeCtx.layers.main,
          this.storeCtx.layers.highlighter,
          this.storeCtx.layers.overlay,
          this.storeCtx.layers.preview,
        ]
      : [];
  }

  private syncSelectionBounds(selectedIds: Set<string>) {
    if (!this.storeCtx) {
      return;
    }

    const store = this.storeCtx.store;
    const state = store.getState();
    const patchContextToolbar = state.patchContextToolbar;
    const contextualToolbar = state.contextualToolbar;

    if (typeof patchContextToolbar !== "function") {
      return;
    }

    const bounds = this.getSelectionBounds(selectedIds);
    const nextAnchor = bounds
      ? {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
        }
      : null;

    const currentAnchor = contextualToolbar?.anchor ?? null;
    const anchorUnchanged =
      (nextAnchor === null && currentAnchor === null) ||
      (nextAnchor !== null &&
        currentAnchor !== null &&
        nextAnchor.x === currentAnchor.x &&
        nextAnchor.y === currentAnchor.y &&
        nextAnchor.width === currentAnchor.width &&
        nextAnchor.height === currentAnchor.height);

    const nextVisible = Boolean(nextAnchor);
    const currentVisible = Boolean(contextualToolbar?.visible);

    if (anchorUnchanged && nextVisible === currentVisible) {
      return;
    }

    patchContextToolbar({
      anchor: nextAnchor,
      visible: nextVisible,
    });
  }

  private beginSelectionTransform(
    nodes: Konva.Node[],
    source: "drag" | "transform",
  ) {
    if (source === "transform") {
      this.spatialIndex?.beginInteraction("selection-transform");
    }

    debug("SelectionModule: beginSelectionTransform", {
      category: LOG_CATEGORY,
      data: {
        source,
        nodeCount: nodes.length,
        nodeIds: nodes.map((node) => node.id()),
      },
    });
    
    // Delegate to TransformStateManager
    transformStateManager.beginTransform(nodes, source);

    // Reset and capture controller snapshot for delta computations
    this.transformController?.clearSnapshot();
    const controllerSnapshot = this.buildTransformControllerSnapshot(nodes);
    if (controllerSnapshot) {
      this.transformController?.start(controllerSnapshot);
    }

    this.mindmapSelectionOrchestrator?.handleTransformBegin(nodes, source);
  }

  private progressSelectionTransform(
    nodes: Konva.Node[],
    source: "drag" | "transform",
  ) {
    debug("SelectionModule: progressSelectionTransform", {
      category: LOG_CATEGORY,
      data: {
        source,
        nodeCount: nodes.length,
      },
    });
    
    // Delegate to TransformStateManager
    transformStateManager.progressTransform(nodes, source);

    // Live visual updates for connectors and mindmap edges using existing controller
    const delta = this.transformController?.computeDelta(nodes);
    if (delta) {
      // Update visuals directly through transform controller
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
      this.mindmapSelectionOrchestrator?.handleTransformProgress(
        nodes,
        source,
        delta,
      );
    }

    this.syncElementsDuringTransform(nodes, source);
  }

  private endSelectionTransform(
    nodes: Konva.Node[],
    source: "drag" | "transform",
  ) {
    // Delegate to TransformStateManager
    transformStateManager.endTransform(nodes, source);

    // Delegate connector-specific transform finalization to dedicated class
    this.connectorTransformFinalizer?.finalizeConnectorTransform(nodes);

    // Filter out connector nodes to prevent double-processing with pushHistory: true
    // ConnectorTransformFinalizer already handled connectors with pushHistory: false
    const nonConnectorNodes = nodes.filter(node => {
      const elementType = node.getAttr("elementType");
      return elementType !== "connector";
    });

    // Commit final positions and clean up visuals (excluding connectors)
    if (nonConnectorNodes.length > 0) {
      const handledByMindmap =
        this.mindmapSelectionOrchestrator?.handleTransformEnd({
          nodes,
          nonConnectorNodes,
          source,
        }) ?? false;

      if (!handledByMindmap) {
        elementSynchronizer.updateElementsFromNodes(nonConnectorNodes, "transform", {
          pushHistory: true,
          batchUpdates: true,
        });
      }
    }

    // Direct call to TransformStateManager (Phase 3: shim removal)
    transformStateManager.finalizeTransform();
    this.transformController?.release();

    if (source === "transform") {
      this.spatialIndex?.endInteraction();
    }
  }

  private buildTransformControllerSnapshot(
    nodes: Konva.Node[],
  ): ControllerTransformSnapshot | null {
    if (!nodes || nodes.length === 0) {
      return null;
    }

    const basePositions = new Map<string, { x: number; y: number }>();

    nodes.forEach((node) => {
      try {
        const elementId = (node.getAttr("elementId") as string | undefined) ?? node.id();
        if (!elementId) {
          return;
        }
        const position = node.position();
        basePositions.set(elementId, { x: position.x, y: position.y });
      } catch (error) {
        this.debugLog("buildTransformControllerSnapshot: position read failed", {
          error,
        });
      }
    });

    if (basePositions.size === 0) {
      return null;
    }

    const transformerRect = this.transformLifecycle?.getTransformerRect();

    return {
      basePositions,
      connectors: new Map(),
      mindmapEdges: new Map(),
      movedMindmapNodes: new Set(),
      transformerBox: transformerRect
        ? { x: transformerRect.x, y: transformerRect.y }
        : undefined,
    };
  }

  private syncElementsDuringTransform(
    nodes: Konva.Node[],
    source: "drag" | "transform",
  ): void {
    if (!nodes || nodes.length === 0) {
      return;
    }

    try {
      elementSynchronizer.updateElementsFromNodes(nodes, source, {
        pushHistory: false,
        batchUpdates: true,
        skipConnectorScheduling: true,
      });
    } catch (error) {
      this.debugLog("syncElementsDuringTransform: update failed", { error });
    }
  }

  // FIXED: Enhanced auto-select element with better timing and error recovery
  autoSelectElement(elementId: string) {
    this.cancelAutoSelectTimers(elementId);

    // Use SelectionStateManager for centralized selection management
    this.selectionStateManager?.setSelection([elementId]);

    // Enhanced retry mechanism with exponential backoff for better reliability
    let attempts = 0;
    const maxAttempts = 5;
    const baseDelay = 25; // Start with shorter delay

    const attemptSelection = () => {
      attempts += 1;
      const delay = baseDelay * Math.pow(1.5, attempts - 1); // Exponential backoff

      const timeoutId = setTimeout(() => {
        const rawNodes = resolveElementsToNodes({
          stage:
            this.storeCtx?.stage ??
            (typeof window !== "undefined"
              ? ((window as Window & { konvaStage?: Konva.Stage }).konvaStage ??
                null)
              : null),
          layers: this.storeCtx
            ? [
                this.storeCtx.layers.main,
                this.storeCtx.layers.highlighter,
                this.storeCtx.layers.overlay,
                this.storeCtx.layers.preview,
              ]
            : [],
          elementIds: new Set([elementId]),
        });

        const nodes = filterTransformableNodes(rawNodes, (message, data) =>
          this.debugLog(message, data),
        );

        if (nodes.length > 0) {
          this.transformLifecycle?.detach();
          setTimeout(() => {
            this.transformLifecycle?.attach(nodes);
            this.transformLifecycle?.show();
          }, 10);
          this.cancelAutoSelectTimers(elementId);
          return; // Success, stop retrying
        }

        if (attempts < maxAttempts) {
          // Re-set selection for retry using SelectionStateManager
          this.selectionStateManager?.setSelection([elementId]);
          attemptSelection(); // Recursive retry
        } else {
          this.cancelAutoSelectTimers(elementId);
        }
      }, delay);

      this.trackAutoSelectTimer(elementId, timeoutId);
    };

    attemptSelection();
  }

  private trackAutoSelectTimer(
    elementId: string,
    timeoutId: ReturnType<typeof setTimeout>,
  ) {
    const timers = this.autoSelectTimers.get(elementId) ?? [];
    timers.push(timeoutId);
    this.autoSelectTimers.set(elementId, timers);
  }

  private cancelAutoSelectTimers(elementId?: string) {
    if (elementId) {
      const timers = this.autoSelectTimers.get(elementId);
      if (timers) {
        timers.forEach((id) => clearTimeout(id));
        this.autoSelectTimers.delete(elementId);
      }
      return;
    }

    this.autoSelectTimers.forEach((timers) => {
      timers.forEach((id) => clearTimeout(id));
    });
    this.autoSelectTimers.clear();
  }

  // Public method to clear selection
  clearSelection(force: boolean = false) {
    if (this.transformController?.isActive()) {
      if (!force) {
        return;
      }
      this.transformController.release();
    }

    this.transformerSelectionManager?.cancelPending();

    this.cancelAutoSelectTimers();

    this.selectionStateManager?.clearSelection();
    this.keyboardHandler?.updateSelectedIds([]);
    this.transformerSelectionManager?.detach();
    this.syncSelectionBounds(new Set<string>());
  }

  // Private method to refresh transformer for current selection (used when selection version changes)
  private refreshTransformerForSelection(selectedIds: Set<string>) {
    if (!this.transformerSelectionManager || !this.storeCtx) {
      return;
    }

    if (selectedIds.size === 0) {
      this.transformerSelectionManager.detach();
      return;
    }

    const selectionSnapshot = new Set(selectedIds);

    // Handle connector-only selection via orchestrator
    if (this.useSelectionManagersV2) {
      if (this.connectorSelectionOrchestrator?.handleImmediateSelection(selectionSnapshot)) {
        this.transformerSelectionManager.detach();
        this.connectorSelectionManager?.clearSelection();
        return;
      }

      this.transformerSelectionManager.refresh(selectionSnapshot, {
        delay: 50,
      });
      return;
    }

    this.handleLegacySelection(selectionSnapshot, "refresh");
  }

  /**
   * Force an immediate refresh of the transformer for the current selection.
   * This is useful when elements have changed dimensions and the transformer
   * needs to update immediately without waiting for async delays.
   */
  public forceRefresh(): void {
    if (!this.transformerSelectionManager || !this.storeCtx) {
      return;
    }

    const currentState = this.storeCtx.store.getState();
    const selectedIds = (() => {
      const value = currentState.selectedElementIds;
      if (value instanceof Set) {
        return new Set(
          Array.from(value).filter(
            (id): id is string => typeof id === "string",
          ),
        );
      }
      if (Array.isArray(value)) {
        return new Set(
          (value as unknown[]).filter(
            (id): id is string => typeof id === "string",
          ),
        );
      }
      return new Set<string>();
    })();

    if (this.useSelectionManagersV2) {
      if (this.connectorSelectionOrchestrator?.handleImmediateSelection(selectedIds)) {
        this.transformerSelectionManager.detach();
        this.connectorSelectionManager?.refreshSelection();
        return;
      }
    } else if (this.handleLegacySelection(selectedIds, "immediate")) {
      return;
    }

    if (selectedIds.size === 0) {
      this.transformerSelectionManager.detach();
      return;
    }

    this.transformerSelectionManager.attachImmediately(selectedIds);
  }

  private handleLegacySelection(selectedIds: Set<string>, mode: LegacySelectionMode): boolean {
    if (!this.storeCtx || selectedIds.size === 0) {
      return false;
    }

    const state = this.storeCtx.store.getState();
    const { connectorIds, mindmapEdgeIds, nonConnectorIds } = categorizeSelection({
      selectedIds,
      elements: (state.elements as Map<string, { type?: string }>) ?? new Map(),
      getElementById: state.element?.getById?.bind(state.element),
    });

    if (nonConnectorIds.length === 0) {
      const connectorId = connectorIds[0] ?? mindmapEdgeIds[0];
      if (connectorId) {
        this.connectorSelectionManager?.showSelection(connectorId);
      }
      this.transformerSelectionManager?.detach();
      return true;
    }

    const snapshot = new Set(nonConnectorIds);

    switch (mode) {
      case "immediate":
        this.transformerSelectionManager?.attachImmediately(snapshot);
        break;
      case "refresh":
        this.transformerSelectionManager?.attachImmediately(snapshot);
        break;
      case "schedule":
      default:
        this.transformerSelectionManager?.scheduleAttach(snapshot, { delay: 75 });
        break;
    }

    return true;
  }

  // Keyboard handler implementations
  private handleDelete(selectedIds: string[]): void {
    this.debugLog("KeyboardHandler: delete", { selectedIds });
    
    if (!this.storeCtx || selectedIds.length === 0) return;
    
    const store = this.storeCtx.store;
    const state = store.getState();
    
    // Check if we're currently transforming - don't delete during transform
    if (this.transformController?.isActive()) return;
    
    // Delete elements using store's selection.deleteSelected method
    if (typeof state.selection?.deleteSelected === "function") {
      state.selection.deleteSelected();
    } else {
      // Fallback: delete elements individually
      selectedIds.forEach((id) => {
        if (typeof state.element?.delete === "function") {
          state.element.delete(id);
        }
      });
    }

    // Clear selection after deletion to keep transformer + handler in sync
    this.selectionStateManager?.clearSelection();
    this.keyboardHandler?.updateSelectedIds([]);

    // Clean up transformer
    this.transformLifecycle?.detach();
  }

  private handleSelectAll(): void {
    this.debugLog("KeyboardHandler: select all");
    
    if (!this.storeCtx) return;
    
    const store = this.storeCtx.store;
    const state = store.getState();
    
    // Use SelectionStateManager for select all
    if (typeof state.selection?.selectAll === "function") {
      state.selection.selectAll();
    } else {
      // Fallback: select all elements
      const allElementIds = Array.from(state.elements?.keys() || []);
      this.selectionStateManager?.setSelection(allElementIds);
    }
  }

  private handleCopy(selectedIds: string[]): void {
    this.debugLog("KeyboardHandler: copy", { selectedIds });
    
    if (!this.storeCtx || selectedIds.length === 0) return;
    
    const store = this.storeCtx.store;
    const state = store.getState();
    
    // Store copied elements in memory for paste (fallback implementation)
    const elements = selectedIds.map(id => state.elements?.get(id)).filter(Boolean);
    if (elements.length > 0) {
      // Store copied elements in memory for paste
      if (typeof window !== "undefined") {
        (window as any).__copiedElements = elements;
      }
    }
  }

  private handlePaste(): void {
    this.debugLog("KeyboardHandler: paste");
    
    if (!this.storeCtx) return;
    
    const store = this.storeCtx.store;
    const state = store.getState();
    
    // Fallback: paste from memory clipboard
    if (typeof window !== "undefined" && (window as any).__copiedElements) {
      const copiedElements = (window as any).__copiedElements;
      if (copiedElements && Array.isArray(copiedElements)) {
        // Create duplicates of copied elements with offset
        copiedElements.forEach((element: any, index: number) => {
          if (element && typeof state.element?.upsert === "function") {
            const newElement = {
              ...element,
              id: `${element.id}_copy_${Date.now()}_${index}`,
              x: (element.x || 0) + 20,
              y: (element.y || 0) + 20
            };
            state.element.upsert(newElement);
          }
        });
      }
    }
  }

  private handleDuplicate(selectedIds: string[]): void {
    this.debugLog("KeyboardHandler: duplicate", { selectedIds });
    
    if (!this.storeCtx || selectedIds.length === 0) return;
    
    const store = this.storeCtx.store;
    const state = store.getState();
    
    // Fallback: duplicate elements with offset using element.duplicate method
    selectedIds.forEach((id, index) => {
      const element = state.elements?.get(id);
      if (element && typeof state.element?.duplicate === "function") {
        const newId = state.element.duplicate(id);
        if (newId && typeof state.element?.update === "function") {
          // Update position of duplicated element with offset
          state.element.update(newId, {
            x: (element.x || 0) + 20,
            y: (element.y || 0) + 20
          });
        }
      }
    });
  }

  private handleArrowKey(direction: 'up' | 'down' | 'left' | 'right', shiftKey: boolean): void {
    this.debugLog("KeyboardHandler: arrow key", { direction, shiftKey });
    
    if (!this.storeCtx) return;
    
    const store = this.storeCtx.store;
    const state = store.getState();
    const selectedIds = Array.from(state.selectedElementIds || []);
    
    if (selectedIds.length === 0) return;
    
    // Check if we're currently transforming - don't nudge during transform
    if (this.transformController?.isActive()) return;
    
    const nudgeAmount = shiftKey ? 10 : 1; // Larger nudge with Shift key
    
    // Calculate delta based on direction
    let deltaX = 0;
    let deltaY = 0;
    
    switch (direction) {
      case 'up':
        deltaY = -nudgeAmount;
        break;
      case 'down':
        deltaY = nudgeAmount;
        break;
      case 'left':
        deltaX = -nudgeAmount;
        break;
      case 'right':
        deltaX = nudgeAmount;
        break;
    }
    
    // Use store's moveSelectedBy functionality
    if (typeof state.selection?.moveSelectedBy === "function") {
      state.selection.moveSelectedBy(deltaX, deltaY);
    } else {
      // Fallback: update element positions directly
      selectedIds.forEach(id => {
        const element = state.elements?.get(id);
        if (element && typeof state.element?.update === "function") {
          const updatedElement = {
            ...element,
            x: (element.x || 0) + deltaX,
            y: (element.y || 0) + deltaY
          };
          state.element.update(id, updatedElement);
        }
      });
    }
  }

  public getSelectionBounds(ids?: Iterable<string>): { x: number; y: number; width: number; height: number } | null {
    const state = this.storeCtx?.store.getState();
    const geometry = state?.geometry?.getUnionBounds;
    if (!geometry) {
      return null;
    }

    let source: Iterable<string> | undefined;
    if (ids) {
      source = ids;
    } else if (state?.selectedElementIds instanceof Set) {
      source = state.selectedElementIds;
    } else if (Array.isArray(state?.selectedElementIds)) {
      source = state?.selectedElementIds;
    }

    if (!source) {
      return null;
    }

    const normalized = Array.from(source);
    if (normalized.length === 0) {
      return null;
    }

    return geometry(normalized) ?? null;
  }

  public selectElementsInBounds(
    stage: Konva.Stage,
    bounds: { x: number; y: number; width: number; height: number },
    options: { additive?: boolean } = {},
  ): string[] {
    this.debugLog("selectElementsInBounds", { bounds, options });

    if (!this.marqueeSelectionController) {
      this.debugLog("selectElementsInBounds skipped", {
        reason: "marqueeSelectionController unavailable",
      });
      return [];
    }

    const selectedIds = this.marqueeSelectionController.selectElementsInBounds(
      stage,
      bounds,
      options,
    );

    if (selectedIds.length > 0) {
      this.keyboardHandler?.updateSelectedIds(selectedIds);
      this.selectionStateManager?.updateFromExternal(new Set(selectedIds));
    }

    return selectedIds;
  }
}

declare global {
  interface Window {
    marqueeSelectionController?: MarqueeSelectionController;
  }
}
