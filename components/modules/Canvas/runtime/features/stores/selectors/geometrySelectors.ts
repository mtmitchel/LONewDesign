import type { CanvasElement, ElementId, Bounds } from "../../../../types";
import type {
  ConnectorElement,
  ConnectorEndpoint,
  ConnectorEndpointPoint,
  ConnectorEndpointElement,
} from "../../types/connector";

export type ElementBounds = Bounds;

type ElementsMap = Map<ElementId, CanvasElement>;

type ResolverContext = {
  elements: ElementsMap;
  visiting: Set<ElementId>;
};

const boundsCache = new WeakMap<CanvasElement, ElementBounds>();

// Performance instrumentation
interface GeometryMetrics {
  getElementBoundsCalls: number;
  getUnionBoundsCalls: number;
  cacheHits: number;
  cacheMisses: number;
  totalComputeTimeMs: number;
  lastResetTime: number;
}

const metrics: GeometryMetrics = {
  getElementBoundsCalls: 0,
  getUnionBoundsCalls: 0,
  cacheHits: 0,
  cacheMisses: 0,
  totalComputeTimeMs: 0,
  lastResetTime: Date.now(),
};

export function getGeometryMetrics(): Readonly<GeometryMetrics> {
  return { ...metrics };
}

export function resetGeometryMetrics(): void {
  metrics.getElementBoundsCalls = 0;
  metrics.getUnionBoundsCalls = 0;
  metrics.cacheHits = 0;
  metrics.cacheMisses = 0;
  metrics.totalComputeTimeMs = 0;
  metrics.lastResetTime = Date.now();
}

export function getElementBoundsFromElements(
  elements: ElementsMap,
  elementId: ElementId,
): ElementBounds | null {
  metrics.getElementBoundsCalls++;
  const element = elements.get(elementId);
  if (!element) return null;
  return computeBounds({ elements, visiting: new Set<ElementId>() }, element);
}

export function getUnionBoundsFromElements(
  elements: ElementsMap,
  ids: Iterable<ElementId>,
): ElementBounds | null {
  metrics.getUnionBoundsCalls++;
  const startTime = performance.now();
  
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let found = false;

  for (const id of ids) {
    const bounds = getElementBoundsFromElements(elements, id);
    if (!bounds) continue;
    found = true;
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  }

  const elapsed = performance.now() - startTime;
  metrics.totalComputeTimeMs += elapsed;

  if (!found) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  } satisfies ElementBounds;
}

function computeBounds(
  ctx: ResolverContext,
  element: CanvasElement,
): ElementBounds | null {
  const cached = boundsCache.get(element);
  if (cached) {
    metrics.cacheHits++;
    return cached;
  }

  metrics.cacheMisses++;
  const startTime = performance.now();

  let bounds: ElementBounds | null = null;
  switch (element.type) {
    case "connector":
      bounds = computeConnectorBounds(ctx, element as ConnectorElement);
      break;
    case "drawing":
    case "pen":
    case "marker":
    case "highlighter":
    case "eraser":
      bounds = computeDrawingBounds(element);
      break;
    default:
      bounds = computeRectLikeBounds(element);
      break;
  }

  const elapsed = performance.now() - startTime;
  metrics.totalComputeTimeMs += elapsed;

  if (bounds) {
    boundsCache.set(element, bounds);
  }

  return bounds;
}

function computeConnectorBounds(
  ctx: ResolverContext,
  connector: ConnectorElement,
): ElementBounds | null {
  const from = resolveEndpointPoint(ctx, connector.from);
  const to = resolveEndpointPoint(ctx, connector.to);
  if (!from || !to) {
    if (Array.isArray(connector.points) && connector.points.length >= 2) {
      return computeBoundsFromPoints(connector.points, connector.style?.strokeWidth);
    }
    if (
      typeof connector.x === "number" &&
      typeof connector.y === "number" &&
      typeof connector.width === "number" &&
      typeof connector.height === "number"
    ) {
      return {
        x: connector.x - connector.width / 2,
        y: connector.y - connector.height / 2,
        width: connector.width,
        height: connector.height,
      } satisfies ElementBounds;
    }
    return null;
  }

  let minX = Math.min(from.x, to.x);
  let minY = Math.min(from.y, to.y);
  let maxX = Math.max(from.x, to.x);
  let maxY = Math.max(from.y, to.y);

  const strokeHalf = Math.max(0, connector.style?.strokeWidth ?? 0) / 2;
  let padding = strokeHalf;

  if (connector.variant === "arrow") {
    const arrowSize = connector.style?.arrowSize ?? 10;
    const pointerWidth = arrowSize * 0.7;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy);
    if (length > 0) {
      const ux = dx / length;
      const uy = dy / length;
      const headX = to.x + ux * arrowSize;
      const headY = to.y + uy * arrowSize;
      minX = Math.min(minX, headX);
      minY = Math.min(minY, headY);
      maxX = Math.max(maxX, headX);
      maxY = Math.max(maxY, headY);
    }
    padding = Math.max(padding, pointerWidth / 2);
  }

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  } satisfies ElementBounds;
}

function computeDrawingBounds(element: CanvasElement): ElementBounds | null {
  const points = element.points;
  if (!Array.isArray(points) || points.length < 2) {
    return computeRectLikeBounds(element);
  }
  return computeBoundsFromPoints(points, element.style?.strokeWidth);
}

function computeBoundsFromPoints(points: number[], strokeWidth?: number): ElementBounds | null {
  if (points.length < 2) return null;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < points.length; i += 2) {
    const x = points[i];
    const y = points[i + 1];
    if (typeof x !== "number" || typeof y !== "number") continue;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  if (minX === Number.POSITIVE_INFINITY) return null;

  const padding = Math.max(0, strokeWidth ?? 0) / 2;
  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  } satisfies ElementBounds;
}

function computeRectLikeBounds(element: CanvasElement): ElementBounds | null {
  const width = element.width ?? 0;
  const height = element.height ?? 0;
  const x = element.x ?? 0;
  const y = element.y ?? 0;

  const rotation = (element.rotation ?? 0) * (Math.PI / 180);
  const cos = Math.abs(Math.cos(rotation));
  const sin = Math.abs(Math.sin(rotation));

  const rotatedWidth = width * cos + height * sin;
  const rotatedHeight = width * sin + height * cos;

  const centerX = x + width / 2;
  const centerY = y + height / 2;

  return {
    x: centerX - rotatedWidth / 2,
    y: centerY - rotatedHeight / 2,
    width: rotatedWidth,
    height: rotatedHeight,
  } satisfies ElementBounds;
}

function resolveEndpointPoint(
  ctx: ResolverContext,
  endpoint: ConnectorEndpoint,
): ConnectorEndpointPoint | null {
  if (endpoint.kind === "point") {
    return endpoint;
  }
  return resolveElementAnchor(ctx, endpoint);
}

function resolveElementAnchor(
  ctx: ResolverContext,
  endpoint: ConnectorEndpointElement,
): ConnectorEndpointPoint | null {
  if (ctx.visiting.has(endpoint.elementId)) {
    return null;
  }

  const target = ctx.elements.get(endpoint.elementId);
  if (!target) return null;

  ctx.visiting.add(endpoint.elementId);
  const bounds = computeBounds(ctx, target);
  ctx.visiting.delete(endpoint.elementId);

  if (!bounds) return null;

  let x = bounds.x + bounds.width / 2;
  let y = bounds.y + bounds.height / 2;

  switch (endpoint.anchor) {
    case "left":
      x = bounds.x;
      break;
    case "right":
      x = bounds.x + bounds.width;
      break;
    case "top":
      y = bounds.y;
      break;
    case "bottom":
      y = bounds.y + bounds.height;
      break;
    case "center":
    default:
      break;
  }

  if (endpoint.offset) {
    x += endpoint.offset.dx;
    y += endpoint.offset.dy;
  }

  return { kind: "point", x, y } satisfies ConnectorEndpointPoint;
}
