import { QuadTree } from "../../utils/spatial/spatialQuadTree";
import type { Bounds as QuadTreeBounds } from "../../utils/spatial/spatialQuadTree";
import type { ElementId } from "../../../../../types";

export interface SpatialIndexQuery {
  x: number;
  y: number;
  width: number;
  height: number;
  padding?: number;
}

interface SpatialItem {
  id: ElementId;
  bounds: QuadTreeBounds;
}

export interface SpatialIndexStats {
  itemCount: number;
  nodeCount: number;
  maxDepthReached: number;
  lastBuildDurationMs: number;
  lastBuildTimestamp: number | null;
  deferredSessions: number;
  pendingRebuild: boolean;
}

export type BoundsSource = () => Iterable<[ElementId, QuadTreeBounds | null]>;

interface SpatialIndexConfig {
  capacity?: number;
  maxDepth?: number;
  padding?: number;
}

const DEFAULT_PADDING = 8;

export class SpatialIndexService {
  private readonly capacity: number;
  private readonly maxDepth: number;
  private readonly defaultPadding: number;

  private tree: QuadTree<SpatialItem> | null = null;
  private latestSource: BoundsSource | null = null;
  private deferredDepth = 0;
  private needsRebuild = true;

  private stats: SpatialIndexStats = {
    itemCount: 0,
    nodeCount: 0,
    maxDepthReached: 0,
    lastBuildDurationMs: 0,
    lastBuildTimestamp: null,
    deferredSessions: 0,
    pendingRebuild: false,
  };

  constructor(config: SpatialIndexConfig = {}) {
    this.capacity = config.capacity ?? 16;
    this.maxDepth = config.maxDepth ?? 8;
    this.defaultPadding = config.padding ?? DEFAULT_PADDING;
  }

  markDirty(source: BoundsSource): void {
    this.latestSource = source;
    this.needsRebuild = true;

    if (this.deferredDepth === 0) {
      this.rebuild(source);
    } else {
      this.stats.pendingRebuild = true;
    }
  }

  forceRebuild(): void {
    if (this.latestSource) {
      this.rebuild(this.latestSource);
    }
  }

  beginDeferred(reason?: string): void {
    this.deferredDepth += 1;
    this.stats.deferredSessions = this.deferredDepth;

    if (reason && typeof window !== "undefined") {
      (window as typeof window & { __canvasSpatialIndexReason?: string }).__canvasSpatialIndexReason = reason;
    }
  }

  endDeferred(): void {
    if (this.deferredDepth === 0) {
      return;
    }

    this.deferredDepth -= 1;
    this.stats.deferredSessions = this.deferredDepth;

    if (this.deferredDepth === 0 && this.needsRebuild && this.latestSource) {
      this.rebuild(this.latestSource);
    }
  }

  query(range: SpatialIndexQuery): ElementId[] {
    this.ensureFresh();

    if (!this.tree) {
      return [];
    }

    const padded = applyPadding(range, range.padding ?? this.defaultPadding);
    const results = this.tree.queryRange(padded);
    return results.map((item) => item.id);
  }

  queryPoint(x: number, y: number, radius = 0): ElementId[] {
    const size = radius > 0 ? radius * 2 : 1e-3;
    return this.query({ x: x - radius, y: y - radius, width: size, height: size, padding: radius === 0 ? this.defaultPadding : 0 });
  }

  getStats(): SpatialIndexStats {
    return { ...this.stats };
  }

  private ensureFresh(): void {
    if (!this.needsRebuild) {
      return;
    }

    if (this.deferredDepth > 0) {
      return;
    }

    if (this.latestSource) {
      this.rebuild(this.latestSource);
    }
  }

  private rebuild(source: BoundsSource): void {
    const start = performance.now?.() ?? Date.now();

    const items: SpatialItem[] = [];
    const world = createEmptyWorld();

    for (const [id, bounds] of source()) {
      if (!bounds) {
        continue;
      }

      expandWorld(world, bounds);
      items.push({ id, bounds });
    }

    if (!world.initialized || items.length === 0) {
      this.tree = null;
      this.needsRebuild = false;
      this.stats = {
        ...this.stats,
        itemCount: 0,
        nodeCount: 0,
        maxDepthReached: 0,
        lastBuildDurationMs: (performance.now?.() ?? Date.now()) - start,
        lastBuildTimestamp: Date.now(),
        pendingRebuild: false,
      };
      return;
    }

    const rootBounds = normalizeWorld(world, this.defaultPadding);
    const tree = new QuadTree<SpatialItem>(rootBounds, {
      maxElements: this.capacity,
      maxDepth: this.maxDepth,
      getBounds: (item) => item.bounds,
      equals: (a, b) => a.id === b.id,
    });

    items.forEach((item) => tree.insert(item));

    const end = performance.now?.() ?? Date.now();

    this.tree = tree;
    this.needsRebuild = false;
    this.stats = {
      itemCount: items.length,
      nodeCount: estimateNodeCount(tree, rootBounds),
      maxDepthReached: this.maxDepth,
      lastBuildDurationMs: end - start,
      lastBuildTimestamp: Date.now(),
      deferredSessions: this.deferredDepth,
      pendingRebuild: false,
    };
  }
}

interface MutableWorldBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  initialized: boolean;
}

function createEmptyWorld(): MutableWorldBounds {
  return {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
    initialized: false,
  };
}

function expandWorld(world: MutableWorldBounds, bounds: QuadTreeBounds): void {
  if (!world.initialized) {
    world.minX = bounds.x;
    world.minY = bounds.y;
    world.maxX = bounds.x + bounds.width;
    world.maxY = bounds.y + bounds.height;
    world.initialized = true;
    return;
  }

  world.minX = Math.min(world.minX, bounds.x);
  world.minY = Math.min(world.minY, bounds.y);
  world.maxX = Math.max(world.maxX, bounds.x + bounds.width);
  world.maxY = Math.max(world.maxY, bounds.y + bounds.height);
}

function normalizeWorld(world: MutableWorldBounds, padding: number): QuadTreeBounds {
  const width = world.maxX - world.minX;
  const height = world.maxY - world.minY;

  const safeWidth = width <= 0 ? 1 : width;
  const safeHeight = height <= 0 ? 1 : height;

  return {
    x: world.minX - padding,
    y: world.minY - padding,
    width: safeWidth + padding * 2,
    height: safeHeight + padding * 2,
  };
}

function applyPadding(bounds: SpatialIndexQuery, padding: number): QuadTreeBounds {
  if (padding <= 0) {
    return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
  }

  return {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2,
  };
}

function estimateNodeCount(tree: QuadTree<SpatialItem>, world: QuadTreeBounds): number {
  const sample = tree.queryRange(world);
  return Math.max(sample.length, 1);
}
