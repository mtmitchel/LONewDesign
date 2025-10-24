/**
 * Dev utility: Log geometry selector performance metrics to console
 * 
 * Usage in browser console:
 *   window.__logGeometryMetrics()     // Log current metrics
 *   window.__resetGeometryMetrics()   // Reset all counters
 */

import type { UnifiedCanvasStore } from "../unifiedCanvasStore";

export function installGeometryMetricsDebugger(store: { getState: () => UnifiedCanvasStore }) {
  if (typeof window === "undefined") return;

  (window as any).__logGeometryMetrics = () => {
    const metrics = store.getState().geometry.getMetrics();
    const uptimeMs = Date.now() - metrics.lastResetTime;
    const uptimeSec = (uptimeMs / 1000).toFixed(2);

    console.group("🔍 Geometry Selector Metrics");
    console.log(`📊 Call Frequency:`);
    console.log(`  getElementBounds: ${metrics.getElementBoundsCalls} calls`);
    console.log(`  getUnionBounds: ${metrics.getUnionBoundsCalls} calls`);
    console.log(`  Total: ${metrics.getElementBoundsCalls + metrics.getUnionBoundsCalls} calls`);
    console.log(``);
    console.log(`💾 Cache Efficiency:`);
    console.log(`  Hits: ${metrics.cacheHits}`);
    console.log(`  Misses: ${metrics.cacheMisses}`);
    const hitRate = metrics.cacheHits + metrics.cacheMisses > 0
      ? ((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100).toFixed(1)
      : "0.0";
    console.log(`  Hit Rate: ${hitRate}%`);
    console.log(``);
    console.log(`⏱️  Computation Cost:`);
    console.log(`  Total Time: ${metrics.totalComputeTimeMs.toFixed(2)}ms`);
    console.log(`  Uptime: ${uptimeSec}s`);
    const avgPerCall = (metrics.getElementBoundsCalls + metrics.getUnionBoundsCalls) > 0
      ? (metrics.totalComputeTimeMs / (metrics.getElementBoundsCalls + metrics.getUnionBoundsCalls)).toFixed(3)
      : "0.000";
    console.log(`  Avg per Call: ${avgPerCall}ms`);
    console.groupEnd();
  };

  (window as any).__resetGeometryMetrics = () => {
    store.getState().geometry.resetMetrics();
    console.log("✅ Geometry metrics reset");
  };

  console.log("🔧 Geometry metrics debugger installed:");
  console.log("  window.__logGeometryMetrics()   - View current metrics");
  console.log("  window.__resetGeometryMetrics() - Reset counters");
}
