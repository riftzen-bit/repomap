import { useEffect, useRef, useCallback } from "react";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import dagre from "cytoscape-dagre";
import type { GraphData } from "../../lib/types";
import {
  buildCytoscapeElements,
  cytoscapeStylesheet,
  getLayoutConfig,
} from "../../lib/cytoscape-config";

// Register extensions exactly once
let extensionsRegistered = false;
function registerExtensions() {
  if (extensionsRegistered) return;
  cytoscape.use(fcose as cytoscape.Ext);
  cytoscape.use(dagre as cytoscape.Ext);
  extensionsRegistered = true;
}

interface Filters {
  languages: string[];
  directories: string[];
  minConnections: number;
}

interface UseGraphResult {
  cy: React.RefObject<cytoscape.Core | null>;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToScreen: () => void;
  focusNode: (nodeId: string) => void;
}

export function useGraph(
  containerRef: React.RefObject<HTMLDivElement | null>,
  graphData: GraphData | null,
  layout: "force" | "tree" | "circle",
  filters: Filters,
  selectedNodeId: string | null,
  onSelectNode: (id: string | null) => void,
): UseGraphResult {
  const cyRef = useRef<cytoscape.Core | null>(null);
  const prevLayoutRef = useRef(layout);
  const prevFiltersRef = useRef(filters);

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

    cy.elements().remove();
    cy.add(elements);

    applyFilters(cy, filters);

    const layoutConfig = getLayoutConfig(layout);
    cy.layout(layoutConfig as cytoscape.LayoutOptions).run();

    prevGraphDataRef.current = graphData;
    prevLayoutRef.current = layout;
    prevFiltersRef.current = filters;
  }, [graphData]); // eslint-disable-line react-hooks/exhaustive-deps

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

    applyFilters(cy, filters);
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

  return { cy: cyRef, zoomIn, zoomOut, fitToScreen, focusNode };
}

function applyFilters(cy: cytoscape.Core, filters: Filters) {
  cy.nodes().forEach((node) => {
    const language = node.data("language") as string;
    const connectedEdges = node.connectedEdges().length;

    let visible = true;

    // Language filter: if languages are specified, hide non-matching
    if (filters.languages.length > 0) {
      if (!filters.languages.includes(language)) {
        visible = false;
      }
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

    if (visible) {
      node.style("display", "element");
    } else {
      node.style("display", "none");
    }
  });

  // Hide edges whose source or target is hidden
  cy.edges().forEach((edge) => {
    const src = edge.source();
    const tgt = edge.target();
    if (
      src.style("display") === "none" ||
      tgt.style("display") === "none"
    ) {
      edge.style("display", "none");
    } else {
      edge.style("display", "element");
    }
  });
}
