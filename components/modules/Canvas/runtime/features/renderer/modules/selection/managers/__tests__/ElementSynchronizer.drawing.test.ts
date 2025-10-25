import type Konva from "konva";
import { beforeEach, describe, expect, it } from "vitest";

import { ElementSynchronizerImpl } from "../ElementSynchronizer";
import { useUnifiedCanvasStore } from "../../../../../stores/unifiedCanvasStore";
import type { CanvasElement } from "../../../../../../../types";

type MockKonvaNode = Konva.Node & {
  __setPosition: (x: number, y: number) => void;
};

const translatePoints = (
  baseline: number[],
  delta: { dx: number; dy: number },
): number[] =>
  baseline.map((value, index) =>
    typeof value === "number"
      ? value + (index % 2 === 0 ? delta.dx : delta.dy)
      : value,
  );

const createDrawingElement = (): CanvasElement => ({
  id: "drawing-1",
  type: "drawing",
  subtype: "pen",
  x: 40,
  y: 60,
  width: 120,
  height: 80,
  points: [40, 60, 80, 90, 120, 140, 160, 180],
});

const createMockDrawingNode = (
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
): MockKonvaNode => {
  const position = { x, y };
  const attrs: Record<string, unknown> = {
    elementId: id,
    nodeType: "drawing",
    width,
    height,
  };

  return {
    id: () => id,
    getAttr: (key: string) => attrs[key],
    position: () => position,
    scale: () => ({ x: 1, y: 1 }),
    rotation: () => 0,
    skew: () => ({ x: 0, y: 0 }),
    size: () => ({ width, height }),
    __setPosition: (nextX: number, nextY: number) => {
      position.x = nextX;
      position.y = nextY;
    },
  } as unknown as MockKonvaNode;
};

describe("ElementSynchronizer – drawing delta propagation", () => {
  beforeEach(() => {
    useUnifiedCanvasStore.setState((state) => {
      state.elements = new Map();
      state.elementOrder = [];
      state.selectedElementIds = new Set();
      state.selectionVersion = 0;
      state.lastSelectedId = undefined;
      state.isTransforming = false;
    });
  });

  it("translates drawing points from transform deltas without cumulative drift", () => {
    const element = createDrawingElement();
    useUnifiedCanvasStore.setState((state) => {
      state.elements = new Map([[element.id, { ...element }]]);
      state.elementOrder = [element.id];
    });

    const synchronizer = new ElementSynchronizerImpl();
    const node = createMockDrawingNode(
      element.id,
      element.x,
      element.y,
      element.width ?? 0,
      element.height ?? 0,
    );

    const deltaA = { dx: 18, dy: -12 };
    node.__setPosition(element.x + deltaA.dx, element.y + deltaA.dy);

    synchronizer.updateElementsFromNodes([node], "drag", {
      transformDelta: deltaA,
      batchUpdates: true,
      pushHistory: false,
      skipConnectorScheduling: true,
    });

    let updated = useUnifiedCanvasStore.getState().elements.get(element.id);
    expect(updated?.points).toEqual(translatePoints(element.points ?? [], deltaA));
    expect(updated?.x).toBe(element.x + deltaA.dx);
    expect(updated?.y).toBe(element.y + deltaA.dy);

    const deltaB = { dx: 24, dy: -6 };
    node.__setPosition(element.x + deltaB.dx, element.y + deltaB.dy);

    synchronizer.updateElementsFromNodes([node], "drag", {
      transformDelta: deltaB,
      batchUpdates: true,
      pushHistory: false,
      skipConnectorScheduling: true,
    });

    updated = useUnifiedCanvasStore.getState().elements.get(element.id);
    expect(updated?.points).toEqual(translatePoints(element.points ?? [], deltaB));
    expect(updated?.x).toBe(element.x + deltaB.dx);
    expect(updated?.y).toBe(element.y + deltaB.dy);

    synchronizer.updateElementsFromNodes([node], "transform", {
      pushHistory: true,
      batchUpdates: true,
      skipConnectorScheduling: true,
    });

    const committedPoints = translatePoints(element.points ?? [], deltaB);
    const committedX = element.x + deltaB.dx;
    const committedY = element.y + deltaB.dy;

    const deltaC = { dx: -5, dy: 9 };
    node.__setPosition(committedX + deltaC.dx, committedY + deltaC.dy);

    synchronizer.updateElementsFromNodes([node], "drag", {
      transformDelta: deltaC,
      batchUpdates: true,
      pushHistory: false,
      skipConnectorScheduling: true,
    });

    updated = useUnifiedCanvasStore.getState().elements.get(element.id);
    expect(updated?.points).toEqual(translatePoints(committedPoints, deltaC));
    expect(updated?.x).toBe(committedX + deltaC.dx);
    expect(updated?.y).toBe(committedY + deltaC.dy);
  });
});
