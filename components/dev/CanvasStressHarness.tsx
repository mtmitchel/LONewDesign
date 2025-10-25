import Konva from "konva";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CanvasMetrics } from "../modules/Canvas/runtime/features/quality/monitoring";
import { CanvasMonitor } from "../modules/Canvas/runtime/features/quality/monitoring";

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const DEFAULT_NODE_COUNT = 120;
const SIMULATION_INTERVAL_MS = 16;

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

const seeds = ["#ef23bc", "#22aa33", "#9933ff", "#ffa500", "#00aaff", "#8899aa"] as const;

const useStressStage = (nodeCount: number, autoAnimate: boolean) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const animationRef = useRef<number | null>(null);
  const monitorRef = useRef<CanvasMonitor | null>(null);
  const [metrics, setMetrics] = useState<CanvasMetrics | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const stage = new Konva.Stage({
      container,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    });

    const background = new Konva.Layer({ name: "background" });
    const mainLayer = new Konva.Layer({ name: "main" });
    const overlayLayer = new Konva.Layer({ name: "overlay" });

    stage.add(background);
    stage.add(mainLayer);
    stage.add(overlayLayer);

    const gridSize = Math.ceil(Math.sqrt(nodeCount));
    const padding = 40;
    const cellWidth = (CANVAS_WIDTH - padding * 2) / gridSize;
    const cellHeight = (CANVAS_HEIGHT - padding * 2) / gridSize;

    const shapes: Konva.Shape[] = [];

    for (let i = 0; i < nodeCount; i += 1) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const x = padding + col * cellWidth + randomBetween(0, cellWidth * 0.25);
      const y = padding + row * cellHeight + randomBetween(0, cellHeight * 0.25);
      const width = cellWidth * randomBetween(0.3, 0.9);
      const height = cellHeight * randomBetween(0.3, 0.9);

      const rect = new Konva.Rect({
        id: `stress-shape-${i}`,
        x,
        y,
        width,
        height,
        cornerRadius: 8,
        stroke: seeds[i % seeds.length],
        strokeWidth: 2,
        fill: seeds[(i + 2) % seeds.length],
        opacity: 0.85,
        draggable: false,
      });

      mainLayer.add(rect);
      shapes.push(rect);
    }

    mainLayer.batchDraw();

    const monitor = new CanvasMonitor({
      sampleIntervalMs: 250,
      instrumentLayerDraws: true,
      countNodes: true,
      collectMemory: false,
    });

    monitor.attachStage(stage);
    monitor.attachLayers(stage.getLayers());
    const unsubscribe = monitor.subscribe(setMetrics);
    monitor.start();

    stageRef.current = stage;
    monitorRef.current = monitor;

    if (autoAnimate) {
      const runSimulation = () => {
        shapes.forEach((shape) => {
          const jitterX = randomBetween(-3, 3);
          const jitterY = randomBetween(-3, 3);
          shape.x(Math.min(Math.max(shape.x() + jitterX, 0), CANVAS_WIDTH - shape.width()));
          shape.y(Math.min(Math.max(shape.y() + jitterY, 0), CANVAS_HEIGHT - shape.height()));
        });
        mainLayer.batchDraw();
        animationRef.current = window.setTimeout(runSimulation, SIMULATION_INTERVAL_MS);
      };
      runSimulation();
    }

    return () => {
      if (animationRef.current != null) {
        window.clearTimeout(animationRef.current);
        animationRef.current = null;
      }
      unsubscribe();
      monitor.stop();
      monitorRef.current = null;
      stage.destroy();
      stageRef.current = null;
    };
  }, [nodeCount, autoAnimate]);

  const snapshotMetrics = useMemo(() => metrics, [metrics]);

  return { containerRef, metrics: snapshotMetrics, stageRef, monitorRef };
};

export const CanvasStressHarness = () => {
  const [nodeCount, setNodeCount] = useState(DEFAULT_NODE_COUNT);
  const [autoAnimate, setAutoAnimate] = useState(true);
  const { containerRef, metrics } = useStressStage(nodeCount, autoAnimate);

  return (
    <div className="flex h-full w-full flex-col gap-4 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Canvas Stress Harness</h1>
          <p className="text-sm text-neutral-500">
            Generates a {nodeCount}-node Konva stage and streams metrics via CanvasMonitor.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            <span>Nodes</span>
            <input
              className="w-24 rounded border border-neutral-300 px-2 py-1"
              type="number"
              min={20}
              max={500}
              step={10}
              value={nodeCount}
              onChange={(event) => {
                const next = Number.parseInt(event.target.value, 10);
                if (!Number.isNaN(next)) {
                  setNodeCount(Math.min(Math.max(next, 20), 500));
                }
              }}
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoAnimate}
              onChange={(event) => setAutoAnimate(event.target.checked)}
            />
            <span>Auto-simulate jitter</span>
          </label>
        </div>
      </header>
      <section className="flex flex-1 gap-4">
        <div className="relative flex-1 overflow-hidden rounded border border-neutral-200 bg-neutral-50">
          <div ref={containerRef} className="absolute inset-0" />
        </div>
        <aside className="w-64 rounded border border-neutral-200 bg-white p-4 text-sm shadow-sm">
          <h2 className="mb-3 text-base font-medium">Live Metrics</h2>
          {metrics ? (
            <dl className="space-y-2">
              <div className="flex items-center justify-between">
                <dt className="text-neutral-500">FPS</dt>
                <dd className="font-medium">{metrics.fps.toFixed(1)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-neutral-500">Frame (ms)</dt>
                <dd className="font-medium">{metrics.frameMs.toFixed(1)}</dd>
              </div>
              <div>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Layers</h3>
                <ul className="space-y-1">
                  {metrics.layers.map((layer) => (
                    <li key={layer.id} className="flex items-center justify-between">
                      <span>{layer.name ?? layer.id}</span>
                      <span className="tabular-nums">{layer.lastDrawMs.toFixed(2)} ms</span>
                    </li>
                  ))}
                </ul>
              </div>
              {metrics.nodes ? (
                <div>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Node Count</h3>
                  <ul className="space-y-1">
                    <li className="flex items-center justify-between">
                      <span>Layers</span>
                      <span>{metrics.nodes.layers}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Groups</span>
                      <span>{metrics.nodes.groups}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Shapes</span>
                      <span>{metrics.nodes.shapes}</span>
                    </li>
                  </ul>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="text-neutral-500">Initialising monitor…</p>
          )}
        </aside>
      </section>
    </div>
  );
};

export default CanvasStressHarness;
