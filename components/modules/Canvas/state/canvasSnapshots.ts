import Konva from 'konva';
import { StoreActions } from '../runtime/features/stores/facade';
import { useUnifiedCanvasStore } from '../runtime/features/stores/unifiedCanvasStore';
import type { ElementId, CanvasElement } from '../types';
import { deepClone } from '../runtime/features/stores/modules/operations/utils';

export interface CanvasSnapshot {
  id: string;
  title: string;
  elements: Array<[ElementId, CanvasElement]>;
  elementOrder: ElementId[];
  selectedElementIds: ElementId[];
  viewport: {
    x: number;
    y: number;
    scale: number;
    minScale: number;
    maxScale: number;
  };
  updatedAt: string;
}

function getDefaultViewport() {
  const state = useUnifiedCanvasStore.getState();
  return {
    x: state.viewport?.x ?? 0,
    y: state.viewport?.y ?? 0,
    scale: state.viewport?.scale ?? 1,
    minScale: state.viewport?.minScale ?? 0.1,
    maxScale: state.viewport?.maxScale ?? 4,
  };
}

export function captureCanvasSnapshot(meta?: { id?: string; title?: string }): CanvasSnapshot {
  const state = useUnifiedCanvasStore.getState();
  const elements: Array<[ElementId, CanvasElement]> = state.elements
    ? Array.from(state.elements.entries()).map(([id, element]): [ElementId, CanvasElement] => [id, deepClone(element)])
    : [];
  const elementOrder = state.elementOrder ? [...state.elementOrder] : [];
  const selectedElementIds = state.selectedElementIds ? Array.from(state.selectedElementIds.values()) : [];
  const viewport = getDefaultViewport();
  const updatedAt = new Date().toISOString();

  return {
    id: meta?.id ?? crypto.randomUUID(),
    title: meta?.title ?? 'Untitled canvas',
    elements,
    elementOrder,
  selectedElementIds,
    viewport,
    updatedAt,
  };
}

export function clearCanvasState() {
  const store = useUnifiedCanvasStore.getState();
  const ids = store.elementOrder && store.elementOrder.length > 0
    ? [...store.elementOrder]
    : Array.from(store.elements?.keys?.() ?? []);

  if (ids.length && store.removeElements) {
    store.removeElements(ids, { pushHistory: false, deselect: true });
  } else if (ids.length) {
    const remove = store.element?.delete ?? store.removeElement;
    ids.forEach(id => remove?.(id));
  } else {
    useUnifiedCanvasStore.setState({ elements: new Map<ElementId, CanvasElement>(), elementOrder: [] });
  }

  store.selection?.clear?.();
  store.history?.clear?.();

  try {
    const stages = (Konva as { stages?: Konva.Stage[] }).stages;
    const stage = stages && stages.length > 0 ? stages[0] : undefined;
    if (stage) {
      const layers = stage.getLayers();
      for (let i = 1; i < layers.length; i += 1) {
        const layer = layers[i];
        layer.destroyChildren();
        layer.batchDraw();
      }
    }
  } catch {
    // ignore Konva cleanup errors
  }

  StoreActions.bumpSelectionVersion?.();
}

export function applyCanvasSnapshot(snapshot: CanvasSnapshot | null | undefined) {
  if (!snapshot) {
    clearCanvasState();
    return;
  }

  const clonedElements = snapshot.elements.map(([id, element]) => [id, deepClone(element)]) as Array<[ElementId, CanvasElement]>;
  useUnifiedCanvasStore.setState(state => ({
    elements: new Map(clonedElements),
    elementOrder: [...snapshot.elementOrder],
    selectedElementIds: new Set(snapshot.selectedElementIds ?? []),
    viewport: {
      ...state.viewport,
      x: snapshot.viewport.x,
      y: snapshot.viewport.y,
      scale: snapshot.viewport.scale,
      minScale: snapshot.viewport.minScale,
      maxScale: snapshot.viewport.maxScale,
    },
  }));

  const store = useUnifiedCanvasStore.getState();
  store.selection?.clear?.();
  store.history?.clear?.();
  StoreActions.bumpSelectionVersion?.();
}
