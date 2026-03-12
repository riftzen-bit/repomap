import { useRef, useState, useCallback, useEffect } from "react";
import { useGraphStore } from "../../stores/graphStore";
import { useGraph } from "./useGraph";
import type { ContextMenuEvent } from "./useGraph";
import { useExporter } from "../../hooks/useExporter";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { GraphControls } from "./GraphControls";
import { GraphMinimap } from "./GraphMinimap";
import { NodeContextMenu } from "./NodeContextMenu";
import { KeyboardHelp } from "../common/KeyboardHelp";

export function GraphCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  const graphData = useGraphStore((s) => s.graphData);
  const layout = useGraphStore((s) => s.layout);
  const filters = useGraphStore((s) => s.filters);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const focusRequestId = useGraphStore((s) => s.focusRequestId);
  const impactMode = useGraphStore((s) => s.impactMode);
  const selectNode = useGraphStore((s) => s.selectNode);

  const onSelectNode = useCallback(
    (id: string | null) => {
      selectNode(id);
    },
    [selectNode],
  );

  const {
    cy,
    zoomIn,
    zoomOut,
    fitToScreen,
    focusNode,
    focusNeighbors,
    hideNode,
    showOnlyConnected,
    resetView,
    setOnContextMenu,
  } = useGraph(containerRef, graphData, layout, filters, selectedNodeId, impactMode, onSelectNode);

  const [contextMenu, setContextMenu] = useState<ContextMenuEvent | null>(null);

  // Register context menu callback with the hook
  useEffect(() => {
    setOnContextMenu((event: ContextMenuEvent) => {
      setContextMenu(event);
    });
    return () => setOnContextMenu(null);
  }, [setOnContextMenu]);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  // React to focus requests from search/other components
  useEffect(() => {
    if (focusRequestId) {
      focusNode(focusRequestId);
      // Clear the request so it can be re-triggered for the same node
      useGraphStore.setState({ focusRequestId: null });
    }
  }, [focusRequestId, focusNode]);

  const { exportSvg, exportPng, exportJson, exportMermaid, exportError, clearError } = useExporter(cy);

  const [showHelp, setShowHelp] = useState(false);
  const toggleHelp = useCallback(() => setShowHelp((prev) => !prev), []);

  useKeyboardShortcuts({ zoomIn, zoomOut, fitToScreen, onToggleHelp: toggleHelp });

  if (!graphData) {
    return (
      <div className="grain-bg flex flex-1 items-center justify-center">
        <span className="font-mono text-xs text-text-muted">
          No graph data
        </span>
      </div>
    );
  }

  return (
    <div className="grain-bg relative flex-1" onContextMenu={(e) => e.preventDefault()}>
      <div ref={containerRef} className="h-full w-full" />
      <GraphControls
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFitToScreen={fitToScreen}
        onExportSvg={exportSvg}
        onExportPng={exportPng}
        onExportJson={exportJson}
        onExportMermaid={exportMermaid}
      />
      <GraphMinimap cy={cy} graphReady={!!graphData} />
      {exportError && (
        <div className="absolute top-4 left-1/2 z-40 -translate-x-1/2 rounded border border-accent-danger/30 bg-accent-danger/10 px-4 py-2 font-mono text-xs text-accent-danger shadow-lg">
          {exportError}
          <button
            onClick={clearError}
            className="ml-3 text-text-muted hover:text-text-primary"
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      )}
      {showHelp && <KeyboardHelp onClose={() => setShowHelp(false)} />}
      {contextMenu && (
        <NodeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          nodePath={contextMenu.nodePath}
          onClose={closeContextMenu}
          onCopyPath={() => {
            navigator.clipboard.writeText(contextMenu.nodePath);
          }}
          onFocusNeighbors={() => focusNeighbors(contextMenu.nodeId)}
          onHideNode={() => hideNode(contextMenu.nodeId)}
          onShowOnlyConnected={() => showOnlyConnected(contextMenu.nodeId)}
          onResetView={resetView}
        />
      )}
    </div>
  );
}
