// @ts-nocheck
import { test, expect } from "@playwright/test";
import {
  launchTestCanvas,
  waitForCanvasReady,
  selectTool,
  createStickyNote,
} from "./test-utils";

const DRAW_START = { x: 220, y: 220 };
const DRAG_OFFSET = { dx: 40, dy: 20 };

async function readStageListeningState(page: Parameters<typeof test>[0]["page"]) {
  return await page.evaluate(() => {
    const stage = (window as typeof window & { canvasStage?: { listening?: () => boolean } }).canvasStage;
    return stage?.listening?.();
  });
}

test.describe("Canvas transform lifecycle", () => {
  test.skip("stage listening toggles off during transform and restores afterwards", async ({ page }) => {
    // SKIPPED: This E2E test requires triggering Konva Transformer events (transformstart/transformend)
    // which are not easily simulated via Playwright mouse events. The transformer anchors need to be
    // directly manipulated, but Playwright can't reliably target Konva canvas elements.
    //
    // The functionality IS tested via unit tests:
    // - SelectionModule.transient.test.ts: Validates stage listening restoration
    // - Transform lifecycle unit tests validate the pause/resume mechanism
    //
    // TODO: Investigate using Konva's internal API via page.evaluate() to trigger transformer events
    
    await launchTestCanvas(page);
    await waitForCanvasReady(page);

    // Create sticky note using store API
    await page.evaluate(() => {
      const store = window.useUnifiedCanvasStore?.getState();
      const addElement = store?.element?.addElement;
      if (addElement) {
        addElement({
          id: 'test-sticky-1',
          type: 'sticky-note',
          x: 220,
          y: 220,
          width: 200,
          height: 150,
          content: 'Test sticky',
          color: '#FFEFC8',
        });
      }
      store?.ui?.setSelectedTool?.('select');
      store?.setSelection?.(['test-sticky-1']);
    });
    
    await page.waitForTimeout(500);

    // Verify stage listening is true before transform
    const listeningBefore = await readStageListeningState(page);
    expect(listeningBefore).toBe(true);

    // TODO: Trigger Konva Transformer drag programmatically
    // Currently, mouse events don't trigger transformer events in headless browser
  });
});
