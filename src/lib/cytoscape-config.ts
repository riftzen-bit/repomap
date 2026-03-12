import type cytoscape from "cytoscape";
import type { Node, Edge } from "./types";
import { getLanguageColor } from "./colors";

type NodeSize = 30 | 40 | 50 | 60;
type NodeShape = "diamond" | "triangle" | "ellipse";

function getNodeSize(connectionCount: number): NodeSize {
  if (connectionCount <= 1) return 30;
  if (connectionCount <= 5) return 40;
  if (connectionCount <= 9) return 50;
  return 60;
}

function getNodeShape(node: Node): NodeShape {
  const name = node.filename.toLowerCase();
  if (
    name === "index.ts" ||
    name === "index.tsx" ||
    name === "index.js" ||
    name === "main.ts" ||
    name === "main.tsx" ||
    name === "main.go" ||
    name === "main.rs" ||
    name === "app.tsx" ||
    name === "app.ts"
  ) {
    return "diamond";
  }
  if (
    name.includes("config") ||
    name.includes(".config.") ||
    name.includes("tsconfig") ||
    name.includes("settings")
  ) {
    return "triangle";
  }
  return "ellipse";
}

export interface NodeStyleData {
  color: string;
  size: NodeSize;
  shape: NodeShape;
  opacity: number;
  borderColor: string;
  borderWidth: number;
}

export function getNodeStyle(
  node: Node,
  connectionCount: number,
  isOrphan: boolean,
  isCircular: boolean,
): NodeStyleData {
  const color = isOrphan ? "#6b6158" : getLanguageColor(node.language);
  const size = getNodeSize(connectionCount);
  const shape = getNodeShape(node);
  const opacity = isOrphan ? 0.5 : 1;
  const borderColor = isCircular ? "#c45c5c" : color;
  const borderWidth = isCircular ? 3 : 1;

  return { color, size, shape, opacity, borderColor, borderWidth };
}

export interface EdgeStyleData {
  lineColor: string;
  width: number;
  lineStyle: "solid" | "dashed";
}

export function getEdgeStyle(
  isCircular: boolean,
  isSelected: boolean,
): EdgeStyleData {
  if (isSelected) {
    return { lineColor: "#d4915c", width: 2, lineStyle: "solid" };
  }
  if (isCircular) {
    return { lineColor: "#c45c5c", width: 2, lineStyle: "dashed" };
  }
  return { lineColor: "#3d362d", width: 1, lineStyle: "solid" };
}

interface LayoutConfig {
  name: string;
  animate: boolean;
  animationDuration: number;
  [key: string]: unknown;
}

export function getLayoutConfig(
  layoutType: "force" | "tree" | "circle",
): LayoutConfig {
  switch (layoutType) {
    case "force":
      return {
        name: "fcose",
        animate: true,
        animationDuration: 500,
        nodeRepulsion: 8000,
        idealEdgeLength: 100,
      };
    case "tree":
      return {
        name: "dagre",
        rankDir: "TB",
        animate: true,
        animationDuration: 500,
      };
    case "circle":
      return {
        name: "circle",
        animate: true,
        animationDuration: 500,
      };
  }
}

export function buildCytoscapeElements(
  nodes: Node[],
  edges: Edge[],
  orphanIds: Set<string>,
  circularIds: Set<string>,
): cytoscape.ElementDefinition[] {
  const connectionCounts = new Map<string, number>();
  for (const edge of edges) {
    connectionCounts.set(
      edge.source,
      (connectionCounts.get(edge.source) ?? 0) + 1,
    );
    connectionCounts.set(
      edge.target,
      (connectionCounts.get(edge.target) ?? 0) + 1,
    );
  }

  const circularEdgePairs = new Set<string>();
  for (const cycle of groupCircularEdges(edges, circularIds)) {
    circularEdgePairs.add(cycle);
  }

  const nodeElements: cytoscape.ElementDefinition[] = nodes.map((node) => {
    const count = connectionCounts.get(node.id) ?? 0;
    const isOrphan = orphanIds.has(node.id);
    const isCircular = circularIds.has(node.id);
    const style = getNodeStyle(node, count, isOrphan, isCircular);

    const classes: string[] = [];
    if (isOrphan) classes.push("orphan");
    if (isCircular) classes.push("circular");

    return {
      data: {
        id: node.id,
        label: node.filename,
        path: node.path,
        language: node.language,
        fileSize: node.size,
        importCount: node.importCount,
        exportCount: node.exportCount,
        symbolCount: node.symbols.length,
        nodeColor: style.color,
        nodeSize: style.size,
        nodeShape: style.shape,
        nodeOpacity: style.opacity,
        borderColor: style.borderColor,
        borderWidth: style.borderWidth,
      },
      classes: classes.join(" "),
    };
  });

  const edgeElements: cytoscape.ElementDefinition[] = edges.map((edge) => {
    const edgeKey = `${edge.source}->${edge.target}`;
    const isCircular = circularEdgePairs.has(edgeKey);

    const edgeStyle = getEdgeStyle(isCircular, false);

    return {
      data: {
        id: edgeKey,
        source: edge.source,
        target: edge.target,
        symbols: edge.symbols,
        lineColor: edgeStyle.lineColor,
        lineWidth: edgeStyle.width,
        lineStyle: edgeStyle.lineStyle,
        isCircular,
      },
    };
  });

  return [...nodeElements, ...edgeElements];
}

function groupCircularEdges(
  edges: Edge[],
  circularIds: Set<string>,
): string[] {
  const pairs: string[] = [];
  for (const edge of edges) {
    if (circularIds.has(edge.source) && circularIds.has(edge.target)) {
      pairs.push(`${edge.source}->${edge.target}`);
    }
  }
  return pairs;
}

// Cytoscape data() mappers for enum-typed style properties need a cast
// because the type defs don't model dynamic data bindings
const nodeBaseStyle: Record<string, unknown> = {
  label: "data(label)",
  "background-color": "data(nodeColor)",
  width: "data(nodeSize)",
  height: "data(nodeSize)",
  shape: "data(nodeShape)",
  opacity: "data(nodeOpacity)",
  "border-color": "data(borderColor)",
  "border-width": "data(borderWidth)",
  "font-size": "10px",
  "font-family": "JetBrains Mono, monospace",
  color: "#e8e0d4",
  "text-valign": "bottom",
  "text-halign": "center",
  "text-margin-y": 6,
  "text-outline-color": "#1a1714",
  "text-outline-width": 2,
  "min-zoomed-font-size": 8,
  "overlay-padding": 4,
};

const edgeBaseStyle: Record<string, unknown> = {
  width: "data(lineWidth)",
  "line-color": "data(lineColor)",
  "line-style": "data(lineStyle)",
  "curve-style": "bezier",
  "target-arrow-shape": "triangle",
  "target-arrow-color": "data(lineColor)",
  "arrow-scale": 0.8,
  opacity: 0.6,
};

export const cytoscapeStylesheet: cytoscape.StylesheetStyle[] = [
  {
    selector: "node",
    style: nodeBaseStyle as cytoscape.Css.Node,
  },
  {
    selector: "node.circular",
    style: {
      "border-color": "#c45c5c",
      "border-width": 3,
      "border-opacity": 1,
    } as cytoscape.Css.Node,
  },
  {
    selector: "node.orphan",
    style: {
      "background-color": "#6b6158",
      opacity: 0.5,
    } as cytoscape.Css.Node,
  },
  {
    selector: "node.highlighted",
    style: {
      "border-color": "#d4915c",
      "border-width": 2,
      "border-opacity": 1,
    } as cytoscape.Css.Node,
  },
  {
    selector: "node:selected",
    style: {
      "border-color": "#d4915c",
      "border-width": 3,
      "border-opacity": 1,
      "overlay-color": "#d4915c",
      "overlay-opacity": 0.1,
    } as cytoscape.Css.Node,
  },
  {
    selector: "node.dimmed",
    style: {
      opacity: 0.15,
    } as cytoscape.Css.Node,
  },
  {
    selector: "node.search-match",
    style: {
      "border-color": "#c9a84c",
      "border-width": 3,
      "border-opacity": 1,
    } as cytoscape.Css.Node,
  },
  {
    selector: "edge",
    style: edgeBaseStyle as cytoscape.Css.Edge,
  },
  {
    selector: "edge.highlighted",
    style: {
      "line-color": "#d4915c",
      "target-arrow-color": "#d4915c",
      width: 2,
      opacity: 1,
    } as cytoscape.Css.Edge,
  },
  {
    selector: "edge.dimmed",
    style: {
      opacity: 0.08,
    } as cytoscape.Css.Edge,
  },
  {
    selector: "edge[?isCircular]",
    style: {
      "line-color": "#c45c5c",
      "target-arrow-color": "#c45c5c",
      "line-style": "dashed",
      width: 2,
    } as cytoscape.Css.Edge,
  },
];
