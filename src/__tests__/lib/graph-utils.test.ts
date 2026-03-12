import { describe, it, expect } from "vitest";
import { getNodesWithinDepth } from "../../lib/graph-utils";
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
