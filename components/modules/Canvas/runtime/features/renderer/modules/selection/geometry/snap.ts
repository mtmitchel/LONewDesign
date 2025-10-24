// features/canvas/renderer/modules/selection/geometry/snap.ts
import type { Bounds, Point } from './bounds';
import { computeSnapGuides, type SnapOptions, type SnapResult } from '../../../../utils/alignment/SnapGuides';
import { SmartGuidesDetection, type ElementBounds } from '../../../../utils/alignment/SmartGuidesDetection';

export interface SnapConfig {
  enabled: boolean;
  gridSize?: number;
  snapThreshold?: number;
  snapToGrid?: boolean;
  snapToElements?: boolean;
}

export interface SnapContext {
  movingElement: ElementBounds;
  candidateElements: ElementBounds[];
  excludeIds?: string[];
}

export class SelectionSnapHelper {
  private smartGuides: SmartGuidesDetection;
  private config: SnapConfig;

  constructor(config: SnapConfig) {
    this.config = config;
    this.smartGuides = new SmartGuidesDetection({
      snapThreshold: config.snapThreshold ?? 5,
      gridSize: config.gridSize ?? 20,
      snapToGrid: config.snapToGrid ?? true,
      snapToElements: config.snapToElements ?? true,
    });
  }

  updateConfig(config: Partial<SnapConfig>): void {
    this.config = { ...this.config, ...config };
    this.smartGuides.updateConfig({
      snapThreshold: this.config.snapThreshold ?? 5,
      gridSize: this.config.gridSize ?? 20,
      snapToGrid: this.config.snapToGrid ?? true,
      snapToElements: this.config.snapToElements ?? true,
    });
  }

  registerElements(elements: ElementBounds[]): void {
    if (this.config.enabled && this.config.snapToElements) {
      this.smartGuides.registerElements(elements);
    }
  }

  detectSnapGuides(context: SnapContext): SnapResult {
    if (!this.config.enabled) {
      return { dx: 0, dy: 0, guides: [] };
    }

    const snapOptions: SnapOptions = {
      pixelThreshold: this.config.snapThreshold ?? 5,
      gridSize: this.config.snapToGrid ? this.config.gridSize ?? 20 : null,
    };

    // Convert to bounds format for computeSnapGuides
    const movingBounds: Bounds = {
      x: context.movingElement.x,
      y: context.movingElement.y,
      width: context.movingElement.width,
      height: context.movingElement.height,
    };

    const candidateBounds: Bounds[] = context.candidateElements
      .filter(el => !context.excludeIds?.includes(el.id))
      .map(el => ({
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
      }));

    return computeSnapGuides(movingBounds, candidateBounds, snapOptions);
  }

  detectSmartGuides(context: SnapContext): {
    guides: Array<{ axis: 'x' | 'y'; value: number; type: 'edge' | 'center' | 'grid' }>;
    snappedPosition: { x: number; y: number };
  } {
    if (!this.config.enabled) {
      return { guides: [], snappedPosition: { x: context.movingElement.x, y: context.movingElement.y } };
    }

    return this.smartGuides.detectGuides(context.movingElement, context.excludeIds);
  }

  /**
   * Calculate snap position for a point (useful for connector endpoints, etc.)
   */
  snapPoint(point: Point, gridSize?: number): Point {
    if (!this.config.enabled || !this.config.snapToGrid) {
      return point;
    }

    const size = gridSize ?? this.config.gridSize ?? 20;
    return {
      x: Math.round(point.x / size) * size,
      y: Math.round(point.y / size) * size,
    };
  }

  /**
   * Calculate rotation snap (for transformer rotation handles)
   */
  snapRotation(angle: number, snapDegrees: number = 15): number {
    if (!this.config.enabled || snapDegrees <= 0) {
      return angle;
    }

    return Math.round(angle / snapDegrees) * snapDegrees;
  }

  /**
   * Check if a point is near a snap target
   */
  isNearSnapTarget(point: Point, target: Point, threshold?: number): boolean {
    const thresh = threshold ?? this.config.snapThreshold ?? 5;
    const dx = Math.abs(point.x - target.x);
    const dy = Math.abs(point.y - target.y);
    return dx <= thresh && dy <= thresh;
  }

  clear(): void {
    this.smartGuides.clear();
  }

  destroy(): void {
    this.clear();
  }
}

// Factory function for creating snap helpers
export function createSelectionSnapHelper(config: SnapConfig): SelectionSnapHelper {
  return new SelectionSnapHelper(config);
}