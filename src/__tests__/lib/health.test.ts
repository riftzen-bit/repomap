import { describe, it, expect } from "vitest";
import { computeHealthScore } from "../../lib/health";
import type { Insights } from "../../lib/types";

const baseInsights: Insights = {
  totalFiles: 100,
  totalEdges: 200,
  circularDeps: [],
  orphanFiles: [],
  hubFiles: [],
  languageBreakdown: { typescript: 100 },
};

describe("computeHealthScore", () => {
  it("returns 100 for a perfect codebase", () => {
    const result = computeHealthScore(baseInsights);
    expect(result.score).toBe(100);
    expect(result.penalties.circular).toBe(0);
    expect(result.penalties.orphan).toBe(0);
  });

  it("penalizes circular dependencies (5 per cycle, max 30)", () => {
    const insights = { ...baseInsights, circularDeps: [["a", "b"], ["c", "d"]] };
    const result = computeHealthScore(insights);
    expect(result.penalties.circular).toBe(10);
    expect(result.score).toBe(90);
  });

  it("caps circular penalty at 30", () => {
    const deps = Array.from({ length: 10 }, (_, i) => [`f${i}`, `g${i}`]);
    const insights = { ...baseInsights, circularDeps: deps };
    const result = computeHealthScore(insights);
    expect(result.penalties.circular).toBe(30);
  });

  it("penalizes orphan files by percentage", () => {
    const insights = { ...baseInsights, orphanFiles: Array.from({ length: 10 }, (_, i) => `orphan${i}`) };
    const result = computeHealthScore(insights);
    expect(result.penalties.orphan).toBe(10);
  });

  it("penalizes hub concentration", () => {
    const insights = { ...baseInsights, hubFiles: ["h1", "h2", "h3"] };
    const result = computeHealthScore(insights);
    expect(result.penalties.hub).toBe(9);
  });

  it("penalizes high coupling (avg > 5 edges/node)", () => {
    const insights = { ...baseInsights, totalEdges: 800 };
    const result = computeHealthScore(insights);
    expect(result.penalties.coupling).toBe(15);
  });

  it("score never goes below 0", () => {
    const insights = {
      ...baseInsights,
      circularDeps: Array.from({ length: 10 }, (_, i) => [`a${i}`, `b${i}`]),
      orphanFiles: Array.from({ length: 50 }, (_, i) => `o${i}`),
      hubFiles: Array.from({ length: 20 }, (_, i) => `h${i}`),
      totalEdges: 2000,
    };
    const result = computeHealthScore(insights);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});
