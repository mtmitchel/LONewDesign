import type Konva from "konva";
import { describe, expect, it, vi } from "vitest";

vi.mock("konva", () => {
  class MockNode {
    id = () => "";
    getAttr = () => undefined;
    position = () => ({ x: 0, y: 0 });
    moveTo = () => undefined;
    getParent = () => null;
  }

  class MockLayer {
    batchDraw = vi.fn();
  }

  class MockGroup {
    position = vi.fn(() => ({ x: 0, y: 0 }));
    getLayer = vi.fn(() => new MockLayer());
    scale = vi.fn();
    rotation = vi.fn();
    findOne = vi.fn(() => null);
    moveTo = vi.fn();
  }

  class MockLine {
    position = vi.fn(() => ({ x: 0, y: 0 }));
    getLayer = vi.fn(() => new MockLayer());
    moveTo = vi.fn();
  }

  class MockStage {
    findOne = vi.fn(() => null);
    batchDraw = vi.fn();
    listening = vi.fn(() => true);
  }

  const KonvaMock = {
    Node: MockNode,
    Layer: MockLayer,
    Group: MockGroup,
    Line: MockLine,
    Stage: MockStage,
    Container: class MockContainer {},
    Shape: class MockShape {},
  };

  return { default: KonvaMock };
});

vi.mock("../managers", () => {
  const connectorSelectionManager = {
    updateVisuals: vi.fn(),
    updateShapeGeometry: vi.fn(),
    updateElement: vi.fn(),
    setLiveRoutingEnabled: vi.fn(),
    moveSelectedConnectors: vi.fn(),
    destroy: vi.fn(),
    reset: vi.fn(),
  };

  const transformStateManager = {
    beginTransform: vi.fn(),
    progressTransform: vi.fn(),
    endTransform: vi.fn(),
    finalizeTransform: vi.fn(),
  };

  const elementSynchronizer = {
    updateElementsFromNodes: vi.fn(),
  };

  class SelectionSubscriptionManager {
    constructor(..._args: unknown[]) {}
    dispose() {}
  }

  class TransformerSelectionManager {
    constructor(..._args: unknown[]) {}
    destroy() {}
  }

  class ConnectorSelectionOrchestrator {
    handleTransformBegin() {}
    handleTransformProgress() {}
    handleTransformEnd() { return false; }
  }

  class MindmapSelectionOrchestrator {
    handleTransformBegin() {}
    handleTransformProgress() {}
    handleTransformEnd() { return false; }
  }

  return {
    connectorSelectionManager,
    transformStateManager,
    elementSynchronizer,
    SelectionSubscriptionManager,
    TransformerSelectionManager,
    ConnectorSelectionOrchestrator,
    MindmapSelectionOrchestrator,
  };
});

import { SelectionModule } from "../../SelectionModule";
import { connectorSelectionManager, transformStateManager } from "../managers";

type TransformSnapshotState = {
  elementBaselines: Record<string, { x: number; y: number }>;
  drawingBaselines: Record<string, { x: number; y: number; points: number[] }>;
  connectorBaselines: Record<
    string,
    {
      startFrom: { kind: "point"; x: number; y: number };
      startTo: { kind: "point"; x: number; y: number };
      originalFrom: { kind: "element"; elementId: string; anchor?: string } | { kind: "point"; x: number; y: number };
      originalTo: { kind: "element"; elementId: string; anchor?: string } | { kind: "point"; x: number; y: number };
      groupPosition?: { x: number; y: number } | null;
      anchored: boolean;
    }
  >;
};

describe("SelectionModule transient routing", () => {
  it("routes anchored connector updates and batches redraws once per delta", () => {
    const selection = new SelectionModule();

  const dragLayer = { batchDraw: vi.fn() } as unknown as Konva.Layer;
    const dragContainer = {
      getLayer: vi.fn(() => dragLayer),
    } as unknown as Konva.Group;

    const drawingNode = {
      position: vi.fn(),
      getLayer: vi.fn(() => dragLayer),
    } as unknown as Konva.Line;

    const connectorGroup = {
      position: vi.fn(),
      getLayer: vi.fn(() => dragLayer),
      scale: vi.fn(),
      rotation: vi.fn(),
    } as unknown as Konva.Group;

    const stage = {
      findOne: vi.fn((selector: string) => {
        if (selector === "#drawing-1") {
          return drawingNode;
        }
        if (selector === "#connector-1") {
          return connectorGroup;
        }
        return null;
      }),
      batchDraw: vi.fn(),
    } as unknown as Konva.Stage;

    const updateVisualsSpy = vi.spyOn(connectorSelectionManager, "updateVisuals").mockImplementation(() => undefined);

    (selection as unknown as { dragContainer?: Konva.Group }).dragContainer = dragContainer;
    (selection as unknown as { getStage: () => Konva.Stage | null }).getStage = () => stage;

    const snapshot: TransformSnapshotState = {
      elementBaselines: {},
      drawingBaselines: {
        "drawing-1": { x: 10, y: 20, points: [0, 0, 10, 10] },
      },
      connectorBaselines: {
        "connector-1": {
          startFrom: { kind: "point", x: 0, y: 0 },
          startTo: { kind: "point", x: 15, y: 10 },
          originalFrom: { kind: "element", elementId: "shape-a", anchor: "center" },
          originalTo: { kind: "element", elementId: "shape-b", anchor: "center" },
          groupPosition: { x: 5, y: 6 },
          anchored: true,
        },
      },
    };

    (selection as unknown as {
      handleTransformState(
        snapshot: TransformSnapshotState | null,
        delta: { dx: number; dy: number } | null,
        isActive: boolean,
      ): void;
    }).handleTransformState(snapshot, { dx: 3, dy: -2 }, true);

    expect(drawingNode.position).toHaveBeenCalledWith({ x: 13, y: 18 });
    expect(connectorGroup.position).not.toHaveBeenCalled();
    expect(connectorGroup.scale).toHaveBeenCalledWith({ x: 1, y: 1 });
    expect(connectorGroup.rotation).toHaveBeenCalledWith(0);
  expect(updateVisualsSpy).toHaveBeenCalledWith({ dx: 3, dy: -2 });
  expect(dragLayer.batchDraw).toHaveBeenCalled();
  expect(stage.batchDraw).toHaveBeenCalled();
  });
});

describe("SelectionModule stage lifecycle", () => {
  it("disables stage hit detection during transform and restores afterwards", () => {
    const selection = new SelectionModule();

    const stage = {
      _listening: true,
      listening: vi.fn(function (this: { _listening: boolean }, flag?: boolean) {
        if (typeof flag === "boolean") {
          this._listening = flag;
          return this;
        }
        return this._listening;
      }),
      findOne: vi.fn(() => null),
    } as unknown as Konva.Stage;

    const beginSpy = vi
      .spyOn(transformStateManager, "beginTransform")
      .mockImplementation(() => undefined);
    const finalizeSpy = vi
      .spyOn(transformStateManager, "finalizeTransform")
      .mockImplementation(() => undefined);

    const snapshot = {
      basePositions: new Map(),
      connectors: new Map(),
      drawings: new Map(),
      mindmapEdges: new Map(),
      movedMindmapNodes: new Set(),
    };

    Object.assign(selection as unknown as Record<string, unknown>, {
      getStage: () => stage,
      captureConnectorBaselines: vi.fn(),
      moveNodesToDragLayer: vi.fn(),
      publishTransformBegin: vi.fn(),
      publishTransformCancel: vi.fn(),
      publishTransformCommit: vi.fn(),
      transformController: {
        clearSnapshot: vi.fn(),
        start: vi.fn(),
        release: vi.fn(),
      },
      buildTransformControllerSnapshot: vi.fn(() => snapshot),
    });

    const nodes = [
      {
        id: () => "shape-1",
        getAttr: () => "shape-1",
        position: () => ({ x: 0, y: 0 }),
      },
    ] as unknown as Konva.Node[];

    (selection as unknown as {
      beginSelectionTransform(nodes: Konva.Node[], source: "drag" | "transform"): void;
    }).beginSelectionTransform(nodes, "drag");

  expect(stage.listening).toHaveBeenLastCalledWith(false);

    (selection as unknown as {
      endSelectionTransform(nodes: Konva.Node[], source: "drag" | "transform"): void;
    }).endSelectionTransform(nodes, "drag");

    expect(stage.listening).toHaveBeenLastCalledWith(true);

    beginSpy.mockRestore();
    finalizeSpy.mockRestore();
  });

  it("leaves stage hit detection untouched when no snapshot is produced", () => {
    const selection = new SelectionModule();

    const stage = {
      _listening: true,
      listening: vi.fn(function (this: { _listening: boolean }, flag?: boolean) {
        if (typeof flag === "boolean") {
          this._listening = flag;
          return this;
        }
        return this._listening;
      }),
      findOne: vi.fn(() => null),
    } as unknown as Konva.Stage;

    const beginSpy = vi
      .spyOn(transformStateManager, "beginTransform")
      .mockImplementation(() => undefined);

    const publishCancel = vi.fn();
    const captureBaselines = vi.fn();

    Object.assign(selection as unknown as Record<string, unknown>, {
      getStage: () => stage,
      captureConnectorBaselines: captureBaselines,
      moveNodesToDragLayer: vi.fn(),
      publishTransformBegin: vi.fn(),
      publishTransformCancel: publishCancel,
      transformController: {
        clearSnapshot: vi.fn(),
        start: vi.fn(),
        release: vi.fn(),
      },
      buildTransformControllerSnapshot: vi.fn(() => null),
    });

    const nodes = [
      {
        id: () => "shape-1",
        getAttr: () => "shape-1",
        position: () => ({ x: 0, y: 0 }),
      },
    ] as unknown as Konva.Node[];

    (selection as unknown as {
      beginSelectionTransform(nodes: Konva.Node[], source: "drag" | "transform"): void;
    }).beginSelectionTransform(nodes, "drag");

    expect(stage.listening).not.toHaveBeenCalledWith(false);
    expect(publishCancel).toHaveBeenCalledTimes(1);
    expect(captureBaselines).not.toHaveBeenCalled();

    beginSpy.mockRestore();
  });

  it("restores stage hit detection when transform state clears while a transform is active", () => {
    const selection = new SelectionModule();

    const stage = {
      _listening: true,
      listening: vi.fn(function (this: { _listening: boolean }, flag?: boolean) {
        if (typeof flag === "boolean") {
          this._listening = flag;
          return this;
        }
        return this._listening;
      }),
      findOne: vi.fn(() => null),
    } as unknown as Konva.Stage;

    const beginSpy = vi
      .spyOn(transformStateManager, "beginTransform")
      .mockImplementation(() => undefined);

    Object.assign(selection as unknown as Record<string, unknown>, {
      getStage: () => stage,
      captureConnectorBaselines: vi.fn(),
      moveNodesToDragLayer: vi.fn(),
      publishTransformBegin: vi.fn(),
      transformController: {
        clearSnapshot: vi.fn(),
        start: vi.fn(),
        release: vi.fn(),
        getSnapshot: vi.fn(() => null),
        computeDelta: vi.fn(() => null),
      },
    });

    const snapshot = {
      basePositions: new Map(),
      connectors: new Map(),
      drawings: new Map(),
      mindmapEdges: new Map(),
      movedMindmapNodes: new Set(),
    };

    const snapshotSpy = vi
      .spyOn(selection as unknown as SelectionModule & { buildTransformControllerSnapshot: () => unknown }, "buildTransformControllerSnapshot")
      .mockReturnValue(snapshot);

    const nodes = [
      {
        id: () => "shape-1",
        getAttr: () => "shape-1",
        position: () => ({ x: 0, y: 0 }),
      },
    ] as unknown as Konva.Node[];

    (selection as unknown as {
      beginSelectionTransform(nodes: Konva.Node[], source: "drag" | "transform"): void;
    }).beginSelectionTransform(nodes, "drag");

    expect(stage.listening).toHaveBeenCalledWith(false);

    (selection as unknown as {
      handleTransformState(
        snapshot: TransformSnapshotState | null,
        delta: { dx: number; dy: number } | null,
        isActive: boolean,
      ): void;
    }).handleTransformState(null, null, false);

    expect(stage.listening).toHaveBeenLastCalledWith(true);

    beginSpy.mockRestore();
    snapshotSpy.mockRestore();
  });

  it("restores transient nodes to their original parents on commit", () => {
    const selection = new SelectionModule();

    const mainLayer = {
      name: () => "main",
      getLayer: vi.fn(function (this: unknown) {
        return this as Konva.Layer;
      }),
    } as unknown as Konva.Layer;

    const dragLayer = {
      batchDraw: vi.fn(),
    } as unknown as Konva.Layer;

    const dragGroup = {
      getLayer: () => dragLayer,
      moveTo: vi.fn(),
    } as unknown as Konva.Group;

    const nodesById = new Map<string, Konva.Node>();

    const makeNode = (id: string) => {
      const node = {
        id: () => id,
        getAttr: (key: string) => (key === "elementId" ? id : undefined),
        position: () => ({ x: 0, y: 0 }),
        getParent: vi.fn(() => mainLayer),
        moveTo: vi.fn(),
        getLayer: () => mainLayer,
      } as unknown as Konva.Node;
      nodesById.set(id, node);
      return node;
    };

    const nodes = [makeNode("shape-1"), makeNode("shape-2")];

    const stage = {
      findOne: vi.fn((selector: string) => nodesById.get(selector.slice(1)) ?? null),
      listening: vi.fn(function (this: { _listening?: boolean }, flag?: boolean) {
        if (typeof flag === "boolean") {
          this._listening = flag;
          return this;
        }
        return this._listening ?? true;
      }),
      batchDraw: vi.fn(),
    } as unknown as Konva.Stage;

    const transformState = {
      beginTransform: vi.fn(),
      updateTransform: vi.fn(),
      clearTransient: vi.fn(),
      commitTransform: vi.fn(),
      cancelTransform: vi.fn(),
    };

    const storeState = {
      elements: new Map<string, { type?: string }>(),
      selectedElementIds: new Set(nodesById.keys()),
      transform: transformState,
    };

    const storeCtx = {
      stage,
      layers: {
        main: mainLayer,
        overlay: null,
        drag: dragGroup,
      },
      store: {
        getState: () => storeState,
      },
    };

    const snapshot = {
      basePositions: new Map<string, { x: number; y: number }>([
        ["shape-1", { x: 0, y: 0 }],
        ["shape-2", { x: 0, y: 0 }],
      ]),
      connectors: new Map(),
      drawings: new Map(),
      mindmapEdges: new Map(),
      movedMindmapNodes: new Set(),
    };

    Object.assign(selection as unknown as Record<string, unknown>, {
      dragContainer: dragGroup,
      storeCtx,
      getStage: () => stage,
      transformController: {
        clearSnapshot: vi.fn(),
        start: vi.fn(),
        release: vi.fn(),
        getSnapshot: vi.fn(() => snapshot),
        computeDelta: vi.fn(() => null),
      },
    });

    const snapshotSpy = vi
      .spyOn(selection as unknown as SelectionModule & { buildTransformControllerSnapshot: () => unknown }, "buildTransformControllerSnapshot")
      .mockReturnValue(snapshot);

    (selection as unknown as {
      beginSelectionTransform(nodes: Konva.Node[], source: "drag" | "transform"): void;
    }).beginSelectionTransform(nodes, "drag");

    nodes.forEach((node) => {
      expect((node as unknown as { moveTo: ReturnType<typeof vi.fn> }).moveTo).toHaveBeenCalledWith(dragGroup);
    });

    (selection as unknown as {
      endSelectionTransform(nodes: Konva.Node[], source: "drag" | "transform"): void;
    }).endSelectionTransform(nodes, "drag");

    nodes.forEach((node) => {
      expect((node as unknown as { moveTo: ReturnType<typeof vi.fn> }).moveTo).toHaveBeenLastCalledWith(mainLayer);
    });

    const parentCache = (selection as unknown as { transientNodeParents: Map<string, Konva.Container | null> }).transientNodeParents;
    expect(parentCache.size).toBe(0);

    snapshotSpy.mockRestore();
  });

  it("restores stage listening and transient nodes when the transform stream deactivates", () => {
    const selection = new SelectionModule();

    const stage = {
      _listening: false,
      listening: vi.fn(function (this: { _listening: boolean }, flag?: boolean) {
        if (typeof flag === "boolean") {
          this._listening = flag;
          return this;
        }
        return this._listening;
      }),
    } as unknown as Konva.Stage;

    const restoreNodes = vi.fn();

    Object.assign(selection as unknown as Record<string, unknown>, {
      getStage: () => stage,
    });

    Object.assign(selection as unknown as { restoreTransientNodes: () => void }, {
      restoreTransientNodes: restoreNodes,
    });

    Object.assign(selection as unknown as { stageListeningBeforeTransform?: boolean }, {
      stageListeningBeforeTransform: true,
    });

    (selection as unknown as {
      handleTransformState(
        snapshot: TransformSnapshotState | null,
        delta: { dx: number; dy: number } | null,
        isActive: boolean,
      ): void;
    }).handleTransformState(null, null, false);

    expect(stage.listening).toHaveBeenCalledWith(true);
    expect(restoreNodes).toHaveBeenCalledTimes(1);
    expect((selection as unknown as { stageListeningBeforeTransform?: boolean }).stageListeningBeforeTransform).toBeUndefined();
  });

  it("unmount tears down subscriptions and restores stage state", () => {
    const selection = new SelectionModule();

    const stage = {
      _listening: false,
      listening: vi.fn(function (this: { _listening: boolean }, flag?: boolean) {
        if (typeof flag === "boolean") {
          this._listening = flag;
          return this;
        }
        return this._listening;
      }),
    } as unknown as Konva.Stage;

    const cancelPending = vi.fn();
    const detach = vi.fn();
    const stop = vi.fn();
    const transformerDestroy = vi.fn();
    const connectorDestroy = vi.fn();
    const transformerManagerDestroy = vi.fn();
    const keyboardDestroy = vi.fn();
    const selectionStateDestroy = vi.fn();
    const restoreNodes = vi.fn();
    const transformCancel = vi.fn();
    const transformSubscription = vi.fn();

    Object.assign(selection as unknown as Record<string, unknown>, {
      connectorSelectionOrchestrator: { cancelPending, destroy: vi.fn() },
      transformLifecycle: { detach } as { detach: () => void },
      selectionSubscriptionManager: { stop },
      transformerSelectionManager: { destroy: transformerDestroy },
      connectorSelectionManager: { destroy: connectorDestroy },
      transformerManager: { destroy: transformerManagerDestroy },
      keyboardHandler: { destroy: keyboardDestroy },
      selectionStateManager: { destroy: selectionStateDestroy },
      getStage: () => stage,
      restoreTransientNodes: restoreNodes,
      transformSubscription,
      dragContainer: { getLayer: () => ({ batchDraw: vi.fn() }) },
      storeCtx: {
        store: {
          getState: () => ({
            transform: {
              cancelTransform: transformCancel,
            },
          }),
        },
      },
    });

    Object.assign(selection as unknown as { stageListeningBeforeTransform?: boolean }, {
      stageListeningBeforeTransform: true,
    });

    (selection as unknown as { unmount(): void }).unmount();

    expect(cancelPending).toHaveBeenCalledTimes(1);
    expect(detach).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
    expect(transformerDestroy).toHaveBeenCalledTimes(1);
    expect(connectorDestroy).toHaveBeenCalledTimes(1);
    expect(transformerManagerDestroy).toHaveBeenCalledTimes(1);
    expect(keyboardDestroy).toHaveBeenCalledTimes(1);
    expect(selectionStateDestroy).toHaveBeenCalledTimes(1);
    expect(transformSubscription).toHaveBeenCalledTimes(1);
    expect(transformCancel).toHaveBeenCalledTimes(1);
    expect(stage.listening).toHaveBeenCalledWith(true);
    expect(restoreNodes).toHaveBeenCalledTimes(1);
  });
});
