import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { InsightsBar } from "../../components/layout/InsightsBar";

const mockGraphData = {
  nodes: [
    { id: "a.ts", language: "typescript" },
    { id: "b.ts", language: "typescript" },
    { id: "c.go", language: "go" },
  ],
  edges: [
    { source: "a.ts", target: "b.ts", isCircular: false },
  ],
  insights: {
    totalFiles: 3,
    totalEdges: 1,
    circularDeps: [["a.ts", "b.ts"]],
    orphanFiles: ["c.go"],
    hubFiles: [],
    languageBreakdown: { typescript: 2, go: 1 },
  },
};

const defaultFilters = { languages: [], directories: [], minConnections: 0, maxDepth: null };

vi.mock("../../stores/graphStore", () => ({
  useGraphStore: vi.fn((selector: any) =>
    selector({
      graphData: mockGraphData,
      filters: defaultFilters,
      selectedNodeId: null,
    })
  ),
}));

describe("InsightsBar", () => {
  it("renders file count", () => {
    render(<InsightsBar />);
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("Files")).toBeTruthy();
  });

  it("renders circular deps count", () => {
    render(<InsightsBar />);
    expect(screen.getByText("Circular")).toBeTruthy();
  });

  it("renders orphan count", () => {
    render(<InsightsBar />);
    expect(screen.getByText("Orphans")).toBeTruthy();
  });

  it("renders language breakdown", () => {
    render(<InsightsBar />);
    expect(screen.getByText("typescript")).toBeTruthy();
    expect(screen.getByText("go")).toBeTruthy();
  });
});
