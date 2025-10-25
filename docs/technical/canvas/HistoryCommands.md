# Canvas Command-Pattern History (Outline)

_Date: 2025-10-25_

## Purpose
- Guarantee undo/redo stability by funnelling all canvas mutations through explicit command objects.
- Align history snapshots with canonical geometry and the new spatial index service.
- Provide clear extension points for collaboration replay, batching, and telemetry.

## Scope assumptions
- Building on the modular selection stack (Track 3) and spatial index prototype (Track 4).
- Canonical geometry already drives transformers, marquee selection, and spatial queries.
- History manager lives inside the unified canvas store; commands operate on canonical Zustand data (no direct Konva reads).

## Command contract (draft)
- `execute(): void`
- `undo(): void`
- `redo?: () => void` (optional when redo differs from execute)
- `kind: "transform" | "create" | "delete" | "connector" | "mindmap" | ...`
- Metadata: `description`, `affectedIds`, `timestamp`, optional `mergeKey` for coalescing.

## Planned command types
1. **TransformCommand**
   - Captures canonical element bounds before/after.
   - Supports batching for multi-element selections.
   - Emits `spatialIndex.forceRebuild()` after `undo`/`redo` to sync culling.
2. **ConnectorEndpointCommand**
   - Stores endpoint coordinates, routing metadata, and derived mindmap anchors.
   - Integrates with connector orchestrators for re-routes.
3. **CreateElementCommand / DeleteElementCommand**
   - Atomically add/remove elements + element order updates.
   - Handles linked resources (images, mindmap descendants).
4. **MindmapCommand** (mergeable)
   - Wraps descendant motion, reroutes, and label edits in a single unit.
5. **BatchCommand** (composite)
   - Used by selection managers when multiple command instances must replay sequentially but commit as one undo step.

## History manager responsibilities
- `push(command)` → executes + records.
- `undo()` / `redo()` dispatch the command stack.
- Command coalescing (mergeKey) for continuous transforms.
- Snapshot serialization for persistence (future multi-session undo).
- Bridges existing snapshot-based history until command coverage is complete.

## Interaction points
- **SelectionModule:** wraps transformer begin/end with command batching APIs.
- **ElementSynchronizer:** emits `TransformCommand`s instead of pushing raw patches.
- **Connector/Mindmap orchestrators:** convert reroute events into domain-specific commands.
- **Spatial index:** invoked post-command to refresh culling/hit-testing state when geometry changes.

## Open questions / follow-ups
- How to represent canvas state snapshots efficiently (structural sharing vs deep clone)?
- Conflict with remote collaboration patches: do commands record the remote payload or synthetic deltas?
- Where to persist pending commands for redo after reload?
- Telemetry hooks (`canvas.history.command_execute_ms`, `canvas.history.undo_latency_ms`).

## Next steps
1. Finalize command interfaces + TypeScript scaffolding in `components/modules/Canvas/runtime/features/history/`.
2. Replace `selection.beginTransform/endTransform` history calls with command wrappers.
3. Port existing history operations to the command bus in incremental PRs (transform → create/delete → connectors → mindmap).
4. Expand test suite: unit tests per command, integration coverage for undo/redo, regression tests for coalesced drags.
