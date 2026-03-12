import type cytoscape from "cytoscape";
import type { Node, Edge } from "./types";
import { getLanguageColor } from "./colors";

type NodeSize = 40 | 55 | 70 | 85;
type NodeShape = "diamond" | "triangle" | "ellipse";

function getNodeSize(connectionCount: number): NodeSize {
  if (connectionCount <= 1) return 40;
  if (connectionCount <= 5) return 55;
  if (connectionCount <= 9) return 70;
  return 85;
}

function getNodeShape(node: Node): NodeShape {
  const name = node.label.split("/").pop()?.toLowerCase() ?? "";
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
  const color = isOrphan ? "#8a8078" : getLanguageColor(node.language);
  const size = getNodeSize(connectionCount);
  const shape = getNodeShape(node);
  const opacity = isOrphan ? 0.6 : 1;
  const borderColor = isCircular ? "#ff5555" : color;
  const borderWidth = isCircular ? 4 : 2;

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
    return { lineColor: "#f0a050", width: 3, lineStyle: "solid" };
  }
  if (isCircular) {
    return { lineColor: "#ff5555", width: 2.5, lineStyle: "dashed" };
  }
  return { lineColor: "#5a5348", width: 1.5, lineStyle: "solid" };
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
        animationDuration: 600,
        quality: "proof",
        nodeRepulsion: 120000,
        idealEdgeLength: 300,
        edgeElasticity: 0.1,
        gravity: 0.02,
        gravityRange: 1.2,
        nodeSeparation: 250,
        numIter: 5000,
        tile: true,
        tilingPaddingVertical: 60,
        tilingPaddingHorizontal: 60,
      };
    case "tree":
      return {
        name: "dagre",
        rankDir: "TB",
        animate: true,
        animationDuration: 500,
        rankSep: 180,
        nodeSep: 120,
        edgeSep: 50,
      };
    case "circle":
      return {
        name: "circle",
        animate: true,
        animationDuration: 500,
        spacingFactor: 2.0,
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
        label: node.label.split("/").pop() ?? node.label,
        path: node.id,
        language: node.language,
        fileSize: node.lines,
        importCount: node.imports.length,
        exportCount: node.importedBy.length,
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
    const isCircular = edge.isCircular || circularEdgePairs.has(edgeKey);

    const edgeStyle = getEdgeStyle(isCircular, false);

    return {
      data: {
        id: edgeKey,
        source: edge.source,
        target: edge.target,
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
  "font-size": "12px",
  "font-family": "Fira Code, monospace",
  color: "#f5f0e8",
  "text-valign": "bottom",
  "text-halign": "center",
  "text-margin-y": 8,
  "text-outline-color": "#0d0d0c",
  "text-outline-width": 3,
  "min-zoomed-font-size": 6,
  "overlay-padding": 6,
  "text-max-width": "120px",
  "text-wrap": "ellipsis",
};

const edgeBaseStyle: Record<string, unknown> = {
  width: "data(lineWidth)",
  "line-color": "data(lineColor)",
  "line-style": "data(lineStyle)",
  "curve-style": "bezier",
  "target-arrow-shape": "triangle",
  "target-arrow-color": "data(lineColor)",
  "arrow-scale": 1.0,
  opacity: 0.8,
};

export const cytoscapeStylesheet: cytoscape.StylesheetStyle[] = [
  {
    selector: "node",
    style: nodeBaseStyle as cytoscape.Css.Node,
  },
  {
    selector: "node.circular",
    style: {
      "border-color": "#ff5555",
      "border-width": 4,
      "border-opacity": 1,
    } as cytoscape.Css.Node,
  },
  {
    selector: "node.orphan",
    style: {
      "background-color": "#8a8078",
      opacity: 0.6,
    } as cytoscape.Css.Node,
  },
  {
    selector: "node.highlighted",
    style: {
      "border-color": "#f0a050",
      "border-width": 3,
      "border-opacity": 1,
    } as cytoscape.Css.Node,
  },
  {
    selector: "node:selected",
    style: {
      "border-color": "#f0a050",
      "border-width": 4,
      "border-opacity": 1,
      "overlay-color": "#f0a050",
      "overlay-opacity": 0.15,
    } as cytoscape.Css.Node,
  },
  {
    selector: "node.dimmed",
    style: {
      opacity: 0.12,
    } as cytoscape.Css.Node,
  },
  {
    selector: "node.bookmarked",
    style: {
      "border-color": "#c9a84c",
      "border-width": 3,
      "border-style": "double",
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
    selector: "node.impact-1",
    style: {
      "border-color": "#f0a050",
      "border-width": 4,
      "border-opacity": 1,
      opacity: 1,
    } as cytoscape.Css.Node,
  },
  {
    selector: "node.impact-2",
    style: {
      "border-color": "#f0a050",
      "border-width": 3,
      "border-opacity": 0.7,
      opacity: 0.85,
    } as cytoscape.Css.Node,
  },
  {
    selector: "node.impact-3",
    style: {
      "border-color": "#f0a050",
      "border-width": 2,
      "border-opacity": 0.5,
      opacity: 0.7,
    } as cytoscape.Css.Node,
  },
  {
    selector: "node.impact-far",
    style: {
      "border-color": "#f0a050",
      "border-width": 2,
      "border-opacity": 0.3,
      opacity: 0.55,
    } as cytoscape.Css.Node,
  },
  {
    selector: "node.impact-none",
    style: {
      opacity: 0.1,
    } as cytoscape.Css.Node,
  },
  {
    selector: "edge.impact-none",
    style: {
      opacity: 0.05,
    } as cytoscape.Css.Edge,
  },
  {
    selector: "node:parent",
    style: {
      "background-color": "#2a2a28",
      "background-opacity": 0.4,
      "border-color": "#5a5348",
      "border-width": 1,
      "border-style": "dashed",
      "border-opacity": 0.5,
      label: "data(label)",
      "font-size": "10px",
      "font-family": "Fira Code, monospace",
      color: "#63635e",
      "text-valign": "top",
      "text-halign": "center",
      "text-margin-y": -6,
      padding: "20px",
      shape: "roundrectangle",
    } as unknown as cytoscape.Css.Node,
  },
  {
    selector: "edge",
    style: edgeBaseStyle as cytoscape.Css.Edge,
  },
  {
    selector: "edge.highlighted",
    style: {
      "line-color": "#f0a050",
      "target-arrow-color": "#f0a050",
      width: 3,
      opacity: 1,
    } as cytoscape.Css.Edge,
  },
  {
    selector: "edge.dimmed",
    style: {
      opacity: 0.06,
    } as cytoscape.Css.Edge,
  },
  {
    selector: "edge[?isCircular]",
    style: {
      "line-color": "#ff5555",
      "target-arrow-color": "#ff5555",
      "line-style": "dashed",
      width: 2.5,
    } as cytoscape.Css.Edge,
  },
];

export function buildCompoundElements(
  clusters: Array<{ id: string; label: string; nodeIds: string[] }>,
): cytoscape.ElementDefinition[] {
  return clusters.map((cluster) => ({
    data: {
      id: `cluster:${cluster.id}`,
      label: cluster.label,
    },
  }));
}

export function assignParents(
  elements: cytoscape.ElementDefinition[],
  clusters: Array<{ id: string; nodeIds: string[] }>,
): cytoscape.ElementDefinition[] {
  const nodeToParent = new Map<string, string>();
  for (const cluster of clusters) {
    for (const nodeId of cluster.nodeIds) {
      nodeToParent.set(nodeId, `cluster:${cluster.id}`);
    }
  }

  return elements.map((el) => {
    // Only assign parents to node elements (edges have a source field)
    const parent = el.data.id && !el.data.source ? nodeToParent.get(el.data.id) : undefined;
    if (parent) {
      return { ...el, data: { ...el.data, parent } };
    }
    return el;
  });
}
