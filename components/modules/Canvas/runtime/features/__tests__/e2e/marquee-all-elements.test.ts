// @ts-nocheck
import { test, expect } from "@playwright/test";

import { launchTestCanvas, waitForCanvasReady } from "./test-utils";

const ELEMENT_IDS = [
  "sticky-1",
  "text-1",
  "table-1",
  "image-1",
  "circle-1",
  "mindmap-root",
  "mindmap-child",
  "connector-line",
  "connector-arrow",
  "drawing-pen",
  "drawing-marker",
  "drawing-highlighter",
];

const CONNECTOR_IDS = ["connector-line", "connector-arrow"];
const DRAWING_IDS = ["drawing-pen", "drawing-marker", "drawing-highlighter"];

const TEST_DELTA = { dx: 140, dy: 90 };
const ONE_PIXEL_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=";

test.describe("Canvas marquee selection", () => {
  test("selects and moves the full element spectrum during marquee drags", async ({ page }) => {
    await launchTestCanvas(page);
    await waitForCanvasReady(page);

    await page.waitForFunction(
      () =>
        typeof window.selectionModule !== "undefined" &&
        typeof window.marqueeSelectionController !== "undefined",
      { timeout: 15000 },
    );

    const result = await page.evaluate(
      async ({ elementIds, connectorIds, drawingIds, delta, onePixel }) => {
        const waitForFrames = (frames: number) =>
          new Promise<void>((resolve) => {
            let remaining = Math.max(1, frames);
            const step = () => {
              if (--remaining <= 0) {
                resolve();
                return;
              }
              window.requestAnimationFrame(step);
            };
            window.requestAnimationFrame(step);
          });

        const store = window.useUnifiedCanvasStore.getState();
        const addElement = (element: Record<string, unknown>) => {
          if (typeof store.addElement === "function") {
            store.addElement(element, { select: false, pushHistory: false });
            return;
          }
          if (store.element?.upsert) {
            store.element.upsert(element);
            return;
          }
          throw new Error("No element insertion API available");
        };

        const ensureArray = <T>(count: number, factory: (index: number) => T): T[] =>
          Array.from({ length: count }, (_, index) => factory(index));

        const seeds: Record<string, unknown>[] = [
          {
            id: "sticky-1",
            type: "sticky-note",
            x: 120,
            y: 120,
            width: 220,
            height: 160,
            keepAspectRatio: true,
            text: "Sticky",
            fill: "#FFEFC8",
            style: {
              fill: "#FFEFC8",
              fontSize: 22,
              fontFamily: "Inter, sans-serif",
              textAlign: "left",
              stroke: "#E0B400",
            },
          },
          {
            id: "text-1",
            type: "text",
            x: 380,
            y: 130,
            width: 260,
            height: 80,
            text: "Canvas Text",
            style: {
              fontFamily: "Inter, sans-serif",
              fontSize: 28,
              textColor: "#111827",
              fill: "#111827",
              textAlign: "left",
            },
          },
          {
            id: "table-1",
            type: "table",
            x: 120,
            y: 330,
            width: 360,
            height: 120,
            rows: 2,
            cols: 3,
            colWidths: [120, 120, 120],
            rowHeights: [60, 60],
            cells: ensureArray(6, () => ({ text: "" })),
            style: {
              cellFill: "#FFFFFF",
              borderColor: "#D1D5DB",
              borderWidth: 1,
              fontFamily: "Inter",
              fontSize: 14,
              textColor: "#111827",
              paddingX: 8,
              paddingY: 6,
              cornerRadius: 0,
            },
          },
          {
            id: "image-1",
            type: "image",
            x: 540,
            y: 120,
            width: 160,
            height: 120,
            src: onePixel,
            idbKey: "img_image-1",
            naturalWidth: 1,
            naturalHeight: 1,
            keepAspectRatio: true,
          },
          {
            id: "circle-1",
            type: "circle",
            x: 560,
            y: 380,
            width: 180,
            height: 180,
            bounds: { x: 470, y: 290, width: 180, height: 180 },
            draggable: true,
            data: {
              text: "",
              radius: 90,
              radiusX: 90,
              radiusY: 90,
              padding: 0,
              textLineHeight: 1.25,
            },
            style: {
              stroke: "#2563EB",
              strokeWidth: 3,
              fill: "#DBEAFE",
            },
          },
          {
            id: "mindmap-root",
            type: "mindmap-node",
            x: 820,
            y: 200,
            width: 200,
            height: 60,
            text: "Root Idea",
            level: 0,
            style: {
              fill: "#EEF2FF",
              stroke: "#4F46E5",
              strokeWidth: 1.5,
              cornerRadius: 16,
              fontFamily: "Inter, sans-serif",
              fontSize: 24,
              fontStyle: "bold",
              textColor: "#1F2937",
              paddingX: 16,
              paddingY: 12,
            },
          },
          {
            id: "mindmap-child",
            type: "mindmap-node",
            x: 1020,
            y: 320,
            width: 180,
            height: 56,
            text: "Child Node",
            parentId: "mindmap-root",
            level: 1,
            style: {
              fill: "#E0F2FE",
              stroke: "#0284C7",
              strokeWidth: 1.5,
              cornerRadius: 16,
              fontFamily: "Inter, sans-serif",
              fontSize: 20,
              textColor: "#1F2937",
              paddingX: 16,
              paddingY: 12,
            },
          },
          {
            id: "connector-line",
            type: "connector",
            variant: "line",
            from: { kind: "element", elementId: "sticky-1", anchor: "right" },
            to: { kind: "element", elementId: "text-1", anchor: "left" },
            style: {
              stroke: "#2563EB",
              strokeWidth: 2,
              rounded: true,
            },
          },
          {
            id: "connector-arrow",
            type: "connector",
            variant: "arrow",
            from: { kind: "element", elementId: "text-1", anchor: "right" },
            to: { kind: "element", elementId: "circle-1", anchor: "left" },
            style: {
              stroke: "#10B981",
              strokeWidth: 2.5,
              arrowSize: 18,
              rounded: true,
            },
          },
          {
            id: "drawing-pen",
            type: "drawing",
            subtype: "pen",
            x: 220,
            y: 520,
            width: 120,
            height: 60,
            points: [220, 520, 260, 530, 300, 545, 330, 570],
            style: { stroke: "#111827", strokeWidth: 3, opacity: 1, lineCap: "round", lineJoin: "round" },
          },
          {
            id: "drawing-marker",
            type: "drawing",
            subtype: "marker",
            x: 420,
            y: 520,
            width: 120,
            height: 60,
            points: [420, 520, 460, 530, 500, 545, 530, 570],
            style: { stroke: "#F97316", strokeWidth: 10, opacity: 0.65, lineCap: "round", lineJoin: "round" },
          },
          {
            id: "drawing-highlighter",
            type: "drawing",
            subtype: "highlighter",
            x: 640,
            y: 520,
            width: 120,
            height: 60,
            points: [640, 520, 680, 530, 720, 545, 750, 570],
            style: { stroke: "#FBBF24", strokeWidth: 14, opacity: 0.45, lineCap: "round", lineJoin: "round" },
          },
        ];

        seeds.forEach(addElement);

        const stage = window.canvasStage;
        const selectionModule = window.selectionModule;

        const allNodesRendered = () => {
          if (!stage) return false;
          return elementIds.every((id) => {
            const direct = stage.findOne(`#${id}`);
            if (direct) return true;
            const nested = stage.findOne(`#${id} .connector-shape`);
            return Boolean(nested);
          });
        };

        await waitForFrames(60);
        for (let attempt = 0; attempt < 40 && !allNodesRendered(); attempt += 1) {
          await waitForFrames(5);
        }

        if (!allNodesRendered()) {
          throw new Error("Canvas nodes failed to render for marquee test");
        }

        const captureStage = () => {
          const snapshot: Record<
            string,
            { position: { x: number; y: number }; parent: string | null } | undefined
          > = {};
          elementIds.forEach((id) => {
            const node =
              stage.findOne(`#${id}`) ??
              stage.findOne(`#${id} .connector-shape`) ??
              stage.findOne(`.${id}`);
            if (!node) return;
            const abs =
              typeof node.getAbsolutePosition === "function"
                ? node.getAbsolutePosition()
                : node.position();
            const parent = node.getParent?.();
            snapshot[id] = {
              position: { x: abs.x, y: abs.y },
              parent: parent?.id?.() ?? parent?.name?.() ?? null,
            };
          });
          return snapshot;
        };

        const cloneEndpoint = (endpoint: unknown) => {
          if (!endpoint || typeof endpoint !== "object") return null;
          return JSON.parse(JSON.stringify(endpoint));
        };

        const captureStore = () => {
          const snapshot: Record<
            string,
            {
              x: number | null;
              y: number | null;
              points: number[] | null;
              from?: unknown;
              to?: unknown;
            }
          > = {};
          const state = window.useUnifiedCanvasStore.getState();
          elementIds.forEach((id) => {
            const element = state.elements?.get(id);
            if (!element) return;
            snapshot[id] = {
              x: typeof element.x === "number" ? element.x : null,
              y: typeof element.y === "number" ? element.y : null,
              points: Array.isArray(element.points) ? [...element.points] : null,
            };
            if (element.type === "connector") {
              snapshot[id].from = cloneEndpoint((element as { from?: unknown }).from ?? null);
              snapshot[id].to = cloneEndpoint((element as { to?: unknown }).to ?? null);
            }
          });
          return snapshot;
        };

        const bounds = { x: -500, y: -500, width: 3000, height: 2000 };
        const marqueeSelected =
          selectionModule.selectElementsInBounds?.(stage, bounds, { additive: false }) ?? [];
        await waitForFrames(20);

        const transformer = selectionModule.transformLifecycle?.getTransformer?.();
        const transformerNodes = transformer?.nodes?.() ?? [];
        if (transformerNodes.length === 0) {
          throw new Error("Transformer nodes unavailable after marquee selection");
        }

        selectionModule.beginSelectionTransform?.(transformerNodes, "drag");
        await waitForFrames(2);

        const stageBefore = captureStage();
        const storeBaseline = captureStore();

        transformerNodes.forEach((node) => {
          const abs = node.absolutePosition();
          node.absolutePosition({
            x: abs.x + delta.dx,
            y: abs.y + delta.dy,
          });
        });

        selectionModule.progressSelectionTransform?.(transformerNodes, "drag");
        await waitForFrames(4);

        const stageAfter = captureStage();
        const storeAfter = captureStore();

        selectionModule.endSelectionTransform?.(transformerNodes, "drag");

        return {
          marqueeSelected,
          stageBefore,
          stageAfter,
          storeBaseline,
          storeAfter,
          transformerNodes: transformerNodes.map((node) => node.id?.() ?? node.getAttr?.("elementId") ?? node.name?.()),
        };
      },
      {
        elementIds: ELEMENT_IDS,
        connectorIds: CONNECTOR_IDS,
        drawingIds: DRAWING_IDS,
        delta: TEST_DELTA,
        onePixel: ONE_PIXEL_IMAGE,
      },
    );

    const uniqueSelected = new Set(result.marqueeSelected);
    expect(uniqueSelected.size).toBe(ELEMENT_IDS.length);
    ELEMENT_IDS.forEach((id) => expect(uniqueSelected.has(id)).toBe(true));

    CONNECTOR_IDS.forEach((id) => {
      const baseline = result.storeBaseline[id];
      const after = result.storeAfter[id];
      expect(baseline).toBeDefined();
      expect(after).toBeDefined();
      if (!baseline || !after) return;

      const baselineFrom = baseline.from as { kind?: string; elementId?: string } | null;
      const baselineTo = baseline.to as { kind?: string; elementId?: string } | null;
      const afterFrom = after.from as { kind?: string; elementId?: string } | null;
      const afterTo = after.to as { kind?: string; elementId?: string } | null;

      expect(afterFrom?.kind).toBe(baselineFrom?.kind);
      expect(afterTo?.kind).toBe(baselineTo?.kind);

      if (baselineFrom?.kind === "element") {
        expect(afterFrom?.elementId).toBe(baselineFrom.elementId);
      }
      if (baselineTo?.kind === "element") {
        expect(afterTo?.elementId).toBe(baselineTo.elementId);
      }
    });

    DRAWING_IDS.forEach((id) => {
      const baseline = result.storeBaseline[id];
      const after = result.storeAfter[id];
      expect(baseline?.points).toBeTruthy();
      expect(after?.points).toBeTruthy();
      if (!baseline?.points || !after?.points) return;
      expect(after.points.length).toBe(baseline.points.length);
      for (let index = 0; index < baseline.points.length; index += 2) {
        const beforeX = baseline.points[index];
        const beforeY = baseline.points[index + 1];
        const afterX = after.points[index];
        const afterY = after.points[index + 1];
        expect(afterX).toBeCloseTo(beforeX + TEST_DELTA.dx, 3);
        expect(afterY).toBeCloseTo(beforeY + TEST_DELTA.dy, 3);
      }
    });
  });
});
