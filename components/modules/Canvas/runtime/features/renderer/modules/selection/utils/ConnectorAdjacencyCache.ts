import type { CanvasElement } from "../../../../../../types";
import type { ConnectorElement } from "../../../../types/connector";

export class ConnectorAdjacencyCache {
  private readonly adjacency = new Map<string, Set<string>>();

  rebuild(elements: Map<string, CanvasElement>): void {
    this.adjacency.clear();

    elements.forEach((element, elementId) => {
      if (!element || element.type !== "connector") {
        return;
      }

      const connector = element as ConnectorElement;
      const fromId =
        connector.from?.kind === "element" ? connector.from.elementId : undefined;
      const toId =
        connector.to?.kind === "element" ? connector.to.elementId : undefined;

      if (fromId) {
        this.add(fromId, elementId);
      }
      if (toId) {
        this.add(toId, elementId);
      }
    });
  }

  clear(): void {
    this.adjacency.clear();
  }

  getConnectedConnectors(elementIds: Iterable<string>): Set<string> {
    const result = new Set<string>();

    for (const elementId of elementIds) {
      const connectorIds = this.adjacency.get(elementId);
      if (!connectorIds || connectorIds.size === 0) {
        continue;
      }
      connectorIds.forEach((id) => result.add(id));
    }

    return result;
  }

  private add(elementId: string, connectorId: string): void {
    if (!this.adjacency.has(elementId)) {
      this.adjacency.set(elementId, new Set([connectorId]));
      return;
    }

    this.adjacency.get(elementId)?.add(connectorId);
  }
}
