import type { ModuleRendererCtx } from "../../../types";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import { ConnectorSelectionOrchestrator } from "../managers/ConnectorSelectionOrchestrator";
import type { ConnectorSelectionOrchestratorConfig } from "../managers/ConnectorSelectionOrchestrator";
import type { ConnectorSelectionManager } from "../managers/ConnectorSelectionManager";

describe("ConnectorSelectionOrchestrator", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const createStoreCtx = (state: Record<string, unknown>): ModuleRendererCtx => {
    const storeFn = Object.assign(
      () => state,
      {
        getState: () => state,
        subscribe: vi.fn(),
      },
    );

    return {
      stage: {} as unknown as ModuleRendererCtx["stage"],
      layers: {
        background: {} as unknown as ModuleRendererCtx["layers"]["background"],
        main: {} as unknown as ModuleRendererCtx["layers"]["main"],
        highlighter: {} as unknown as ModuleRendererCtx["layers"]["highlighter"],
        preview: {} as unknown as ModuleRendererCtx["layers"]["preview"],
        overlay: {} as unknown as ModuleRendererCtx["layers"]["overlay"],
      },
  store: (storeFn as unknown) as ModuleRendererCtx["store"],
    };
  };

  it("handles connector-only selections and shows connector highlight", () => {
    const state = {
      selectedElementIds: new Set(["connector-1"]),
      elements: new Map([
        ["connector-1", { type: "connector" }],
      ]),
      element: {
        getById: (id: string) => ({ type: id === "connector-1" ? "connector" : "shape" }),
      },
    };

    const ctx = createStoreCtx(state);
    const showSelection = vi.fn();
    const connectorManager = ({ showSelection } as { showSelection: (id: string) => void }) as unknown as ConnectorSelectionManager;

    const config = {
      getStoreContext: () => ctx,
  getConnectorSelectionManager: () => connectorManager,
    } as unknown as ConnectorSelectionOrchestratorConfig;

    const orchestrator = new ConnectorSelectionOrchestrator(config);

    const handled = orchestrator.handleSelectionChange(new Set(["connector-1"]));

    expect(handled).toBe(true);

    vi.advanceTimersByTime(100);

    expect(showSelection).toHaveBeenCalledWith("connector-1");
  });

  it("returns false when selection includes non-connector elements", () => {
    const state = {
      selectedElementIds: new Set(["connector-1", "shape-1"]),
      elements: new Map([
        ["connector-1", { type: "connector" }],
        ["shape-1", { type: "rectangle" }],
      ]),
    };

    const ctx = createStoreCtx(state);
    const showSelection = vi.fn();
    const connectorManager = ({ showSelection } as { showSelection: (id: string) => void }) as unknown as ConnectorSelectionManager;

    const config = {
      getStoreContext: () => ctx,
      getConnectorSelectionManager: () => connectorManager,
    } as unknown as ConnectorSelectionOrchestratorConfig;

    const orchestrator = new ConnectorSelectionOrchestrator(config);

    const handled = orchestrator.handleSelectionChange(new Set(["connector-1", "shape-1"]));

    expect(handled).toBe(false);
    vi.runAllTimers();
    expect(showSelection).not.toHaveBeenCalled();
  });
});
