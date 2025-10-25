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
import { ConnectorAdjacencyCache } from "./selection/utils/ConnectorAdjacencyCache";
import { debug } from "../../../../utils/debug";
import type {
  UnifiedCanvasStore,
  TransformSnapshotState,
} from "../../stores/unifiedCanvasStore";
import { getElementBoundsFromElements } from "../../stores/selectors/geometrySelectors";
import type { TransformSnapshot as ControllerTransformSnapshot } from "./selection/types";
import type {
  ConnectorElement,
  ConnectorEndpoint,
  ConnectorEndpointPoint,
} from "../../types/connector";
import type { CanvasElement } from "../../../../types";

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
  private connectorBaselines = new Map<
    string,
    {
      position: { x: number; y: number };
      from?: ConnectorEndpoint;
      to?: ConnectorEndpoint;
    }
  >();
  private activeConnectorIds = new Set<string>();
  private transformSubscription?: () => void;
  private lastTransientSnapshot: TransformSnapshotState | null = null;
  private lastAppliedDelta: { dx: number; dy: number } | null = null;
  private dragContainer?: Konva.Group;
  private transientNodeParents = new Map<string, Konva.Container | null>();
  private connectorAdjacencyCache = new ConnectorAdjacencyCache();
  private stageListeningBeforeTransform?: boolean;

  mount(ctx: ModuleRendererCtx): () => void {
    this.storeCtx = ctx;
    this.useSelectionManagersV2 = isSelectionManagersV2Enabled();
    this.spatialIndex = ctx.store.getState().spatialIndex;
    this.dragContainer = ctx.layers.drag;

    if (typeof ctx.store.subscribe === "function") {
      this.transformSubscription = ctx.store.subscribe(
        (state) => state.transform,
        (transform) => {
          if (!transform) {
            this.lastTransientSnapshot = null;
            this.lastAppliedDelta = null;
            return;
          }
          this.handleTransformState(
            transform.snapshot ?? null,
            transform.transientDelta ?? null,
            transform.isActive ?? false,
          );
        },
        { fireImmediately: true },
      );
    }

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
      registerConnectorBaselines: (ids) => this.registerConnectorBaselinesForElements(ids, false),
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
      () => this.connectorBaselines,
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
    this.transformSubscription?.();
    this.transformSubscription = undefined;
    this.lastTransientSnapshot = null;
    this.lastAppliedDelta = null;
    this.spatialIndex = undefined;
    this.publishTransformCancel();
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
    if (!controllerSnapshot) {
      this.publishTransformCancel();
      this.restoreStageListening();
      return;
    }

    this.moveNodesToDragLayer(nodes, controllerSnapshot);
    this.transformController?.start(controllerSnapshot);
    this.publishTransformBegin(controllerSnapshot);

    this.captureConnectorBaselines();

    const stage = this.getStage();
    if (stage) {
      if (this.stageListeningBeforeTransform === undefined) {
        this.stageListeningBeforeTransform = stage.listening();
      }
      if (source === "transform") {
        stage.listening(false);
      }
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
      const elementIds = nodes
        .map((node) => node.getAttr("elementId") || node.id())
        .filter((id): id is string => Boolean(id));
      if (elementIds.length > 0) {
        this.registerConnectorBaselinesForElements(elementIds, false);
      }

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
      this.publishTransformDelta(delta);
      // Push delta through transient channel for downstream subscribers
      this.applyConnectorDelta(delta);
      this.mindmapSelectionOrchestrator?.handleTransformProgress(
        nodes,
        source,
        delta,
      );
    } else {
      this.publishTransformClear();
    }

    this.syncElementsDuringTransform(nodes, source, delta ?? undefined);
  }

  private prepareConnectorAdjacency(elements?: Map<string, CanvasElement>): void {
    if (!elements) {
      this.connectorAdjacencyCache.clear();
      return;
    }

    try {
      this.connectorAdjacencyCache.rebuild(elements);
    } catch (error) {
      this.debugLog("prepareConnectorAdjacency failed", { error });
      this.connectorAdjacencyCache.clear();
    }
  }

  private collectConnectedConnectorIds(
    elements: Map<string, CanvasElement>,
    selectedIds: Set<string>,
  ): Set<string> {
    const connectorIds = new Set<string>();

    selectedIds.forEach((id) => {
      const element = elements.get(id);
      if (element?.type === "connector") {
        connectorIds.add(id);
      }
    });

    const adjacencyMatches = this.connectorAdjacencyCache.getConnectedConnectors(selectedIds);
    adjacencyMatches.forEach((id) => connectorIds.add(id));

    return connectorIds;
  }

  private resolveConnectorEndpointPointForSnapshot(
    endpoint: ConnectorEndpoint,
    elements: Map<string, CanvasElement>,
  ): ConnectorEndpointPoint | null {
    if (!endpoint) {
      return null;
    }

    if (endpoint.kind === "point") {
      return {
        kind: "point",
        x: endpoint.x,
        y: endpoint.y,
      };
    }

    const bounds = getElementBoundsFromElements(elements, endpoint.elementId);
    if (!bounds) {
      return null;
    }

    let x = bounds.x + bounds.width / 2;
    let y = bounds.y + bounds.height / 2;

    switch (endpoint.anchor) {
      case "left":
        x = bounds.x;
        break;
      case "right":
        x = bounds.x + bounds.width;
        break;
      case "top":
        y = bounds.y;
        break;
      case "bottom":
        y = bounds.y + bounds.height;
        break;
      case "center":
      default:
        break;
    }

    if (endpoint.offset) {
      x += endpoint.offset.dx;
      y += endpoint.offset.dy;
    }

    return {
      kind: "point",
      x,
      y,
    };
  }

  private endSelectionTransform(
    nodes: Konva.Node[],
    source: "drag" | "transform",
  ) {
    // Delegate to TransformStateManager
    transformStateManager.endTransform(nodes, source);

    // Delegate connector-specific transform finalization to dedicated class
    this.connectorTransformFinalizer?.finalizeConnectorTransform(nodes);
    this.connectorBaselines.clear();
    this.activeConnectorIds.clear();

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
    this.publishTransformCommit();
    transformStateManager.finalizeTransform();
    this.transformController?.release();

    this.restoreStageListening();

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
    const selectedIds = new Set<string>();

    nodes.forEach((node) => {
      try {
        const elementId = (node.getAttr("elementId") as string | undefined) ?? node.id();
        if (!elementId) {
          return;
        }
        const absolute = node.getAbsolutePosition();
        basePositions.set(elementId, { x: absolute.x, y: absolute.y });
        selectedIds.add(elementId);
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
    const snapshot: ControllerTransformSnapshot = {
      basePositions,
      connectors: new Map(),
      drawings: new Map(),
      mindmapEdges: new Map(),
      movedMindmapNodes: new Set(),
      transformerBox: transformerRect
        ? { x: transformerRect.x, y: transformerRect.y }
        : undefined,
    };

    const elements = this.storeCtx?.store.getState().elements;
    if (elements && elements.size > 0) {
      this.prepareConnectorAdjacency(elements);

      const stage = this.getStage();
      const connectorsToCapture = this.collectConnectedConnectorIds(elements, selectedIds);
      const drawingsToCapture = new Set<string>();
      selectedIds.forEach((elementId) => {
        const element = elements.get(elementId);
        if (element?.type === "drawing") {
          drawingsToCapture.add(elementId);
        }
      });

      connectorsToCapture.forEach((connectorId) => {
        const element = elements.get(connectorId);
        if (!element || element.type !== "connector") {
          return;
        }

        const connector = element as ConnectorElement;
        const startFrom = this.resolveConnectorEndpointPointForSnapshot(connector.from, elements);
        const startTo = this.resolveConnectorEndpointPointForSnapshot(connector.to, elements);
        if (!startFrom || !startTo) {
          this.debugLog("buildTransformControllerSnapshot: missing connector endpoints", {
            connectorId,
          });
          return;
        }

        const group = stage?.findOne<Konva.Group>(`#${connectorId}`) ?? null;
        const shapeNode = group?.findOne<Konva.Shape>(".connector-shape") ?? null;
        const groupAbsolutePosition = group
          ? (() => {
              const abs = group.getAbsolutePosition();
              return { x: abs.x, y: abs.y };
            })()
          : undefined;

        snapshot.connectors.set(connectorId, {
          originalFrom: this.cloneConnectorEndpoint(connector.from) ?? connector.from,
          originalTo: this.cloneConnectorEndpoint(connector.to) ?? connector.to,
          startFrom,
          startTo,
          wasAnchored:
            (connector.from?.kind === "element" && Boolean(connector.from.elementId)) ||
            (connector.to?.kind === "element" && Boolean(connector.to.elementId)),
          shape: shapeNode as unknown as Konva.Line | Konva.Arrow | null,
          group,
          groupPosition: groupAbsolutePosition,
        });
      });

      drawingsToCapture.forEach((elementId) => {
        const element = elements.get(elementId);
        if (!element || element.type !== "drawing") {
          return;
        }

        const node = stage?.findOne<Konva.Line>(`#${elementId}`) ?? null;
        snapshot.drawings.set(elementId, {
          node,
          x: typeof element.x === "number" ? element.x : 0,
          y: typeof element.y === "number" ? element.y : 0,
          absolute: node
            ? (() => {
                const abs = node.getAbsolutePosition();
                return { x: abs.x, y: abs.y };
              })()
            : undefined,
          points: Array.isArray(element.points) ? [...element.points] : [],
        });
      });

      if (process.env.NODE_ENV !== "production") {
        if (connectorsToCapture.size > 0 && snapshot.connectors.size === 0) {
          this.debugLog("transform snapshot missing connectors despite dependencies", {
            expected: connectorsToCapture.size,
            captured: snapshot.connectors.size,
          });
        }
        if (drawingsToCapture.size > 0 && snapshot.drawings.size === 0) {
          this.debugLog("transform snapshot missing drawings despite selection", {
            expected: drawingsToCapture.size,
            captured: snapshot.drawings.size,
          });
        }
      }
    } else {
      this.prepareConnectorAdjacency(undefined);
    }

    this.debugLog("buildTransformControllerSnapshot summary", {
      baseCount: basePositions.size,
      connectorCount: snapshot.connectors.size,
      drawingCount: snapshot.drawings.size,
    });
    return snapshot;
  }

  private serializeTransformSnapshot(
    snapshot: ControllerTransformSnapshot,
  ): TransformSnapshotState {
    const elementBaselines: TransformSnapshotState["elementBaselines"] = {};
    snapshot.basePositions.forEach((pos, id) => {
      elementBaselines[id] = { x: pos.x, y: pos.y };
    });

    const connectorBaselines: TransformSnapshotState["connectorBaselines"] = {};
    snapshot.connectors.forEach((connectorSnapshot, connectorId) => {
      connectorBaselines[connectorId] = {
        startFrom: {
          kind: "point",
          x: connectorSnapshot.startFrom.x,
          y: connectorSnapshot.startFrom.y,
        },
        startTo: {
          kind: "point",
          x: connectorSnapshot.startTo.x,
          y: connectorSnapshot.startTo.y,
        },
        originalFrom:
          this.cloneConnectorEndpoint(connectorSnapshot.originalFrom) ??
          connectorSnapshot.originalFrom,
        originalTo:
          this.cloneConnectorEndpoint(connectorSnapshot.originalTo) ??
          connectorSnapshot.originalTo,
        groupPosition: connectorSnapshot.groupPosition
          ? { x: connectorSnapshot.groupPosition.x, y: connectorSnapshot.groupPosition.y }
          : null,
        anchored: connectorSnapshot.wasAnchored,
      };
    });

    const drawingBaselines: TransformSnapshotState["drawingBaselines"] = {};
    snapshot.drawings.forEach((drawingSnapshot, drawingId) => {
      drawingBaselines[drawingId] = {
        x: drawingSnapshot.x,
        y: drawingSnapshot.y,
        points: [...drawingSnapshot.points],
        absolute: drawingSnapshot.absolute
          ? { x: drawingSnapshot.absolute.x, y: drawingSnapshot.absolute.y }
          : undefined,
      };
    });

    return {
      elementBaselines,
      connectorBaselines,
      drawingBaselines,
    };
  }

  private publishTransformBegin(snapshot: ControllerTransformSnapshot): void {
    const transformApi = this.storeCtx?.store.getState().transform;
    if (!transformApi?.beginTransform) {
      return;
    }
    transformApi.beginTransform(this.serializeTransformSnapshot(snapshot));
  }

  private publishTransformDelta(delta: { dx: number; dy: number }): void {
    const transformApi = this.storeCtx?.store.getState().transform;
    transformApi?.updateTransform?.({ ...delta });
  }

  private publishTransformClear(): void {
    const transformApi = this.storeCtx?.store.getState().transform;
    transformApi?.clearTransient?.();
  }

  private publishTransformCommit(): void {
    const transformApi = this.storeCtx?.store.getState().transform;
    this.restoreTransientNodes();
    transformApi?.commitTransform?.();
  }

  private publishTransformCancel(): void {
    const transformApi = this.storeCtx?.store.getState().transform;
    transformApi?.cancelTransform?.();
    this.restoreStageListening();
    this.restoreTransientNodes();
  }

  private handleTransformState(
    snapshot: TransformSnapshotState | null,
    delta: { dx: number; dy: number } | null,
    isActive: boolean,
  ): void {
    if (!snapshot || !isActive) {
      this.lastTransientSnapshot = null;
      this.lastAppliedDelta = null;
      this.restoreStageListening();
      this.restoreTransientNodes();
      return;
    }

    const appliedDelta = delta ?? { dx: 0, dy: 0 };
    if (
      this.lastAppliedDelta &&
      this.lastAppliedDelta.dx === appliedDelta.dx &&
      this.lastAppliedDelta.dy === appliedDelta.dy
    ) {
      return;
    }

    this.lastTransientSnapshot = snapshot;
    this.applyTransientDeltaToSnapshot(snapshot, appliedDelta);
    this.lastAppliedDelta = appliedDelta;
  }

  private applyTransientDeltaToSnapshot(
    snapshot: TransformSnapshotState,
    delta: { dx: number; dy: number },
  ): void {
    const stage = this.getStage();
    const layersToRedraw = new Set<Konva.Layer>();
    Object.entries(snapshot.drawingBaselines).forEach(([id, baseline]) => {
      const node = stage?.findOne<Konva.Line>(`#${id}`);
      if (!node) {
        return;
      }

      const baseAbs = baseline.absolute ?? { x: baseline.x, y: baseline.y };

      try {
        node.absolutePosition({
          x: baseAbs.x + delta.dx,
          y: baseAbs.y + delta.dy,
        });
        const layer = node.getLayer?.();
        if (layer) {
          layersToRedraw.add(layer);
        }
      } catch (error) {
        this.debugLog("applyTransientDelta: drawing update failed", {
          id,
          error,
        });
      }
    });

    Object.entries(snapshot.connectorBaselines).forEach(([id, baseline]) => {
      if (baseline.anchored) {
        return;
      }

      const group = stage?.findOne<Konva.Group>(`#${id}`);
      if (!group || !baseline.groupPosition) {
        return;
      }

      try {
        group.absolutePosition({
          x: baseline.groupPosition.x + delta.dx,
          y: baseline.groupPosition.y + delta.dy,
        });
        const layer = group.getLayer?.();
        if (layer) {
          layersToRedraw.add(layer);
        }
      } catch (error) {
        this.debugLog("applyTransientDelta: connector update failed", {
          id,
          error,
        });
      }
    });

    this.routeAnchoredConnectorsDuringTransient(snapshot, delta, layersToRedraw);
    this.flushTransientRedraws(layersToRedraw);
  }

  private routeAnchoredConnectorsDuringTransient(
    snapshot: TransformSnapshotState,
    delta: { dx: number; dy: number },
    layersToRedraw: Set<Konva.Layer>,
  ): void {
    const requiresRouting = Object.values(snapshot.connectorBaselines).some(
      (baseline) => baseline.anchored,
    );

    if (!requiresRouting) {
      return;
    }

    try {
      const stage = this.getStage();
      const anchoredEntries = Object.entries(snapshot.connectorBaselines).filter(
        ([, baseline]) => baseline.anchored,
      );

      anchoredEntries.forEach(([id, baseline]) => {
        try {
          const group = stage?.findOne<Konva.Group>(`#${id}`);
          if (group && baseline.groupPosition) {
            group.scale({ x: 1, y: 1 });
            group.rotation(0);
            group.absolutePosition({
              x: baseline.groupPosition.x + delta.dx,
              y: baseline.groupPosition.y + delta.dy,
            });
            const layer = group.getLayer?.();
            if (layer) {
              layersToRedraw.add(layer);
            }
          } else if (group) {
            const layer = group.getLayer?.();
            if (layer) {
              layersToRedraw.add(layer);
            }
          }
        } catch (groupError) {
          this.debugLog("applyTransientDelta: anchored connector group move failed", {
            id,
            error: groupError,
          });
        }
      });
    } catch (error) {
      this.debugLog("applyTransientDelta: connector routing update failed", { error });
    }
  }

  private flushTransientRedraws(layers: Set<Konva.Layer>): void {
    const dragLayer = this.dragContainer?.getLayer?.();
    if (dragLayer) {
      try {
        dragLayer.batchDraw?.();
      } catch (error) {
        this.debugLog("flushTransientRedraws: drag layer batch failed", { error });
      }
      layers.delete(dragLayer);
    }

    if (layers.size === 0) {
      const stage = this.getStage();
      stage?.batchDraw?.();
      return;
    }

    layers.forEach((layer) => {
      try {
        layer.batchDraw?.();
      } catch (error) {
        this.debugLog("flushTransientRedraws: layer batch failed", { error });
      }
    });
  }

  private moveNodesToDragLayer(
    nodes: Konva.Node[],
    snapshot: ControllerTransformSnapshot,
  ): void {
    const dragGroup = this.dragContainer;
    if (!dragGroup) {
      return;
    }

    this.transientNodeParents.clear();

    const stage = this.getStage();

    nodes.forEach((node) => {
      const elementId = (node.getAttr("elementId") as string | undefined) ?? node.id();
      if (!elementId) {
        return;
      }
      this.moveNodeToDragGroup(node, elementId);
    });

    snapshot.connectors.forEach((_connectorSnapshot, connectorId) => {
      const group = stage?.findOne<Konva.Group>(`#${connectorId}`);
      if (!group) {
        return;
      }
      this.moveNodeToDragGroup(group, connectorId);
    });

    snapshot.drawings.forEach((_drawingSnapshot, drawingId) => {
      const drawingNode = stage?.findOne<Konva.Line>(`#${drawingId}`);
      if (!drawingNode) {
        return;
      }
      this.moveNodeToDragGroup(drawingNode, drawingId);
    });

    dragGroup.getLayer()?.batchDraw?.();
  }

  private moveNodeToDragGroup(node: Konva.Node, elementId: string): void {
    const dragGroup = this.dragContainer;
    if (!dragGroup) {
      return;
    }

    const parent = node.getParent() ?? null;
    if (parent === dragGroup) {
      return;
    }

    if (!this.transientNodeParents.has(elementId)) {
      this.transientNodeParents.set(elementId, parent);
    }

    try {
      node.moveTo(dragGroup);
    } catch (error) {
      this.debugLog("moveNodeToDragGroup failed", { elementId, error });
    }
  }

  private restoreTransientNodes(): void {
    if (this.transientNodeParents.size === 0) {
      return;
    }

    const stage = this.getStage();
    this.transientNodeParents.forEach((parent, elementId) => {
      const node = stage?.findOne<Konva.Node>(`#${elementId}`);
      if (!node) {
        return;
      }

      const target = parent ?? this.storeCtx?.layers.main;
      if (!target) {
        return;
      }

      try {
        node.moveTo(target);
        target.getLayer?.()?.batchDraw?.();
      } catch (error) {
        this.debugLog("restoreTransientNodes: move failed", { elementId, error });
      }
    });

    this.transientNodeParents.clear();
    this.dragContainer?.getLayer()?.batchDraw?.();
  }

  private restoreStageListening(): void {
    if (this.stageListeningBeforeTransform === undefined) {
      return;
    }

    const stage = this.getStage();
    if (stage) {
      try {
        stage.listening(this.stageListeningBeforeTransform);
      } catch (error) {
        this.debugLog("restoreStageListening failed", { error });
      }
    }

    this.stageListeningBeforeTransform = undefined;
  }

  private syncElementsDuringTransform(
    nodes: Konva.Node[],
    source: "drag" | "transform",
    delta?: { dx: number; dy: number },
  ): void {
    if (!nodes || nodes.length === 0) {
      return;
    }

    try {
      elementSynchronizer.updateElementsFromNodes(nodes, source, {
        pushHistory: false,
        batchUpdates: true,
        skipConnectorScheduling: true,
        transformDelta: delta,
      });
    } catch (error) {
      this.debugLog("syncElementsDuringTransform: update failed", { error });
    }
  }

  private captureConnectorBaselines(): void {
    this.connectorBaselines.clear();
    this.activeConnectorIds.clear();

    const ctx = this.storeCtx;
    if (!ctx) {
      return;
    }

    const state = ctx.store.getState();
    const elements = state.elements;
    const selected = state.selectedElementIds;

    if (!elements || !selected) {
      return;
    }

    const selectedIds = Array.isArray(selected)
      ? selected
      : selected instanceof Set
        ? Array.from(selected)
        : [];

    this.registerConnectorBaselinesForElements(selectedIds, true);
  }

  private applyConnectorDelta(delta: { dx: number; dy: number }): void {
    if (this.activeConnectorIds.size === 0) {
      return;
    }

    const snapshot = this.lastTransientSnapshot;
    const movableIds = new Set<string>();

    this.activeConnectorIds.forEach((id) => {
      const baseline = snapshot?.connectorBaselines?.[id];
      if (!baseline || baseline.anchored === false) {
        movableIds.add(id);
      }
    });

    if (movableIds.size === 0) {
      return;
    }

    connectorSelectionManager.moveSelectedConnectors(
      movableIds,
      delta,
      this.connectorBaselines,
    );
  }

  private registerConnectorBaselinesForElements(
    elementIds: Iterable<string>,
    includeConnectorSelf: boolean,
  ): void {
    const ctx = this.storeCtx;
    if (!ctx) {
      return;
    }

    const ids = Array.from(elementIds);
    if (ids.length === 0) {
      return;
    }

    const state = ctx.store.getState();
    const elements = state.elements;
    if (!elements) {
      return;
    }

    const idSet = new Set(ids);
    this.prepareConnectorAdjacency(elements);

    const addBaseline = (connectorId: string, connector: ConnectorElement) => {
      if (this.connectorBaselines.has(connectorId)) {
        return;
      }

      const position = {
        x: typeof connector.x === "number" ? connector.x : 0,
        y: typeof connector.y === "number" ? connector.y : 0,
      };

      this.connectorBaselines.set(connectorId, {
        position,
        from: this.cloneConnectorEndpoint(connector.from),
        to: this.cloneConnectorEndpoint(connector.to),
      });
      this.activeConnectorIds.add(connectorId);
    };

    const connectorIds = this.collectConnectedConnectorIds(elements, idSet);

    if (includeConnectorSelf) {
      idSet.forEach((elementId) => {
        const element = elements.get(elementId);
        if (element?.type === "connector") {
          connectorIds.add(elementId);
        }
      });
    }

    connectorIds.forEach((connectorId) => {
      const element = elements.get(connectorId);
      if (!element || element.type !== "connector") {
        return;
      }
      addBaseline(connectorId, element as ConnectorElement);
    });
  }

  private cloneConnectorEndpoint(
    endpoint: ConnectorEndpoint | undefined,
  ): ConnectorEndpoint | undefined {
    if (!endpoint) {
      return undefined;
    }

    if (endpoint.kind === "point") {
      return {
        kind: "point",
        x: endpoint.x,
        y: endpoint.y,
      };
    }

    return {
      kind: "element",
      elementId: endpoint.elementId,
      anchor: endpoint.anchor,
      offset: endpoint.offset ? { ...endpoint.offset } : undefined,
    };
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
      this.publishTransformCancel();
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
