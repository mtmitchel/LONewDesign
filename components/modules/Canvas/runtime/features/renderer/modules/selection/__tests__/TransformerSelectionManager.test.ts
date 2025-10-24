import type Konva from "konva";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TransformerSelectionManager } from "../managers/TransformerSelectionManager";
import { transformStateManager } from "../managers/TransformStateManager";
import { filterTransformableNodes, resolveElementsToNodes } from "../SelectionResolver";
import type { TransformLifecycleCoordinator } from "../controllers/TransformLifecycleCoordinator";

type KonvaNode = {
  id: () => string;
  name: () => string;
  getAttr: (name: string) => unknown;
} & Record<string, unknown>;

vi.mock("../SelectionResolver", () => ({
  resolveElementsToNodes: vi.fn(),
  filterTransformableNodes: vi.fn(),
}));

describe("TransformerSelectionManager", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(transformStateManager, "shouldLockAspectRatio").mockReturnValue(false);
    vi.mocked(resolveElementsToNodes).mockReturnValue([]);
    vi.mocked(filterTransformableNodes).mockReturnValue([]);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const createNode = (id: string): Konva.Node =>
    ({
      id: () => id,
      name: () => "shape",
      getAttr: (attr: string) => (attr === "elementId" ? id : undefined),
    } as unknown as Konva.Node);

  const createTransformLifecycle = () => {
    const attach = vi.fn();
    const detach = vi.fn();
    const setKeepRatio = vi.fn();
    const show = vi.fn();
    const ensureVisible = vi.fn();

    const coordinator = {
      attach,
      detach,
      setKeepRatio,
      show,
      ensureVisible,
    } as unknown as TransformLifecycleCoordinator;

    return { coordinator, attach, detach, setKeepRatio, show, ensureVisible };
  };

  it("attaches resolved nodes after the scheduled delay", () => {
    const node = createNode("a");
    vi.mocked(resolveElementsToNodes).mockReturnValue([node]);
    vi.mocked(filterTransformableNodes).mockReturnValue([node]);
    vi.spyOn(transformStateManager, "shouldLockAspectRatio").mockReturnValue(true);

    const { coordinator, attach, detach, setKeepRatio, show } = createTransformLifecycle();
    const manager = new TransformerSelectionManager({
      transformLifecycle: coordinator,
      getStage: () => ({} as unknown as Konva.Stage),
      getLayers: () => [({} as unknown as Konva.Container)],
    });

    manager.scheduleAttach(new Set(["a"]), { delay: 5 });

    expect(attach).not.toHaveBeenCalled();

    vi.advanceTimersByTime(5);

    expect(detach).toHaveBeenCalledTimes(1);
    expect(attach).toHaveBeenCalledWith([node]);
    expect(setKeepRatio).toHaveBeenCalledWith(true);
    expect(show).toHaveBeenCalled();
  });

  it("detaches transformer when selection is empty", () => {
    const { coordinator, detach, setKeepRatio } = createTransformLifecycle();
    const manager = new TransformerSelectionManager({
      transformLifecycle: coordinator,
      getStage: () => ({} as unknown as Konva.Stage),
      getLayers: () => [({} as unknown as Konva.Container)],
    });

    manager.scheduleAttach(new Set());

    expect(setKeepRatio).toHaveBeenCalledWith(false);
    expect(detach).toHaveBeenCalledTimes(1);
  });

  it("cancels pending attachments", () => {
    const node = createNode("b");
    vi.mocked(resolveElementsToNodes).mockReturnValue([node]);
    vi.mocked(filterTransformableNodes).mockReturnValue([node]);

    const { coordinator, attach, detach } = createTransformLifecycle();
    const manager = new TransformerSelectionManager({
      transformLifecycle: coordinator,
      getStage: () => ({} as unknown as Konva.Stage),
      getLayers: () => [({} as unknown as Konva.Container)],
    });

    manager.scheduleAttach(new Set(["b"]), { delay: 50 });
    manager.cancelPending();

    vi.runAllTimers();

    expect(attach).not.toHaveBeenCalled();
    expect(detach).not.toHaveBeenCalled();
  });
});
