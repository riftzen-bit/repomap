import { describe, it, expect } from "vitest";
import { normalizeFrequencies, interpolateHeatColor } from "../../lib/heatmap";

describe("normalizeFrequencies", () => {
  it("normalizes counts to 0-1 range", () => {
    const result = normalizeFrequencies({ "a.ts": 10, "b.ts": 5, "c.ts": 0 });
    expect(result["a.ts"]).toBe(1);
    expect(result["b.ts"]).toBe(0.5);
    expect(result["c.ts"]).toBe(0);
  });

  it("handles single file", () => {
    const result = normalizeFrequencies({ "a.ts": 5 });
    expect(result["a.ts"]).toBe(1);
  });

  it("handles empty input", () => {
    const result = normalizeFrequencies({});
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("handles all-zero values", () => {
    const result = normalizeFrequencies({ "a.ts": 0, "b.ts": 0 });
    expect(result["a.ts"]).toBe(0);
    expect(result["b.ts"]).toBe(0);
  });
});

describe("interpolateHeatColor", () => {
  it("returns cold color for 0", () => {
    expect(interpolateHeatColor(0)).toMatch(/^#/);
  });

  it("returns hot color for 1", () => {
    expect(interpolateHeatColor(1)).toMatch(/^#/);
  });

  it("returns different colors for different values", () => {
    expect(interpolateHeatColor(0)).not.toBe(interpolateHeatColor(1));
  });

  it("clamps values below 0", () => {
    expect(interpolateHeatColor(-0.5)).toBe(interpolateHeatColor(0));
  });

  it("clamps values above 1", () => {
    expect(interpolateHeatColor(1.5)).toBe(interpolateHeatColor(1));
  });
});
