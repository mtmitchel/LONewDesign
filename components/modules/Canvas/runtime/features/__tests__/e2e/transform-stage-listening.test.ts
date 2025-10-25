// @ts-nocheck
import { test, expect } from "@playwright/test";
import type Konva from "konva";
import { launchTestCanvas, waitForCanvasReady } from "./test-utils";

async function readStageListeningState(page: Parameters<typeof test>[0]["page"]) {
  return await page.evaluate(() => {
    const stage = (window as typeof window & { canvasStage?: { listening?: () => boolean } }).canvasStage;
    return stage?.listening?.();
  });
}

test.describe("Canvas transform lifecycle", () => {
  test("stage listening toggles off during transform and restores afterwards", async ({ page }) => {
    await launchTestCanvas(page);
    await waitForCanvasReady(page);
    await page.waitForFunction(() => typeof window.selectionModule !== "undefined", {
      timeout: 15000,
    });

    await page.evaluate(() => {
      const store = window.useUnifiedCanvasStore?.getState();
      if (!store) {
        throw new Error("Canvas store unavailable");
      }

      const addElement = store.addElement;
      if (typeof addElement !== "function") {
        throw new Error("addElement helper missing from store");
      }

      const elementId = "test-sticky-1";
      addElement({
        id: elementId,
        type: "sticky-note",
        x: 220,
        y: 220,
        width: 200,
        height: 150,
        rotation: 0,
        text: "Test sticky",
        style: {
          fill: "#FFEFC8",
        },
      });

      store.setSelection?.([elementId]);
    });
    
    await page.waitForFunction(() => {
      const selectionModule = (window as typeof window & { selectionModule?: Record<string, unknown> }).selectionModule as
        | {
            transformLifecycle?: {
              getTransformer?: () => { nodes?: () => unknown[] };
            };
          }
        | undefined;
      const transformer = selectionModule?.transformLifecycle?.getTransformer?.();
      const nodes = typeof transformer?.nodes === "function" ? transformer.nodes() : [];
      return Array.isArray(nodes) && nodes.length > 0;
    }, { timeout: 5000 });

    // Verify stage listening is true before transform
    const listeningBefore = await readStageListeningState(page);
    expect(listeningBefore).toBe(true);

    // Begin transform via SelectionModule internals
    await page.evaluate(() => {
      const selectionModule = (window as typeof window & { selectionModule?: Record<string, unknown> }).selectionModule as
        | {
            transformLifecycle?: {
              getTransformer?: () => { nodes?: () => Konva.Node[] };
            };
            beginSelectionTransform?: (nodes: Konva.Node[], source: "drag" | "transform") => void;
          }
        | undefined;

      if (!selectionModule) {
        throw new Error("SelectionModule not available on window");
      }

      const lifecycle = selectionModule.transformLifecycle;
      if (!lifecycle?.getTransformer) {
        throw new Error("Transform lifecycle unavailable");
      }

      const transformer = lifecycle.getTransformer();
      const nodes = transformer?.nodes?.() ?? [];
      if (!Array.isArray(nodes) || nodes.length === 0) {
        throw new Error("Transformer has no attached nodes");
      }

      (window as typeof window & { __playwrightTransformNodes?: Konva.Node[] }).__playwrightTransformNodes = nodes;
      selectionModule.beginSelectionTransform?.(nodes, "transform");
    });

    await page.waitForFunction(() => window.canvasStage?.listening?.() === false, {
      timeout: 2000,
    });
    const listeningDuring = await readStageListeningState(page);
    expect(listeningDuring).toBe(false);

    // End transform and ensure stage listening is restored
    await page.evaluate(() => {
      const selectionModule = (window as typeof window & { selectionModule?: Record<string, unknown> }).selectionModule as
        | {
            transformLifecycle?: {
              getTransformer?: () => { nodes?: () => Konva.Node[] };
            };
            endSelectionTransform?: (nodes: Konva.Node[], source: "drag" | "transform") => void;
          }
        | undefined;

      if (!selectionModule) {
        throw new Error("SelectionModule not available on window");
      }

      const lifecycle = selectionModule.transformLifecycle;
      if (!lifecycle?.getTransformer) {
        throw new Error("Transform lifecycle unavailable");
      }

      const storedNodes = (window as typeof window & { __playwrightTransformNodes?: Konva.Node[] }).__playwrightTransformNodes;
      const nodes = Array.isArray(storedNodes) ? storedNodes : lifecycle.getTransformer?.()?.nodes?.() ?? [];
      if (!Array.isArray(nodes) || nodes.length === 0) {
        throw new Error("Transformer has no attached nodes");
      }

      selectionModule.endSelectionTransform?.(nodes, "transform");
      delete (window as typeof window & { __playwrightTransformNodes?: Konva.Node[] }).__playwrightTransformNodes;
    });

    await page.waitForFunction(() => window.canvasStage?.listening?.() === true, {
      timeout: 2000,
    });
    const listeningAfter = await readStageListeningState(page);
    expect(listeningAfter).toBe(true);
  });
});
