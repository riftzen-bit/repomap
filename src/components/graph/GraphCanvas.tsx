import { useRef, useCallback } from "react";
import { useGraphStore } from "../../stores/graphStore";
import { useGraph } from "./useGraph";
import { GraphControls } from "./GraphControls";

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

  const { zoomIn, zoomOut, fitToScreen } = useGraph(
    containerRef,
    graphData,
    layout,
    filters,
    selectedNodeId,
    onSelectNode,
  );

  if (!graphData) {
    return (
      <div className="dot-grid flex flex-1 items-center justify-center">
        <span className="font-mono text-xs text-text-muted">
          No graph data
        </span>
      </div>
    );
  }

  return (
    <div className="dot-grid relative flex-1">
      <div ref={containerRef} className="h-full w-full" />
      <GraphControls
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFitToScreen={fitToScreen}
      />
    </div>
  );
}
