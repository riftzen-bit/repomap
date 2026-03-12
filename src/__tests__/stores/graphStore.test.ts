import { describe, it, expect, beforeEach } from "vitest";
import { useGraphStore } from "../../stores/graphStore";
import type { GraphData } from "../../lib/types";

const mockGraphData: GraphData = {
  nodes: [
    {
      id: "src/index.ts",
      label: "index.ts",
      language: "typescript",
      lines: 42,
      symbols: [{ name: "main", kind: "function", line: 1 }],
      imports: ["src/utils.ts"],
      importedBy: [],
      isEntryPoint: true,
      isConfig: false,
      isOrphan: false,
      isHub: false,
    },
    {
      id: "src/utils.ts",
      label: "utils.ts",
      language: "typescript",
      lines: 20,
      symbols: [],
      imports: [],
      importedBy: ["src/index.ts"],
      isEntryPoint: false,
      isConfig: false,
      isOrphan: false,
      isHub: false,
    },
  ],
  edges: [
    { source: "src/index.ts", target: "src/utils.ts", isCircular: false },
  ],
  insights: {
    totalFiles: 2,
    totalEdges: 1,
    circularDeps: [],
    orphanFiles: [],
    hubFiles: [],
    languageBreakdown: { typescript: 2 },
  },
};

beforeEach(() => {
  useGraphStore.getState().reset();
});

describe("graphStore — initial state", () => {
  it("has null graphData", () => {
    expect(useGraphStore.getState().graphData).toBeNull();
  });

  it("has null projectRoot", () => {
    expect(useGraphStore.getState().projectRoot).toBeNull();
  });

  it("has null selectedNodeId", () => {
    expect(useGraphStore.getState().selectedNodeId).toBeNull();
  });

  it("has null focusRequestId", () => {
    expect(useGraphStore.getState().focusRequestId).toBeNull();
  });

  it("has layout 'force'", () => {
    expect(useGraphStore.getState().layout).toBe("force");
  });

  it("has scanStatus 'idle'", () => {
    expect(useGraphStore.getState().scanStatus).toBe("idle");
  });

  it("has null scanProgress", () => {
    expect(useGraphStore.getState().scanProgress).toBeNull();
  });

  it("has null errorMessage", () => {
    expect(useGraphStore.getState().errorMessage).toBeNull();
  });

  it("has empty filters", () => {
    expect(useGraphStore.getState().filters).toEqual({
      languages: [],
      directories: [],
      minConnections: 0,
      maxDepth: null,
    });
  });
});

describe("setGraphData", () => {
  it("stores the graph data", () => {
    useGraphStore.getState().setGraphData(mockGraphData, "/home/user/project");
    expect(useGraphStore.getState().graphData).toEqual(mockGraphData);
  });

  it("sets projectRoot", () => {
    useGraphStore.getState().setGraphData(mockGraphData, "/home/user/project");
    expect(useGraphStore.getState().projectRoot).toBe("/home/user/project");
  });

  it("sets scanStatus to 'complete'", () => {
    useGraphStore.getState().setScanStatus("scanning");
    useGraphStore.getState().setGraphData(mockGraphData, "/home/user/project");
    expect(useGraphStore.getState().scanStatus).toBe("complete");
  });

  it("clears errorMessage", () => {
    useGraphStore.getState().setError("previous error");
    useGraphStore.getState().setGraphData(mockGraphData, "/home/user/project");
    expect(useGraphStore.getState().errorMessage).toBeNull();
  });

  it("accepts different project roots", () => {
    useGraphStore.getState().setGraphData(mockGraphData, "/tmp/other");
    expect(useGraphStore.getState().projectRoot).toBe("/tmp/other");
  });
});

describe("selectNode", () => {
  it("sets selectedNodeId", () => {
    useGraphStore.getState().selectNode("src/index.ts");
    expect(useGraphStore.getState().selectedNodeId).toBe("src/index.ts");
  });

  it("replaces an existing selection", () => {
    useGraphStore.getState().selectNode("src/index.ts");
    useGraphStore.getState().selectNode("src/utils.ts");
    expect(useGraphStore.getState().selectedNodeId).toBe("src/utils.ts");
  });

  it("deselects when called with null", () => {
    useGraphStore.getState().selectNode("src/index.ts");
    useGraphStore.getState().selectNode(null);
    expect(useGraphStore.getState().selectedNodeId).toBeNull();
  });

  it("does not change focusRequestId", () => {
    useGraphStore.getState().selectNode("src/index.ts");
    expect(useGraphStore.getState().focusRequestId).toBeNull();
  });

  it("clears maxDepth when deselecting (null)", () => {
    useGraphStore.getState().updateFilters({ maxDepth: 3 });
    useGraphStore.getState().selectNode("src/index.ts");
    useGraphStore.getState().selectNode(null);
    expect(useGraphStore.getState().filters.maxDepth).toBeNull();
  });

  it("preserves maxDepth when selecting a different node", () => {
    useGraphStore.getState().updateFilters({ maxDepth: 2 });
    useGraphStore.getState().selectNode("src/index.ts");
    useGraphStore.getState().selectNode("src/utils.ts");
    expect(useGraphStore.getState().filters.maxDepth).toBe(2);
  });
});

describe("focusNode", () => {
  it("sets selectedNodeId", () => {
    useGraphStore.getState().focusNode("src/index.ts");
    expect(useGraphStore.getState().selectedNodeId).toBe("src/index.ts");
  });

  it("sets focusRequestId to the same id", () => {
    useGraphStore.getState().focusNode("src/index.ts");
    expect(useGraphStore.getState().focusRequestId).toBe("src/index.ts");
  });

  it("updates both ids together when called again", () => {
    useGraphStore.getState().focusNode("src/index.ts");
    useGraphStore.getState().focusNode("src/utils.ts");
    expect(useGraphStore.getState().selectedNodeId).toBe("src/utils.ts");
    expect(useGraphStore.getState().focusRequestId).toBe("src/utils.ts");
  });

  it("selectedNodeId and focusRequestId are always equal after focusNode", () => {
    useGraphStore.getState().focusNode("src/index.ts");
    const { selectedNodeId, focusRequestId } = useGraphStore.getState();
    expect(selectedNodeId).toBe(focusRequestId);
  });
});

describe("setLayout", () => {
  it("changes layout to 'tree'", () => {
    useGraphStore.getState().setLayout("tree");
    expect(useGraphStore.getState().layout).toBe("tree");
  });

  it("changes layout to 'circle'", () => {
    useGraphStore.getState().setLayout("circle");
    expect(useGraphStore.getState().layout).toBe("circle");
  });

  it("changes layout to 'force'", () => {
    useGraphStore.getState().setLayout("tree");
    useGraphStore.getState().setLayout("force");
    expect(useGraphStore.getState().layout).toBe("force");
  });
});

describe("setScanStatus", () => {
  it("changes status to 'scanning'", () => {
    useGraphStore.getState().setScanStatus("scanning");
    expect(useGraphStore.getState().scanStatus).toBe("scanning");
  });

  it("changes status to 'complete'", () => {
    useGraphStore.getState().setScanStatus("complete");
    expect(useGraphStore.getState().scanStatus).toBe("complete");
  });

  it("changes status to 'error'", () => {
    useGraphStore.getState().setScanStatus("error");
    expect(useGraphStore.getState().scanStatus).toBe("error");
  });

  it("changes status to 'idle'", () => {
    useGraphStore.getState().setScanStatus("scanning");
    useGraphStore.getState().setScanStatus("idle");
    expect(useGraphStore.getState().scanStatus).toBe("idle");
  });
});

describe("setError", () => {
  it("sets the error message", () => {
    useGraphStore.getState().setError("scan failed");
    expect(useGraphStore.getState().errorMessage).toBe("scan failed");
  });

  it("sets scanStatus to 'error'", () => {
    useGraphStore.getState().setScanStatus("scanning");
    useGraphStore.getState().setError("scan failed");
    expect(useGraphStore.getState().scanStatus).toBe("error");
  });

  it("clears scanProgress", () => {
    useGraphStore
      .getState()
      .updateScanProgress({ filesScanned: 5, totalFiles: 10 });
    useGraphStore.getState().setError("scan failed");
    expect(useGraphStore.getState().scanProgress).toBeNull();
  });

  it("stores different error messages correctly", () => {
    useGraphStore.getState().setError("permission denied");
    expect(useGraphStore.getState().errorMessage).toBe("permission denied");
  });
});

describe("updateScanProgress", () => {
  it("stores the progress object", () => {
    useGraphStore
      .getState()
      .updateScanProgress({ filesScanned: 3, totalFiles: 20 });
    expect(useGraphStore.getState().scanProgress).toEqual({
      filesScanned: 3,
      totalFiles: 20,
    });
  });

  it("replaces previous progress on subsequent calls", () => {
    useGraphStore
      .getState()
      .updateScanProgress({ filesScanned: 3, totalFiles: 20 });
    useGraphStore
      .getState()
      .updateScanProgress({ filesScanned: 15, totalFiles: 20 });
    expect(useGraphStore.getState().scanProgress).toEqual({
      filesScanned: 15,
      totalFiles: 20,
    });
  });

  it("accepts null to clear progress", () => {
    useGraphStore
      .getState()
      .updateScanProgress({ filesScanned: 3, totalFiles: 20 });
    useGraphStore.getState().updateScanProgress(null);
    expect(useGraphStore.getState().scanProgress).toBeNull();
  });

  it("stores zero values correctly", () => {
    useGraphStore
      .getState()
      .updateScanProgress({ filesScanned: 0, totalFiles: 0 });
    expect(useGraphStore.getState().scanProgress).toEqual({
      filesScanned: 0,
      totalFiles: 0,
    });
  });
});

describe("updateFilters", () => {
  it("merges languages into existing filters", () => {
    useGraphStore.getState().updateFilters({ languages: ["typescript"] });
    expect(useGraphStore.getState().filters.languages).toEqual(["typescript"]);
    expect(useGraphStore.getState().filters.directories).toEqual([]);
    expect(useGraphStore.getState().filters.minConnections).toBe(0);
  });

  it("merges directories into existing filters", () => {
    useGraphStore.getState().updateFilters({ directories: ["src"] });
    expect(useGraphStore.getState().filters.directories).toEqual(["src"]);
    expect(useGraphStore.getState().filters.languages).toEqual([]);
  });

  it("merges minConnections into existing filters", () => {
    useGraphStore.getState().updateFilters({ minConnections: 5 });
    expect(useGraphStore.getState().filters.minConnections).toBe(5);
    expect(useGraphStore.getState().filters.languages).toEqual([]);
  });

  it("replaces array values entirely rather than appending", () => {
    useGraphStore
      .getState()
      .updateFilters({ languages: ["typescript", "python"] });
    useGraphStore.getState().updateFilters({ languages: ["rust"] });
    expect(useGraphStore.getState().filters.languages).toEqual(["rust"]);
  });

  it("preserves unaffected filter keys when updating one key", () => {
    useGraphStore.getState().updateFilters({ languages: ["go"] });
    useGraphStore.getState().updateFilters({ directories: ["lib"] });
    expect(useGraphStore.getState().filters.languages).toEqual(["go"]);
    expect(useGraphStore.getState().filters.directories).toEqual(["lib"]);
  });

  it("can update all filter fields in one call", () => {
    useGraphStore.getState().updateFilters({
      languages: ["rust"],
      directories: ["src", "lib"],
      minConnections: 3,
      maxDepth: 2,
    });
    expect(useGraphStore.getState().filters).toEqual({
      languages: ["rust"],
      directories: ["src", "lib"],
      minConnections: 3,
      maxDepth: 2,
    });
  });

  it("maxDepth defaults to null", () => {
    expect(useGraphStore.getState().filters.maxDepth).toBeNull();
  });

  it("sets maxDepth via updateFilters", () => {
    useGraphStore.getState().updateFilters({ maxDepth: 3 });
    expect(useGraphStore.getState().filters.maxDepth).toBe(3);
  });

  it("resets maxDepth to null", () => {
    useGraphStore.getState().updateFilters({ maxDepth: 2 });
    useGraphStore.getState().updateFilters({ maxDepth: null });
    expect(useGraphStore.getState().filters.maxDepth).toBeNull();
  });

  it("handles empty arrays as valid values", () => {
    useGraphStore
      .getState()
      .updateFilters({ languages: ["typescript"] });
    useGraphStore.getState().updateFilters({ languages: [] });
    expect(useGraphStore.getState().filters.languages).toEqual([]);
  });
});

describe("reset", () => {
  it("resets graphData to null", () => {
    useGraphStore.getState().setGraphData(mockGraphData, "/project");
    useGraphStore.getState().reset();
    expect(useGraphStore.getState().graphData).toBeNull();
  });

  it("resets projectRoot to null", () => {
    useGraphStore.getState().setGraphData(mockGraphData, "/project");
    useGraphStore.getState().reset();
    expect(useGraphStore.getState().projectRoot).toBeNull();
  });

  it("resets selectedNodeId to null", () => {
    useGraphStore.getState().selectNode("src/index.ts");
    useGraphStore.getState().reset();
    expect(useGraphStore.getState().selectedNodeId).toBeNull();
  });

  it("resets focusRequestId to null", () => {
    useGraphStore.getState().focusNode("src/index.ts");
    useGraphStore.getState().reset();
    expect(useGraphStore.getState().focusRequestId).toBeNull();
  });

  it("resets layout to 'force'", () => {
    useGraphStore.getState().setLayout("circle");
    useGraphStore.getState().reset();
    expect(useGraphStore.getState().layout).toBe("force");
  });

  it("resets scanStatus to 'idle'", () => {
    useGraphStore.getState().setScanStatus("scanning");
    useGraphStore.getState().reset();
    expect(useGraphStore.getState().scanStatus).toBe("idle");
  });

  it("resets scanProgress to null", () => {
    useGraphStore
      .getState()
      .updateScanProgress({ filesScanned: 5, totalFiles: 10 });
    useGraphStore.getState().reset();
    expect(useGraphStore.getState().scanProgress).toBeNull();
  });

  it("resets errorMessage to null", () => {
    useGraphStore.getState().setError("some error");
    useGraphStore.getState().reset();
    expect(useGraphStore.getState().errorMessage).toBeNull();
  });

  it("resets filters to empty defaults", () => {
    useGraphStore.getState().updateFilters({
      languages: ["rust"],
      directories: ["src"],
      minConnections: 5,
      maxDepth: 3,
    });
    useGraphStore.getState().reset();
    expect(useGraphStore.getState().filters).toEqual({
      languages: [],
      directories: [],
      minConnections: 0,
      maxDepth: null,
    });
  });

  it("resets all state fields at once", () => {
    useGraphStore.getState().setGraphData(mockGraphData, "/project");
    useGraphStore.getState().selectNode("src/index.ts");
    useGraphStore.getState().focusNode("src/utils.ts");
    useGraphStore.getState().setLayout("tree");
    useGraphStore.getState().setScanStatus("scanning");
    useGraphStore
      .getState()
      .updateScanProgress({ filesScanned: 2, totalFiles: 8 });
    useGraphStore.getState().updateFilters({ languages: ["go"], minConnections: 2, maxDepth: 4 });

    useGraphStore.getState().reset();

    const state = useGraphStore.getState();
    expect(state.graphData).toBeNull();
    expect(state.projectRoot).toBeNull();
    expect(state.selectedNodeId).toBeNull();
    expect(state.focusRequestId).toBeNull();
    expect(state.layout).toBe("force");
    expect(state.scanStatus).toBe("idle");
    expect(state.scanProgress).toBeNull();
    expect(state.errorMessage).toBeNull();
    expect(state.filters).toEqual({
      languages: [],
      directories: [],
      minConnections: 0,
      maxDepth: null,
    });
  });
});

describe("impactMode", () => {
  it("defaults to false", () => {
    const { impactMode } = useGraphStore.getState();
    expect(impactMode).toBe(false);
  });

  it("toggles impact mode", () => {
    useGraphStore.getState().setImpactMode(true);
    expect(useGraphStore.getState().impactMode).toBe(true);

    useGraphStore.getState().setImpactMode(false);
    expect(useGraphStore.getState().impactMode).toBe(false);
  });

  it("resets impactMode when node is deselected", () => {
    useGraphStore.getState().setImpactMode(true);
    useGraphStore.getState().selectNode(null);
    expect(useGraphStore.getState().impactMode).toBe(false);
  });

  it("resets impactMode on full reset", () => {
    useGraphStore.getState().setImpactMode(true);
    useGraphStore.getState().reset();
    expect(useGraphStore.getState().impactMode).toBe(false);
  });
});

describe("clusteringEnabled", () => {
  it("defaults to false", () => {
    expect(useGraphStore.getState().clusteringEnabled).toBe(false);
  });

  it("toggles clustering", () => {
    useGraphStore.getState().setClusteringEnabled(true);
    expect(useGraphStore.getState().clusteringEnabled).toBe(true);
  });

  it("resets clustering on layout change to non-force", () => {
    useGraphStore.getState().setClusteringEnabled(true);
    useGraphStore.getState().setLayout("tree");
    expect(useGraphStore.getState().clusteringEnabled).toBe(false);
  });

  it("preserves clustering when switching to force layout", () => {
    useGraphStore.getState().setClusteringEnabled(true);
    useGraphStore.getState().setLayout("force");
    expect(useGraphStore.getState().clusteringEnabled).toBe(true);
  });

  it("resets on full reset", () => {
    useGraphStore.getState().setClusteringEnabled(true);
    useGraphStore.getState().reset();
    expect(useGraphStore.getState().clusteringEnabled).toBe(false);
  });
});
