// features/canvas/renderer/modules/selection/managers/SelectionStateManager.ts
import type { ModuleRendererCtx } from "../../../index";

export interface SelectionState {
  selectedIds: Set<string>;
  selectionVersion: number;
}

export interface SelectionStore {
  getState: () => {
    selectedElementIds?: Set<string> | string[];
    selection?: {
      set?: (ids: string[]) => void;
      replace?: (ids: string[]) => void;
      clear?: () => void;
    };
    setSelection?: (ids: string[]) => void;
    selectionVersion?: number;
  };
  setState?: (state: Partial<{ selectedElementIds: Set<string> }>) => void;
}

export class SelectionStateManager {
  private storeCtx?: ModuleRendererCtx;
  private currentSelection: Set<string> = new Set();

  constructor(storeCtx?: ModuleRendererCtx) {
    this.storeCtx = storeCtx;
  }

  updateStoreContext(storeCtx: ModuleRendererCtx): void {
    this.storeCtx = storeCtx;
  }

  /**
   * Set selection with proper store integration
   */
  setSelection(ids: string[]): void {
    if (!this.storeCtx) return;

    const store = this.storeCtx.store;
    const state = store.getState();

    this.currentSelection = new Set(ids);

    if (typeof state.setSelection === "function") {
      state.setSelection(ids);
    } else {
      const selectionController = state.selection as
        | { set?: (ids: string[]) => void; replace?: (ids: string[]) => void }
        | undefined;

      if (selectionController?.set) {
        selectionController.set(ids);
      } else if (selectionController?.replace) {
        selectionController.replace(ids);
      } else {
        const selected = state.selectedElementIds;

        if (selected instanceof Set || Array.isArray(selected)) {
          const next = new Set<string>(ids);
          store.setState?.({ selectedElementIds: next });
        } else {
          store.setState?.({ selectedElementIds: new Set(ids) });
        }
      }
    }
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    if (!this.storeCtx) return;

    const store = this.storeCtx.store;
    const state = store.getState();

    this.currentSelection.clear();
    let handled = false;

    if (typeof state.setSelection === "function") {
      state.setSelection([]);
      handled = true;
    }

    if (!handled) {
      if (state.selection?.clear) {
        state.selection.clear();
      } else if (state.selectedElementIds) {
        if (state.selectedElementIds instanceof Set) {
          state.selectedElementIds.clear();
        } else if (Array.isArray(state.selectedElementIds)) {
          (state.selectedElementIds as string[]).length = 0;
        }
      }

      store.setState?.({ selectedElementIds: new Set<string>() });
    }
  }

  /**
   * Get current selection
   */
  getSelection(): Set<string> {
    if (!this.storeCtx) return new Set();

    const state = this.storeCtx.store.getState();
    const selected = state.selectedElementIds;

    if (selected instanceof Set) {
      return new Set(selected);
    } else if (Array.isArray(selected)) {
      return new Set(selected);
    }

    return new Set();
  }

  /**
   * Check if an element is selected
   */
  isSelected(elementId: string): boolean {
    return this.currentSelection.has(elementId);
  }

  /**
   * Toggle selection for an element
   */
  toggleSelection(elementId: string): void {
    const current = this.getSelection();
    const newSelection = new Set(current);

    if (newSelection.has(elementId)) {
      newSelection.delete(elementId);
    } else {
      newSelection.add(elementId);
    }

    this.setSelection(Array.from(newSelection));
  }

  /**
   * Add element to selection
   */
  addToSelection(elementId: string): void {
    const current = this.getSelection();
    const newSelection = new Set(current);
    newSelection.add(elementId);
    this.setSelection(Array.from(newSelection));
  }

  /**
   * Remove element from selection
   */
  removeFromSelection(elementId: string): void {
    const current = this.getSelection();
    const newSelection = new Set(current);
    newSelection.delete(elementId);
    this.setSelection(Array.from(newSelection));
  }

  /**
   * Select all elements (placeholder - would need element list)
   */
  selectAll(elementIds: string[]): void {
    this.setSelection(elementIds);
  }

  /**
   * Get selection version for change detection
   */
  getSelectionVersion(): number {
    if (!this.storeCtx) return 0;

    const state = this.storeCtx.store.getState();
    return state.selectionVersion || 0;
  }

  /**
   * Update internal state from external changes
   */
  updateFromExternal(selectedIds: Set<string>): void {
    this.currentSelection = new Set(selectedIds);
  }

  destroy(): void {
    this.storeCtx = undefined;
    this.currentSelection.clear();
  }
}

// Factory function for creating selection state managers
export function createSelectionStateManager(storeCtx?: ModuleRendererCtx): SelectionStateManager {
  return new SelectionStateManager(storeCtx);
}