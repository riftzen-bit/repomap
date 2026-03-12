import { describe, it, expect } from "vitest";
import {
  getNodeStyle,
  getEdgeStyle,
  getLayoutConfig,
} from "../../lib/cytoscape-config";
import type { Node } from "../../lib/types";

function makeNode(overrides: Partial<Node> = {}): Node {
  return {
    id: "src/utils.ts",
    label: "src/utils.ts",
    language: "typescript",
    lines: 50,
    symbols: [],
    imports: [],
    importedBy: [],
    isEntryPoint: false,
    isConfig: false,
    isOrphan: false,
    isHub: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// getNodeStyle
// ---------------------------------------------------------------------------

describe("getNodeStyle", () => {
  describe("color", () => {
    it("returns language color for a normal node", () => {
      const node = makeNode({ language: "typescript" });
      const style = getNodeStyle(node, 0, false, false);
      expect(style.color).toBe("#5da4e8");
    });

    it("returns grey #8a8078 for an orphan node", () => {
      const node = makeNode({ language: "typescript" });
      const style = getNodeStyle(node, 0, true, false);
      expect(style.color).toBe("#8a8078");
    });

    it("returns language color (not grey) for a circular non-orphan node", () => {
      const node = makeNode({ language: "typescript" });
      const style = getNodeStyle(node, 0, false, true);
      expect(style.color).toBe("#5da4e8");
    });
  });

  describe("opacity", () => {
    it("returns opacity 1 for a normal node", () => {
      const node = makeNode();
      expect(getNodeStyle(node, 0, false, false).opacity).toBe(1);
    });

    it("returns opacity 0.6 for an orphan node", () => {
      const node = makeNode();
      expect(getNodeStyle(node, 0, true, false).opacity).toBe(0.6);
    });
  });

  describe("borderWidth", () => {
    it("returns borderWidth 2 for a normal node", () => {
      const node = makeNode();
      expect(getNodeStyle(node, 0, false, false).borderWidth).toBe(2);
    });

    it("returns borderWidth 4 for a circular dep node", () => {
      const node = makeNode();
      expect(getNodeStyle(node, 0, false, true).borderWidth).toBe(4);
    });
  });

  describe("borderColor", () => {
    it("returns red #ff5555 as borderColor for a circular dep node", () => {
      const node = makeNode({ language: "typescript" });
      const style = getNodeStyle(node, 0, false, true);
      expect(style.borderColor).toBe("#ff5555");
    });

    it("matches node color as borderColor for a normal node", () => {
      const node = makeNode({ language: "typescript" });
      const style = getNodeStyle(node, 0, false, false);
      expect(style.borderColor).toBe(style.color);
    });
  });

  describe("size tiers", () => {
    it("returns size 40 for 0 connections", () => {
      expect(getNodeStyle(makeNode(), 0, false, false).size).toBe(40);
    });

    it("returns size 40 for 1 connection (boundary)", () => {
      expect(getNodeStyle(makeNode(), 1, false, false).size).toBe(40);
    });

    it("returns size 55 for 2 connections (low boundary)", () => {
      expect(getNodeStyle(makeNode(), 2, false, false).size).toBe(55);
    });

    it("returns size 55 for 5 connections (high boundary)", () => {
      expect(getNodeStyle(makeNode(), 5, false, false).size).toBe(55);
    });

    it("returns size 70 for 6 connections (low boundary)", () => {
      expect(getNodeStyle(makeNode(), 6, false, false).size).toBe(70);
    });

    it("returns size 70 for 9 connections (high boundary)", () => {
      expect(getNodeStyle(makeNode(), 9, false, false).size).toBe(70);
    });

    it("returns size 85 for 10 connections (boundary)", () => {
      expect(getNodeStyle(makeNode(), 10, false, false).size).toBe(85);
    });

    it("returns size 85 for 100 connections (large value)", () => {
      expect(getNodeStyle(makeNode(), 100, false, false).size).toBe(85);
    });
  });

  describe("shape", () => {
    it("returns diamond for main.ts", () => {
      const node = makeNode({ label: "src/main.ts" });
      expect(getNodeStyle(node, 0, false, false).shape).toBe("diamond");
    });

    it("returns diamond for main.tsx", () => {
      const node = makeNode({ label: "src/main.tsx" });
      expect(getNodeStyle(node, 0, false, false).shape).toBe("diamond");
    });

    it("returns diamond for main.go", () => {
      const node = makeNode({ label: "cmd/main.go" });
      expect(getNodeStyle(node, 0, false, false).shape).toBe("diamond");
    });

    it("returns diamond for main.rs", () => {
      const node = makeNode({ label: "src/main.rs" });
      expect(getNodeStyle(node, 0, false, false).shape).toBe("diamond");
    });

    it("returns diamond for index.ts", () => {
      const node = makeNode({ label: "src/index.ts" });
      expect(getNodeStyle(node, 0, false, false).shape).toBe("diamond");
    });

    it("returns diamond for index.tsx", () => {
      const node = makeNode({ label: "src/index.tsx" });
      expect(getNodeStyle(node, 0, false, false).shape).toBe("diamond");
    });

    it("returns diamond for index.js", () => {
      const node = makeNode({ label: "src/index.js" });
      expect(getNodeStyle(node, 0, false, false).shape).toBe("diamond");
    });

    it("returns diamond for app.tsx", () => {
      const node = makeNode({ label: "src/app.tsx" });
      expect(getNodeStyle(node, 0, false, false).shape).toBe("diamond");
    });

    it("returns diamond for app.ts", () => {
      const node = makeNode({ label: "src/app.ts" });
      expect(getNodeStyle(node, 0, false, false).shape).toBe("diamond");
    });

    it("returns triangle for a file containing config in the name", () => {
      const node = makeNode({ label: "src/webpack.config.js" });
      expect(getNodeStyle(node, 0, false, false).shape).toBe("triangle");
    });

    it("returns triangle for tsconfig.json", () => {
      const node = makeNode({ label: "tsconfig.json" });
      expect(getNodeStyle(node, 0, false, false).shape).toBe("triangle");
    });

    it("returns triangle for a file containing settings in the name", () => {
      const node = makeNode({ label: "src/settings.ts" });
      expect(getNodeStyle(node, 0, false, false).shape).toBe("triangle");
    });

    it("returns ellipse for a regular file", () => {
      const node = makeNode({ label: "src/utils.ts" });
      expect(getNodeStyle(node, 0, false, false).shape).toBe("ellipse");
    });

    it("uses only the final path segment for shape determination", () => {
      // Directory named 'config' should not make every file in it a triangle
      const node = makeNode({ label: "config/utils.ts" });
      expect(getNodeStyle(node, 0, false, false).shape).toBe("ellipse");
    });

    it("is case-insensitive for shape detection", () => {
      const node = makeNode({ label: "src/Main.ts" });
      expect(getNodeStyle(node, 0, false, false).shape).toBe("diamond");
    });
  });
});

// ---------------------------------------------------------------------------
// getEdgeStyle
// ---------------------------------------------------------------------------

describe("getEdgeStyle", () => {
  it("returns normal style when not circular and not selected", () => {
    const style = getEdgeStyle(false, false);
    expect(style.lineColor).toBe("#5a5348");
    expect(style.width).toBe(1.5);
    expect(style.lineStyle).toBe("solid");
  });

  it("returns circular style when isCircular is true", () => {
    const style = getEdgeStyle(true, false);
    expect(style.lineColor).toBe("#ff5555");
    expect(style.lineStyle).toBe("dashed");
  });

  it("circular style has width 2.5", () => {
    expect(getEdgeStyle(true, false).width).toBe(2.5);
  });

  it("returns selected style when isSelected is true", () => {
    const style = getEdgeStyle(false, true);
    expect(style.lineColor).toBe("#f0a050");
    expect(style.width).toBe(3);
    expect(style.lineStyle).toBe("solid");
  });

  it("selected takes priority over circular", () => {
    const style = getEdgeStyle(true, true);
    expect(style.lineColor).toBe("#f0a050");
    expect(style.width).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// getLayoutConfig
// ---------------------------------------------------------------------------

describe("getLayoutConfig", () => {
  it("force layout returns name fcose", () => {
    expect(getLayoutConfig("force").name).toBe("fcose");
  });

  it("force layout has animate true", () => {
    expect(getLayoutConfig("force").animate).toBe(true);
  });

  it("tree layout returns name dagre", () => {
    expect(getLayoutConfig("tree").name).toBe("dagre");
  });

  it("tree layout has rankDir TB", () => {
    expect(getLayoutConfig("tree").rankDir).toBe("TB");
  });

  it("tree layout has animate true", () => {
    expect(getLayoutConfig("tree").animate).toBe(true);
  });

  it("circle layout returns name circle", () => {
    expect(getLayoutConfig("circle").name).toBe("circle");
  });

  it("circle layout has animate true", () => {
    expect(getLayoutConfig("circle").animate).toBe(true);
  });
});
