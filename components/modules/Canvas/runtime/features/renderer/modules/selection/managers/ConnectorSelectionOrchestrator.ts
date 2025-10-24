import type { ModuleRendererCtx } from "../../../types";
import type { ConnectorSelectionManager } from "../../../../managers/ConnectorSelectionManager";
import { SelectionDebouncer } from "../utils/SelectionDebouncer";

export interface ConnectorSelectionOrchestratorConfig {
  getStoreContext: () => ModuleRendererCtx | undefined;
  getConnectorSelectionManager: () => ConnectorSelectionManager | undefined;
  debug?: (message: string, data?: unknown) => void;
}

/**
 * Encapsulates connector-only selection detection, debouncing, and display orchestration.
 * SelectionModule delegates to this manager so connector-specific logic lives outside the module.
 */
export class ConnectorSelectionOrchestrator {
  private readonly debouncer = new SelectionDebouncer();
  private readonly getStoreContext: () => ModuleRendererCtx | undefined;
  private readonly getConnectorSelectionManager: () => ConnectorSelectionManager | undefined;
  private readonly debug?: (message: string, data?: unknown) => void;

  constructor(config: ConnectorSelectionOrchestratorConfig) {
    this.getStoreContext = config.getStoreContext;
    this.getConnectorSelectionManager = config.getConnectorSelectionManager;
    this.debug = config.debug;
  }

  /**
   * Handles selection change events. Returns true when the selection was fully processed as
   * connector-only (and therefore the caller should skip transformer attachment).
   */
  handleSelectionChange(selectedIds: Set<string>): boolean {
    const storeCtx = this.getStoreContext();
    const manager = this.getConnectorSelectionManager();

    if (!storeCtx || !manager) {
      return false;
    }

    return this.debouncer.scheduleConnectorSelection(
      selectedIds,
      storeCtx,
      manager,
      this.debug,
    );
  }

  /**
   * Handles immediate connector selection updates (no debouncing). Returns true if connector-only.
   */
  handleImmediateSelection(selectedIds: Set<string>): boolean {
    const storeCtx = this.getStoreContext();
    const manager = this.getConnectorSelectionManager();

    if (!storeCtx || !manager) {
      return false;
    }

    return this.debouncer.handleImmediateConnectorSelection(
      selectedIds,
      storeCtx,
      manager,
      this.debug,
    );
  }

  cancelPending(): void {
    this.debouncer.cancel();
  }

  destroy(): void {
    this.cancelPending();
  }
}
