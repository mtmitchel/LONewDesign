import type { ModuleRendererCtx } from "../../../types";
import type { UnifiedCanvasStore } from "../../../../stores/unifiedCanvasStore";

export interface SelectionSubscriptionCallbacks {
  onSelectionChange: (selectedIds: Set<string>) => void;
  onSelectionVersionChange?: (version: number) => void;
}

export class SelectionSubscriptionManager {
  private unsubscribeSelection?: () => void;
  private unsubscribeVersion?: () => void;

  constructor(
    private readonly storeCtx: Pick<ModuleRendererCtx, "store">,
    private readonly callbacks: SelectionSubscriptionCallbacks,
  ) {}

  start(): void {
    const { store } = this.storeCtx;

    this.unsubscribeSelection = store.subscribe(
      (state: UnifiedCanvasStore) => {
        const selection = state.selectedElementIds ?? new Set<string>();
        return selection instanceof Set ? new Set(selection) : new Set<string>(selection);
      },
      (selectedIds: Set<string>) => {
        this.callbacks.onSelectionChange(selectedIds);
      },
      { fireImmediately: true },
    );

    if (this.callbacks.onSelectionVersionChange) {
      this.unsubscribeVersion = store.subscribe(
        (state: UnifiedCanvasStore) => state.selectionVersion || 0,
        (version: number) => {
          this.callbacks.onSelectionVersionChange?.(version);
        },
        { fireImmediately: false },
      );
    }
  }

  stop(): void {
    if (this.unsubscribeSelection) {
      this.unsubscribeSelection();
      this.unsubscribeSelection = undefined;
    }
    if (this.unsubscribeVersion) {
      this.unsubscribeVersion();
      this.unsubscribeVersion = undefined;
    }
  }
}
