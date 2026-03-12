import { describe, it, expect } from "vitest";
import { getNodesWithinDepth, getImpactedNodes } from "../../lib/graph-utils";
import type { Edge } from "../../lib/types";

// Graph: A → B → C → D, A → E
const edges: Edge[] = [
  { source: "A", target: "B", isCircular: false },
  { source: "B", target: "C", isCircular: false },
  { source: "C", target: "D", isCircular: false },
  { source: "A", target: "E", isCircular: false },
];

describe("getNodesWithinDepth", () => {
  it("returns immediate neighbors at depth 1", () => {
    const result = getNodesWithinDepth("A", edges, 1);
    expect(result).toEqual(new Set(["A", "B", "E"]));
  });

  it("returns 2-hop neighbors at depth 2", () => {
    const result = getNodesWithinDepth("A", edges, 2);
    expect(result).toEqual(new Set(["A", "B", "C", "E"]));
  });

  it("returns all reachable nodes at depth >= graph diameter", () => {
    const result = getNodesWithinDepth("A", edges, 5);
    expect(result).toEqual(new Set(["A", "B", "C", "D", "E"]));
  });

  it("traverses edges bidirectionally", () => {
    // D is target of C→D, so from D depth 1 should find C
    const result = getNodesWithinDepth("D", edges, 1);
    expect(result).toEqual(new Set(["D", "C"]));
  });

  it("from D depth 2 finds B via D←C←B", () => {
    const result = getNodesWithinDepth("D", edges, 2);
    expect(result).toEqual(new Set(["D", "C", "B"]));
  });

  it("returns only start node when it has no edges", () => {
    const result = getNodesWithinDepth("Z", edges, 3);
    expect(result).toEqual(new Set(["Z"]));
  });

  it("handles circular edges without infinite loop", () => {
    const circularEdges: Edge[] = [
      { source: "X", target: "Y", isCircular: true },
      { source: "Y", target: "X", isCircular: true },
      { source: "Y", target: "Z", isCircular: false },
    ];
    const result = getNodesWithinDepth("X", circularEdges, 2);
    expect(result).toEqual(new Set(["X", "Y", "Z"]));
  });

  it("depth 0 returns only the start node", () => {
    const result = getNodesWithinDepth("A", edges, 0);
    expect(result).toEqual(new Set(["A"]));
  });

  it("handles empty edge list", () => {
    const result = getNodesWithinDepth("A", [], 3);
    expect(result).toEqual(new Set(["A"]));
  });

  it("depth 1 from middle node finds both directions", () => {
    // B has edges: A→B and B→C
    const result = getNodesWithinDepth("B", edges, 1);
    expect(result).toEqual(new Set(["B", "A", "C"]));
  });
});

describe("getImpactedNodes", () => {
  const edges: Edge[] = [
    { source: "a", target: "b", isCircular: false },
    { source: "a", target: "c", isCircular: false },
    { source: "b", target: "d", isCircular: false },
    { source: "c", target: "d", isCircular: false },
    { source: "d", target: "e", isCircular: false },
  ];
  // Edge semantics: source imports target
  // Impact = reverse: if "b" changes, "a" is affected (because a imports b)

  it("returns direct dependents at depth 1", () => {
    const impacted = getImpactedNodes("b", edges);
    expect(impacted.get("a")).toBe(1);
    expect(impacted.size).toBe(1);
  });

  it("returns transitive dependents at depth 2+", () => {
    const result = getImpactedNodes("d", edges);
    expect(result.get("b")).toBe(1);
    expect(result.get("c")).toBe(1);
    expect(result.get("a")).toBe(2);
    expect(result.size).toBe(3);
  });

  it("returns empty map for leaf nodes", () => {
    const result = getImpactedNodes("a", edges);
    expect(result.size).toBe(0);
  });

  it("handles nodes not in edge list", () => {
    const result = getImpactedNodes("nonexistent", edges);
    expect(result.size).toBe(0);
  });

  it("handles circular dependencies without infinite loop", () => {
    const circularEdges: Edge[] = [
      { source: "x", target: "y", isCircular: true },
      { source: "y", target: "x", isCircular: true },
      { source: "z", target: "x", isCircular: false },
    ];
    const result = getImpactedNodes("y", circularEdges);
    expect(result.get("x")).toBe(1);
    expect(result.get("z")).toBe(2);
    expect(result.size).toBe(2);
  });
});
