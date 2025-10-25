import { describe, expect, it, afterEach } from "vitest";
import { useUnifiedCanvasStore } from "../unifiedCanvasStore";

const resetTransformState = () => {
  const transform = useUnifiedCanvasStore.getState().transform;
  transform.cancelTransform();
  transform.clearTransient();
};

afterEach(() => {
  resetTransformState();
  const state = useUnifiedCanvasStore.getState();
  // Remove any transient elements added during tests
  const cleanupIds: string[] = [];
  state.elements?.forEach((element, id) => {
    if (element?.type === "rectangle" && id.startsWith("test-element-")) {
      cleanupIds.push(id);
    }
  });
  cleanupIds.forEach((id) => state.removeElement?.(id, { pushHistory: false }));
});

describe("transform slice", () => {
  it("tracks snapshot and transient delta lifecycle", () => {
    const { transform } = useUnifiedCanvasStore.getState();
    expect(transform.snapshot).toBeNull();
    expect(transform.transientDelta).toBeNull();
    expect(transform.isActive).toBe(false);

    const snapshot = {
      elementBaselines: { "shape-1": { x: 10, y: 20 } },
      connectorBaselines: {},
      drawingBaselines: {},
    };

    transform.beginTransform(snapshot);
    const nextState = useUnifiedCanvasStore.getState().transform;
    expect(nextState.snapshot).toEqual(snapshot);
    expect(nextState.isActive).toBe(true);

    transform.updateTransform({ dx: 5, dy: -3 });
    expect(useUnifiedCanvasStore.getState().transform.transientDelta).toEqual({
      dx: 5,
      dy: -3,
    });

    transform.clearTransient();
    expect(useUnifiedCanvasStore.getState().transform.transientDelta).toBeNull();

    transform.cancelTransform();
    const finalState = useUnifiedCanvasStore.getState().transform;
    expect(finalState.snapshot).toBeNull();
    expect(finalState.isActive).toBe(false);
  });

  it("applies commit patches to canonical store state", () => {
    const elementId = "test-element-1";
    useUnifiedCanvasStore.getState().addElement?.(
      {
        id: elementId,
        type: "rectangle",
        x: 0,
        y: 0,
        width: 40,
        height: 20,
      },
      { pushHistory: false },
    );

    const snapshot = {
      elementBaselines: { [elementId]: { x: 0, y: 0 } },
      connectorBaselines: {},
      drawingBaselines: {},
    };

    const { transform } = useUnifiedCanvasStore.getState();
    transform.beginTransform(snapshot);
    transform.updateTransform({ dx: 10, dy: 15 });

    transform.commitTransform({
      patches: [
        {
          id: elementId,
          patch: { x: 10, y: 15 },
        },
      ],
      pushHistory: false,
    });

    const updatedElement = useUnifiedCanvasStore
      .getState()
      .elements?.get(elementId);
    expect(updatedElement?.x).toBe(10);
    expect(updatedElement?.y).toBe(15);
    expect(useUnifiedCanvasStore.getState().transform.isActive).toBe(false);
  });
});
