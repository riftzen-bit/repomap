import { useEffect, useRef, useCallback } from "react";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import dagre from "cytoscape-dagre";
import type { GraphData, Filters } from "../../lib/types";
import {
  buildCytoscapeElements,
  cytoscapeStylesheet,
  getLayoutConfig,
  buildCompoundElements,
  assignParents,
} from "../../lib/cytoscape-config";
import { computeClusters } from "../../lib/clustering";
import { getNodesWithinDepth, getImpactedNodes } from "../../lib/graph-utils";

// Register extensions exactly once
let extensionsRegistered = false;
function registerExtensions() {
  if (extensionsRegistered) return;
  cytoscape.use(fcose as cytoscape.Ext);
  cytoscape.use(dagre as cytoscape.Ext);
  extensionsRegistered = true;
}

interface ContextMenuEvent {
  x: number;
  y: number;
  nodeId: string;
  nodePath: string;
}

interface UseGraphResult {
  cy: React.RefObject<cytoscape.Core | null>;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToScreen: () => void;
  focusNode: (nodeId: string) => void;
  focusNeighbors: (nodeId: string) => void;
  hideNode: (nodeId: string) => void;
  showOnlyConnected: (nodeId: string) => void;
  resetView: () => void;
  onContextMenu: ((event: ContextMenuEvent) => void) | null;
  setOnContextMenu: (cb: ((event: ContextMenuEvent) => void) | null) => void;
}

export type { ContextMenuEvent };

export function useGraph(
  containerRef: React.RefObject<HTMLDivElement | null>,
  graphData: GraphData | null,
  layout: "force" | "tree" | "circle",
  filters: Filters,
  selectedNodeId: string | null,
  impactMode: boolean,
  clusteringEnabled: boolean,
  onSelectNode: (id: string | null) => void,
): UseGraphResult {
  const cyRef = useRef<cytoscape.Core | null>(null);
  const prevLayoutRef = useRef(layout);
  const prevFiltersRef = useRef(filters);
  const contextMenuCbRef = useRef<((event: ContextMenuEvent) => void) | null>(null);

  // Initialize cytoscape instance
  useEffect(() => {
    if (!containerRef.current) return;

    registerExtensions();

    const cy = cytoscape({
      container: containerRef.current,
      style: cytoscapeStylesheet,
      minZoom: 0.1,
      maxZoom: 5,
      wheelSensitivity: 0.3,
      boxSelectionEnabled: false,
    });

    cyRef.current = cy;

    // Node click
    cy.on("tap", "node", (evt) => {
      const nodeId = evt.target.id();
      onSelectNode(nodeId);
    });

    // Background click → deselect
    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        onSelectNode(null);
      }
    });

    // Node right-click → context menu
    cy.on("cxttap", "node", (evt) => {
      evt.originalEvent?.preventDefault();
      const node = evt.target;
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const renderedPos = node.renderedPosition();

      const x = renderedPos.x + containerRect.left;
      const y = renderedPos.y + containerRect.top;

      contextMenuCbRef.current?.({
        x: x - containerRect.left,
        y: y - containerRect.top,
        nodeId: node.id(),
        nodePath: (node.data("path") as string) ?? node.id(),
      });
    });

    // Node hover → highlight neighborhood
    cy.on("mouseover", "node", (evt) => {
      const node = evt.target;
      const neighborhood = node.neighborhood().add(node);
      cy.elements().not(neighborhood).addClass("dimmed");
      neighborhood.edges().addClass("highlighted");
      neighborhood.nodes().not(node).addClass("highlighted");
    });

    cy.on("mouseout", "node", () => {
      cy.elements().removeClass("dimmed highlighted");
    });

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [containerRef, onSelectNode]);

  // Rebuild graph when data changes
  const prevGraphDataRef = useRef(graphData);
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !graphData) return;

    const orphanIds = new Set(graphData.insights.orphanFiles);
    const circularIds = new Set(graphData.insights.circularDeps.flat());

    const elements = buildCytoscapeElements(
      graphData.nodes,
      graphData.edges,
      orphanIds,
      circularIds,
    );

    let finalElements = elements;

    if (clusteringEnabled && layout === "force" && graphData.nodes.length > 30) {
      const clusters = computeClusters(graphData.nodes);
      if (clusters.length > 0) {
        const compoundElements = buildCompoundElements(clusters);
        finalElements = [...compoundElements, ...assignParents(elements, clusters)];
      }
    }

    cy.elements().remove();
    cy.add(finalElements);

    applyFilters(cy, filters, graphData, selectedNodeId);

    const layoutConfig = getLayoutConfig(layout);
    cy.layout(layoutConfig as cytoscape.LayoutOptions).run();

    prevGraphDataRef.current = graphData;
    prevLayoutRef.current = layout;
    prevFiltersRef.current = filters;
  }, [graphData, clusteringEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-layout only when layout type changes (not on graphData change)
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !graphData || prevLayoutRef.current === layout) return;
    prevLayoutRef.current = layout;

    const layoutConfig = getLayoutConfig(layout);
    cy.layout(layoutConfig as cytoscape.LayoutOptions).run();
  }, [layout]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-filter only when filters change (not on graphData change)
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !graphData || prevFiltersRef.current === filters) return;
    prevFiltersRef.current = filters;

    applyFilters(cy, filters, graphData, selectedNodeId);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // React to node selection
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.nodes().unselect();
    if (selectedNodeId) {
      const node = cy.getElementById(selectedNodeId);
      if (node.length > 0) {
        node.select();
      }
    }
  }, [selectedNodeId]);

  // Impact analysis highlighting
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !graphData) return;

    // Clear previous impact classes
    cy.elements().removeClass("impact-1 impact-2 impact-3 impact-far impact-none");

    if (!impactMode || !selectedNodeId) return;

    const impacted = getImpactedNodes(selectedNodeId, graphData.edges);

    cy.nodes().forEach((node) => {
      const nodeId = node.id();
      if (nodeId === selectedNodeId) return; // Keep selected node as-is
      if (node.isParent()) return; // Skip compound cluster containers

      const depth = impacted.get(nodeId);
      if (depth === undefined) {
        node.addClass("impact-none");
      } else if (depth === 1) {
        node.addClass("impact-1");
      } else if (depth === 2) {
        node.addClass("impact-2");
      } else if (depth === 3) {
        node.addClass("impact-3");
      } else {
        node.addClass("impact-far");
      }
    });

    // Dim edges not connected to impacted nodes
    cy.edges().forEach((edge) => {
      const srcId = edge.source().id();
      const tgtId = edge.target().id();
      const srcImpacted = srcId === selectedNodeId || impacted.has(srcId);
      const tgtImpacted = tgtId === selectedNodeId || impacted.has(tgtId);
      if (!srcImpacted || !tgtImpacted) {
        edge.addClass("impact-none");
      }
    });
  }, [impactMode, selectedNodeId, graphData]);

  const zoomIn = useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.animate({ zoom: cy.zoom() * 1.3, duration: 200 });
  }, []);

  const zoomOut = useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.animate({ zoom: cy.zoom() / 1.3, duration: 200 });
  }, []);

  const fitToScreen = useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.animate({ fit: { eles: cy.elements(), padding: 60 }, duration: 300 });
  }, []);

  const focusNode = useCallback((nodeId: string) => {
    const cy = cyRef.current;
    if (!cy) return;
    const node = cy.getElementById(nodeId);
    if (node.length === 0) return;

    cy.animate({
      center: { eles: node },
      zoom: 2,
      duration: 400,
    });

    node.select();
  }, []);

  const focusNeighbors = useCallback((nodeId: string) => {
    const cy = cyRef.current;
    if (!cy) return;
    const node = cy.getElementById(nodeId);
    if (node.length === 0) return;

    const neighborhood = node.neighborhood().add(node);
    cy.animate({
      fit: { eles: neighborhood, padding: 60 },
      duration: 400,
    });
  }, []);

  const hideNode = useCallback((nodeId: string) => {
    const cy = cyRef.current;
    if (!cy) return;
    const node = cy.getElementById(nodeId);
    if (node.length === 0) return;

    node.style("display", "none");
    node.connectedEdges().style("display", "none");
  }, []);

  const showOnlyConnected = useCallback((nodeId: string) => {
    const cy = cyRef.current;
    if (!cy) return;
    const node = cy.getElementById(nodeId);
    if (node.length === 0) return;

    const neighborhood = node.neighborhood().add(node);
    const neighborhoodEdges = neighborhood.connectedEdges().filter((edge) => {
      const src = edge.source();
      const tgt = edge.target();
      return neighborhood.contains(src) && neighborhood.contains(tgt);
    });

    cy.elements().not(neighborhood).not(neighborhoodEdges).style("display", "none");
    neighborhood.style("display", "element");
    neighborhoodEdges.style("display", "element");
  }, []);

  const resetView = useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.nodes().style("display", "element");
    cy.edges().style("display", "element");
    cy.animate({
      fit: { eles: cy.elements(), padding: 60 },
      duration: 300,
    });
  }, []);

  const setOnContextMenu = useCallback(
    (cb: ((event: ContextMenuEvent) => void) | null) => {
      contextMenuCbRef.current = cb;
    },
    [],
  );

  return {
    cy: cyRef,
    zoomIn,
    zoomOut,
    fitToScreen,
    focusNode,
    focusNeighbors,
    hideNode,
    showOnlyConnected,
    resetView,
    onContextMenu: contextMenuCbRef.current,
    setOnContextMenu,
  };
}

function applyFilters(
  cy: cytoscape.Core,
  filters: Filters,
  graphData: GraphData | null,
  selectedNodeId: string | null,
) {
  // Pre-compute depth-visible set if maxDepth is active
  let depthVisibleSet: Set<string> | null = null;
  if (filters.maxDepth !== null && selectedNodeId && graphData) {
    depthVisibleSet = getNodesWithinDepth(selectedNodeId, graphData.edges, filters.maxDepth);
  }

  cy.nodes().forEach((node) => {
    const language = node.data("language") as string;
    const connectedEdges = node.connectedEdges().length;
    const nodeId = node.id();

    let visible = true;

    // Language filter
    if (filters.languages.length > 0 && !filters.languages.includes(language)) {
      visible = false;
    }

    // Directory filter
    if (filters.directories.length > 0) {
      const path = node.data("path") as string;
      const topDir = path.includes("/") ? path.split("/")[0] : ".";
      if (!filters.directories.includes(topDir)) {
        visible = false;
      }
    }

    // Min connections filter
    if (connectedEdges < filters.minConnections) {
      visible = false;
    }

    // Depth filter (intersection with other filters)
    if (depthVisibleSet && !depthVisibleSet.has(nodeId)) {
      visible = false;
    }

    node.style("display", visible ? "element" : "none");
  });

  // Hide edges whose source or target is hidden
  cy.edges().forEach((edge) => {
    const src = edge.source();
    const tgt = edge.target();
    if (src.style("display") === "none" || tgt.style("display") === "none") {
      edge.style("display", "none");
    } else {
      edge.style("display", "element");
    }
  });
}
