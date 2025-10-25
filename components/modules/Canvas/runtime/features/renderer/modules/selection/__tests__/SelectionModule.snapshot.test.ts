import type Konva from "konva";
import { describe, expect, it, vi } from "vitest";

vi.mock("konva", () => {
  class MockNode {}
  class MockStage {}
  class MockGroup {
    findOne() {
      return null;
    }
    position() {
      return { x: 0, y: 0 };
    }
    getLayer() {
      return null;
    }
  }
  class MockLine {}
  class MockTransformer {}

  const KonvaMock = {
    Node: MockNode,
    Stage: MockStage,
    Group: MockGroup,
    Line: MockLine,
    Transformer: MockTransformer,
  };

  return { default: KonvaMock };
});

import { SelectionModule } from "../../SelectionModule";
import type { ModuleRendererCtx } from "../../../index";
import type { CanvasElement } from "../../../../../../types";
import type { ConnectorElement } from "../../../../types/connector";

type StubNode = {
  id: () => string;
  getAttr: (key: string) => string | undefined;
  position: () => { x: number; y: number };
};

function createNode(id: string, x: number, y: number): StubNode {
  const pos = { x, y };
  return {
    id: () => id,
    getAttr: (key) => (key === "elementId" ? id : undefined),
    position: () => pos,
  };
}

describe("SelectionModule.buildTransformControllerSnapshot", () => {
  it("captures dependent connectors and drawings for selected nodes", () => {
    const selection = new SelectionModule();

    const shapeA: CanvasElement = {
      id: "shape-a",
      type: "rectangle",
      x: 100,
      y: 100,
      width: 80,
      height: 60,
    };

    const shapeB: CanvasElement = {
      id: "shape-b",
      type: "rectangle",
      x: 300,
      y: 110,
      width: 90,
      height: 50,
    };

    const connector: ConnectorElement = {
      id: "connector-1",
      type: "connector",
      variant: "line",
      x: 0,
      y: 0,
      from: { kind: "element", elementId: "shape-a", anchor: "center" },
      to: { kind: "point", x: 400, y: 140 },
      style: { stroke: "#000", strokeWidth: 2 },
    };

    const drawing: CanvasElement = {
      id: "drawing-1",
      type: "drawing",
      subtype: "pen",
      x: 50,
      y: 75,
      points: [0, 0, 20, 10, 40, 0],
      style: { stroke: "#333", strokeWidth: 3 },
    } as CanvasElement;

    const elements = new Map<string, CanvasElement>([
      [shapeA.id, shapeA],
      [shapeB.id, shapeB],
      [connector.id, connector],
      [drawing.id, drawing],
    ]);

    const connectorShape = {
      setAttr: () => undefined,
    } as unknown as Konva.Shape;

    const connectorGroup = {
      findOne: (selector: string) =>
        selector === ".connector-shape" ? connectorShape : null,
      position: () => ({ x: 150, y: 130 }),
      getLayer: () => null,
    } as unknown as Konva.Group;

    const drawingNode = {
      position: () => ({ x: drawing.x ?? 0, y: drawing.y ?? 0 }),
    } as unknown as Konva.Line;

    const stageStub = {
      findOne: (selector: string) => {
        if (selector === "#connector-1") {
          return connectorGroup;
        }
        if (selector === "#drawing-1") {
          return drawingNode;
        }
        return null;
      },
    } as unknown as Konva.Stage;

    const transformState = {
      snapshot: null,
      transientDelta: null,
      isActive: false,
      beginTransform: vi.fn(),
      updateTransform: vi.fn(),
      clearTransient: vi.fn(),
      commitTransform: vi.fn(),
      cancelTransform: vi.fn(),
    };

    const storeState = {
      elements,
      transform: transformState,
    } as ReturnType<ModuleRendererCtx["store"]["getState"]>;

  const storeCtx = {
      stage: stageStub,
      layers: {
        background: null,
        main: null,
        highlighter: null,
        preview: null,
        overlay: null,
        drag: null,
      },
      store: {
        getState: () => storeState,
        subscribe: (
          selector: (state: typeof storeState) => unknown,
          listener: (next: unknown, prev: unknown) => void,
          options?: { fireImmediately?: boolean },
        ) => {
          if (options?.fireImmediately) {
            const value = selector(storeState);
            listener(value, value);
          }
          return () => void 0;
        },
      },
    } as unknown as ModuleRendererCtx;

    (selection as unknown as { storeCtx: ModuleRendererCtx }).storeCtx = storeCtx;

    const nodes: Konva.Node[] = [
      createNode("shape-a", 100, 100) as unknown as Konva.Node,
      createNode("shape-b", 300, 110) as unknown as Konva.Node,
      createNode("drawing-1", 50, 75) as unknown as Konva.Node,
    ];

    const snapshot = (selection as unknown as {
      buildTransformControllerSnapshot(nodes: Konva.Node[]): ReturnType<
        SelectionModule["buildTransformControllerSnapshot"]
      >;
    }).buildTransformControllerSnapshot(nodes);

    expect(snapshot).toBeTruthy();
    expect(snapshot?.connectors.size).toBe(1);
    expect(snapshot?.connectors.has("connector-1")).toBe(true);
    expect(snapshot?.drawings.size).toBe(1);
    expect(snapshot?.drawings.has("drawing-1")).toBe(true);

    const connectorSnapshot = snapshot?.connectors.get("connector-1");
    expect(connectorSnapshot?.startFrom).toEqual({
      kind: "point",
      x: shapeA.x + (shapeA.width ?? 0) / 2,
      y: shapeA.y + (shapeA.height ?? 0) / 2,
    });
  });
});
