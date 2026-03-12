import { describe, it, expect } from "vitest";
import { computeClusters } from "../../lib/clustering";
import type { Node } from "../../lib/types";

function makeNode(id: string): Node {
  return {
    id,
    label: id,
    language: "typescript",
    lines: 100,
    symbols: [],
    imports: [],
    importedBy: [],
    isEntryPoint: false,
    isConfig: false,
    isOrphan: false,
    isHub: false,
  };
}

describe("computeClusters", () => {
  it("groups by top-level directory when multiple exist", () => {
    const nodes = [
      makeNode("src/index.ts"),
      makeNode("src/utils.ts"),
      makeNode("lib/helpers.ts"),
      makeNode("test/index.test.ts"),
    ];
    const clusters = computeClusters(nodes);
    expect(clusters).toHaveLength(3);
    expect(clusters.map((c) => c.id).sort()).toEqual(["lib", "src", "test"]);
  });

  it("groups by second level when >80% share one top dir", () => {
    const nodes = [
      makeNode("src/components/App.tsx"),
      makeNode("src/components/Button.tsx"),
      makeNode("src/hooks/useAuth.ts"),
      makeNode("src/lib/utils.ts"),
      makeNode("src/stores/store.ts"),
      makeNode("config.ts"), // 1 out of 6 = 17%, so 83% are in src/ (>80%)
    ];
    const clusters = computeClusters(nodes);
    const ids = clusters.map((c) => c.id).sort();
    expect(ids).toEqual(["src/components", "src/hooks", "src/lib", "src/stores"]);
  });

  it("excludes directories with only 1 file", () => {
    const nodes = [
      makeNode("src/a.ts"),
      makeNode("src/b.ts"),
      makeNode("lib/solo.ts"), // only 1 file
    ];
    const clusters = computeClusters(nodes);
    expect(clusters.map((c) => c.id)).toEqual(["src"]);
  });

  it("returns empty array when fewer than 2 nodes", () => {
    expect(computeClusters([makeNode("a.ts")])).toEqual([]);
  });
});
