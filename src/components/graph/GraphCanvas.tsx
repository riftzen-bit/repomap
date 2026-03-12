import { useRef, useState, useCallback } from "react";
import { useGraphStore } from "../../stores/graphStore";
import { useGraph } from "./useGraph";
import { useExporter } from "../../hooks/useExporter";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { GraphControls } from "./GraphControls";
import { KeyboardHelp } from "../common/KeyboardHelp";

export function GraphCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  const graphData = useGraphStore((s) => s.graphData);
  const layout = useGraphStore((s) => s.layout);
  const filters = useGraphStore((s) => s.filters);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const selectNode = useGraphStore((s) => s.selectNode);

  const onSelectNode = useCallback(
    (id: string | null) => {
      selectNode(id);
    },
    [selectNode],
  );

  const { cy, zoomIn, zoomOut, fitToScreen } = useGraph(
    containerRef,
    graphData,
    layout,
    filters,
    selectedNodeId,
    onSelectNode,
  );

  const { exportSvg, exportPng, exportJson, exportMermaid } = useExporter(cy);

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
    <div className="grain-bg relative flex-1">
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
      {showHelp && <KeyboardHelp onClose={() => setShowHelp(false)} />}
    </div>
  );
}
