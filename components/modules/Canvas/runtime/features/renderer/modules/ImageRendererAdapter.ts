// Adapter for ImageRenderer to implement RendererModule interface
import type Konva from "konva";
import type { ModuleRendererCtx, RendererModule } from "../index";
import { ImageRenderer, type RendererLayers } from "./ImageRenderer";
import { getWorldViewportBounds } from "../../utils/viewBounds";
import type ImageElement from "../../types/image";
import type { Bounds } from "../../../../../types/index";
import { debug } from "../../../../utils/debug";

const LOG_CATEGORY = "renderer/image-adapter";

const INDEX_QUERY_PADDING = 256;
const GEOMETRY_PADDING = 128;
const FALLBACK_FULL_SCAN_LIMIT = 120;

type Id = string;

type StoreState = ReturnType<ModuleRendererCtx["store"]["getState"]>;

export class ImageRendererAdapter implements RendererModule {
  private renderer?: ImageRenderer;
  private layers?: RendererLayers;
  private unsubscribe?: () => void;
  private viewportUnsubscribe?: () => void;
  private store?: ModuleRendererCtx["store"];
  private imagesById = new Map<Id, ImageElement>();
  private visibleIds = new Set<Id>();
  private visibilityScheduled = false;
  private visibilityRaf?: number;
  private visibilityTimeout?: ReturnType<typeof setTimeout>;

  mount(ctx: ModuleRendererCtx): () => void {
    // Create ImageRenderer instance
    this.renderer = new ImageRenderer(ctx.layers);
    this.layers = ctx.layers;
    this.store = ctx.store;

    // Subscribe to store changes - watch image elements
    this.unsubscribe = ctx.store.subscribe(
      // Selector: extract image elements AND selectedTool (for draggable state)
      (state) => {
        const images = new Map<Id, ImageElement>();
        for (const [id, element] of state.elements.entries()) {
          if (element.type === "image") {
            images.set(id, element as ImageElement);
          }
        }
        // CRITICAL FIX: Include selectedTool so draggable state updates when tool changes
        return { images, selectedTool: state.ui?.selectedTool };
      },
      // Callback: reconcile changes (extract images from returned object)
      ({ images }) => {
        this.handleStateUpdate(images);
      },
    );

    // Initial render
    const initialState = ctx.store.getState();
    const initialImages = new Map<Id, ImageElement>();
    for (const [id, element] of initialState.elements.entries()) {
      if (element.type === "image") {
        initialImages.set(id, element as ImageElement);
      }
    }

    this.imagesById = initialImages;
    this.requestVisibilityUpdate();

    this.viewportUnsubscribe = ctx.store.subscribe(
      (state) => state.viewport,
      () => this.requestVisibilityUpdate(),
      { fireImmediately: true },
    );

    // Return cleanup function
    return () => this.unmount();
  }

  private unmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.viewportUnsubscribe?.();
    this.cancelScheduledVisibility();
    this.visibleIds.clear();
    this.imagesById.clear();
    if (this.renderer) {
      this.renderer.clear();
    }
  }

  private handleStateUpdate(images: Map<Id, ImageElement>) {
    this.pruneRemovedNodes(images);
    this.imagesById = images;
    this.requestVisibilityUpdate();
  }

  private pruneRemovedNodes(images: Map<Id, ImageElement>) {
    if (!this.renderer) {
      return;
    }

    for (const id of this.imagesById.keys()) {
      if (images.has(id)) {
        continue;
      }
      this.renderer.remove(id);
      this.visibleIds.delete(id);
    }
  }

  private requestVisibilityUpdate() {
    if (this.visibilityScheduled) {
      return;
    }

    this.visibilityScheduled = true;
    const scheduleWithRaf =
      typeof window !== "undefined" &&
      typeof window.requestAnimationFrame === "function";

    const run = () => {
      this.visibilityScheduled = false;
      this.visibilityRaf = undefined;
      this.visibilityTimeout = undefined;
      this.updateVisibleImages();
    };

    if (scheduleWithRaf) {
      this.visibilityRaf = window.requestAnimationFrame(run);
    } else {
      this.visibilityTimeout = setTimeout(run, 16);
    }
  }

  private cancelScheduledVisibility() {
    if (
      typeof window !== "undefined" &&
      typeof window.cancelAnimationFrame === "function" &&
      this.visibilityRaf !== undefined
    ) {
      window.cancelAnimationFrame(this.visibilityRaf);
    }
    if (this.visibilityTimeout !== undefined) {
      clearTimeout(this.visibilityTimeout);
    }
    this.visibilityScheduled = false;
    this.visibilityRaf = undefined;
    this.visibilityTimeout = undefined;
  }

  private updateVisibleImages() {
    if (!this.renderer || !this.layers) {
      return;
    }

    const stage = this.layers.main.getStage();
    const storeState = this.store?.getState?.() as StoreState | undefined;
    if (!stage || !storeState) {
      return;
    }

    const nextVisible = this.computeVisibleIds(stage, storeState);

    for (const id of nextVisible) {
      const image = this.imagesById.get(id);
      if (!image) {
        continue;
      }
      this.ensureImageRendered(image);
      this.renderer.setVisibility(id, true);
    }

    for (const id of this.visibleIds) {
      if (nextVisible.has(id)) {
        continue;
      }
      this.renderer.setVisibility(id, false);
    }

    debug("ImageRendererAdapter: visibility update", {
      category: LOG_CATEGORY,
      data: { visibleCount: nextVisible.size },
    });

    this.visibleIds = nextVisible;
  }

  private ensureImageRendered(image: ImageElement) {
    if (!this.renderer) {
      return;
    }
    void this.renderer.render(image).catch(() => {
      // Rendering errors already logged inside renderer
    });
  }

  private computeVisibleIds(stage: Konva.Stage, storeState: StoreState): Set<Id> {
    const world = getWorldViewportBounds(stage);
    const width = world.maxX - world.minX;
    const height = world.maxY - world.minY;

    const candidateIds = new Set<Id>();
    try {
      const ids = storeState.spatialIndex?.queryBounds?.({
        x: world.minX,
        y: world.minY,
        width,
        height,
        padding: INDEX_QUERY_PADDING,
      });
      if (Array.isArray(ids)) {
        for (const id of ids) {
          if (this.imagesById.has(id as Id)) {
            candidateIds.add(id as Id);
          }
        }
      }
    } catch {
      // Ignore and fall back to geometry checks below
    }

    for (const id of this.visibleIds) {
      if (this.imagesById.has(id)) {
        candidateIds.add(id);
      }
    }

    const selectedIds = storeState.selectedElementIds;
    if (selectedIds) {
      for (const id of selectedIds) {
        if (this.imagesById.has(id as Id)) {
          candidateIds.add(id as Id);
        }
      }
    }

    if (candidateIds.size === 0) {
      const stats = storeState.spatialIndex?.getStats?.();
      if (!stats || stats.itemCount === 0 || this.imagesById.size <= FALLBACK_FULL_SCAN_LIMIT) {
        for (const id of this.imagesById.keys()) {
          candidateIds.add(id);
        }
      }
    }

    const viewportRect: Bounds = {
      x: world.minX,
      y: world.minY,
      width,
      height,
    };

    const geometryApi = storeState.geometry;
    const nextVisible = new Set<Id>();

    for (const id of candidateIds) {
      const image = this.imagesById.get(id);
      if (!image) {
        continue;
      }

      const bounds = geometryApi?.getElementBounds?.(id) ?? this.deriveBoundsFromImage(image);
      if (!bounds) {
        continue;
      }

      const expanded = inflateBounds(bounds, GEOMETRY_PADDING);
      if (rectsIntersect(expanded, viewportRect)) {
        nextVisible.add(id);
      }
    }

    return nextVisible;
  }

  private deriveBoundsFromImage(image: ImageElement): Bounds | null {
    const width = Math.max(1, image.width ?? 0);
    const height = Math.max(1, image.height ?? 0);
    return {
      x: image.x ?? 0,
      y: image.y ?? 0,
      width,
      height,
    } satisfies Bounds;
  }
}

function inflateBounds(bounds: Bounds, padding: number): Bounds {
  if (padding <= 0) {
    return { ...bounds };
  }

  return {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2,
  } satisfies Bounds;
}

function rectsIntersect(a: Bounds, b: Bounds): boolean {
  const aRight = a.x + a.width;
  const aBottom = a.y + a.height;
  const bRight = b.x + b.width;
  const bBottom = b.y + b.height;

  return aRight >= b.x && bRight >= a.x && aBottom >= b.y && bBottom >= a.y;
}
