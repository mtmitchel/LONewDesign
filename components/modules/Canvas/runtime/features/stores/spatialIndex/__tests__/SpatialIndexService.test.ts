import { describe, expect, it } from "vitest";

import { SpatialIndexService } from "../SpatialIndexService";

const makeSource = (entries: Array<[string, { x: number; y: number; width: number; height: number }]> ) => {
  return () => entries;
};

describe("SpatialIndexService", () => {
  it("builds an index and queries by bounds", () => {
    const service = new SpatialIndexService({ capacity: 4, padding: 0 });
    const source = makeSource([
      ["a", { x: 0, y: 0, width: 10, height: 10 }],
      ["b", { x: 100, y: 100, width: 20, height: 20 }],
    ]);

    service.markDirty(source);

    expect(service.query({ x: -5, y: -5, width: 20, height: 20 })).toEqual(["a"]);
    expect(service.query({ x: 95, y: 95, width: 10, height: 10 })).toEqual(["b"]);
  });

  it("defers rebuilds during interactions", () => {
    const service = new SpatialIndexService({ capacity: 4, padding: 0 });
    const initial = makeSource([
      ["a", { x: 0, y: 0, width: 10, height: 10 }],
    ]);
    const updated = makeSource([
      ["b", { x: 100, y: 100, width: 10, height: 10 }],
    ]);

    service.markDirty(initial);
    expect(service.query({ x: -1, y: -1, width: 12, height: 12 })).toEqual(["a"]);

    service.beginDeferred("test");
    service.markDirty(updated);

    // Still returns old data while deferred
    expect(service.query({ x: -1, y: -1, width: 12, height: 12 })).toEqual(["a"]);

    service.endDeferred();

    // After deferred session ends, new data is visible
    expect(service.query({ x: 99, y: 99, width: 2, height: 2 })).toEqual(["b"]);
  });
});
