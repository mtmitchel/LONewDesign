// E2E Test Utilities for Canvas Testing
// @ts-nocheck
import { Page } from "@playwright/test";

declare global {
  interface Window {
    canvasStage?: {
      listening?: () => boolean;
      findOne?: (selector: string) => {
        x: () => number;
        y: () => number;
        width: () => number;
        height: () => number;
        rotation: () => number;
      } | null;
    };
    canvasLayers?: unknown;
    useUnifiedCanvasStore?: {
      getState: () => {
        selection?: { selected?: string[] };
        element?: { clear?: () => void };
        viewport?: {
          zoom?: number;
          setZoom?: (zoom: number) => void;
          pan?: { x: number; y: number };
          setPan?: (x: number, y: number) => void;
        };
      };
    };
  }
}

/**
 * Launch the test canvas application
 */
export async function launchTestCanvas(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const canvasButton = page.getByRole("button", { name: "Canvas", exact: true });
  await canvasButton.first().click();
  
  // Wait for Canvas-specific content to render AND instrumentation to be ready
  await page.waitForFunction(() => {
    const hasContainer = !!document.querySelector(".konva-stage-container, canvas");
    const hasStage = typeof window.canvasStage !== 'undefined';
    const hasStore = typeof window.useUnifiedCanvasStore !== 'undefined';
    return hasContainer && hasStage && hasStore;
  }, { timeout: 15000 });
}

/**
 * Wait for canvas to be fully ready with instrumentation
 */
export async function waitForCanvasReady(page: Page) {
  await page.waitForFunction(
    () => {
      const hasStage = window.canvasStage !== undefined;
      const hasLayers = window.canvasLayers !== undefined;
      const hasStore = window.useUnifiedCanvasStore !== undefined;
      
      // Debug logging
      if (!hasStage || !hasLayers || !hasStore) {
        console.log('Canvas readiness:', { hasStage, hasLayers, hasStore });
      }
      
      return hasStage && hasLayers && hasStore;
    },
    { timeout: 15000 },
  );
}

/**
 * Get canvas stage identifier
 */
export async function getCanvasStage(_page: Page): Promise<string> {
  return "canvasStage";
}

const TOOL_BUTTON_LABELS: Record<string, string> = {
  select: "Select",
  pan: "Pan",
  "sticky-note": "Sticky note",
  text: "Text",
  table: "Table",
  image: "Image",
  shapes: "Shapes",
  connector: "Connector",
  pen: "Pen",
  marker: "Marker",
  highlighter: "Highlighter",
  eraser: "Eraser",
  undo: "Undo",
  redo: "Redo",
  clear: "Clear canvas",
};

const exactLabelRegex = (label: string) => {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}$`, "i");
};

/**
 * Select a tool from the toolbar
 */
export async function selectTool(page: Page, toolId: string) {
  // Strategy 1: Try data-testid first
  const testIdLocator = page.locator(`[data-testid="tool-${toolId}"]`);
  if ((await testIdLocator.count()) > 0) {
    await testIdLocator.first().click();
    await page.waitForTimeout(100);
    return;
  }

  // Strategy 2: Use store API if available (headless-compatible)
  const storeAvailable = await page.evaluate(() => typeof window.useUnifiedCanvasStore !== 'undefined');
  
  if (storeAvailable) {
    const storeSet = await page.evaluate((id) => {
      const state = window.useUnifiedCanvasStore?.getState();
      const setTool = state?.ui?.setSelectedTool;
      if (typeof setTool === "function") {
        setTool(id);
        return true;
      }
      return false;
    }, toolId);

    if (storeSet) {
      await page.waitForTimeout(100);
      return;
    }
  }

  // Strategy 3: Click the toolbar button directly by aria-label
  const accessibleLabel = TOOL_BUTTON_LABELS[toolId];
  if (accessibleLabel) {
    // Wait for toolbar to be present and interactive
    await page.waitForSelector('[role="toolbar"][aria-label="Canvas tools"]', {
      state: 'visible',
      timeout: 5000,
    });
    
    const toolbar = page.locator('[role="toolbar"][aria-label="Canvas tools"]');
    const button = toolbar.locator(`button[aria-label="${accessibleLabel}"]`);
    
    // Wait for button to be attached and visible
    await button.waitFor({ state: 'attached', timeout: 5000 });
    
    try {
      // Use dispatchEvent for onPointerDown which the toolbar uses
      await button.evaluate((btn) => {
        btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
        btn.click();
      });
      await page.waitForTimeout(100);
      return;
    } catch (e) {
      // Fall through to error
      console.error('Button click failed:', e);
    }
  }

  throw new Error(`Unable to locate canvas tool: ${toolId}`);
}

/**
 * Draw on canvas from one point to another
 */
export async function drawOnCanvas(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y);
  await page.mouse.up();
  await page.waitForTimeout(100); // Allow drawing to complete
}

/**
 * Get an element from the canvas by selector
 */
export async function getElement(page: Page, selector: string) {
  return await page.evaluate((sel) => {
    const stage = window.canvasStage;
    return stage?.findOne(sel);
  }, selector);
}

/**
 * Wait for a condition to become truthy
 */
export async function expectEventuallyTruthy(
  page: Page,
  evaluator: () => unknown,
  timeout = 5000,
) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const result = await page.evaluate(evaluator);
    if (result) return result;
    await page.waitForTimeout(100);
  }
  throw new Error(`Condition did not become truthy within ${timeout}ms`);
}

/**
 * Get the current selection
 */
export async function getSelection(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const store = window.useUnifiedCanvasStore?.getState();
    return store?.selection?.selected || [];
  });
}

/**
 * Clear the canvas
 */
export async function clearCanvas(page: Page) {
  await page.evaluate(() => {
    const store = window.useUnifiedCanvasStore?.getState();
    store?.element?.clear();
  });
}

/**
 * Undo last action
 */
export async function undo(page: Page) {
  await page.keyboard.press("Control+z");
  await page.waitForTimeout(100);
}

/**
 * Redo last undone action
 */
export async function redo(page: Page) {
  await page.keyboard.press("Control+y");
  await page.waitForTimeout(100);
}

/**
 * Get the current zoom level
 */
export async function getZoom(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const store = window.useUnifiedCanvasStore?.getState();
    return store?.viewport?.zoom || 1;
  });
}

/**
 * Set the zoom level
 */
export async function setZoom(page: Page, zoom: number) {
  await page.evaluate((z) => {
    const store = window.useUnifiedCanvasStore?.getState();
    store?.viewport?.setZoom(z);
  }, zoom);
  await page.waitForTimeout(100);
}

/**
 * Pan the canvas
 */
export async function panCanvas(page: Page, deltaX: number, deltaY: number) {
  await page.evaluate(
    (delta) => {
      const store = window.useUnifiedCanvasStore?.getState();
      const current = store?.viewport?.pan || { x: 0, y: 0 };
      store?.viewport?.setPan({
        x: current.x + delta.x,
        y: current.y + delta.y,
      });
    },
    { x: deltaX, y: deltaY },
  );
  await page.waitForTimeout(100);
}

/**
 * Take a screenshot of the canvas area
 */
export async function screenshotCanvas(page: Page, path: string) {
  const canvas = await page.locator("#canvas-container");
  await canvas.screenshot({ path });
}

/**
 * Get element bounds
 */
export async function getElementBounds(page: Page, elementId: string) {
  return await page.evaluate((id) => {
    const stage = window.canvasStage;
    const element = stage?.findOne(`#${id}`);
    if (!element) return null;
    return {
      x: element.x(),
      y: element.y(),
      width: element.width(),
      height: element.height(),
      rotation: element.rotation(),
    };
  }, elementId);
}

/**
 * Multi-select elements by holding shift and clicking
 */
export async function multiSelect(
  page: Page,
  positions: Array<{ x: number; y: number }>,
) {
  await page.keyboard.down("Shift");
  for (const pos of positions) {
    await page.mouse.click(pos.x, pos.y);
  }
  await page.keyboard.up("Shift");
  await page.waitForTimeout(100);
}

/**
 * Create a sticky note at position
 */
export async function createStickyNote(
  page: Page,
  x: number,
  y: number,
  text?: string,
) {
  await selectTool(page, "sticky-note");
  await page.mouse.click(x, y);
  if (text) {
    await page.keyboard.type(text);
    // Don't press Escape - it's navigating away from Canvas!
    // Just click outside the text area instead
    await page.mouse.click(x + 100, y + 100);
  }
  await page.waitForTimeout(100);
}

/**
 * Create a text element at position
 */
export async function createText(
  page: Page,
  x: number,
  y: number,
  text: string,
) {
  await selectTool(page, "text");
  await page.mouse.click(x, y);
  await page.keyboard.type(text);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(100);
}

/**
 * Verify grid visibility
 */
export async function isGridVisible(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    const stage = window.canvasStage;
    const bgLayer = stage?.getLayers()[0];
    const grid = bgLayer?.findOne(".grid");
    return grid?.visible() === true;
  });
}

/**
 * Toggle grid visibility
 */
export async function toggleGrid(page: Page) {
  const gridButton = await page.locator('[data-testid="grid-toggle"]');
  await gridButton.click();
  await page.waitForTimeout(100);
}
