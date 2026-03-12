import { useMemo } from "react";
import { useGraphStore } from "../../stores/graphStore";
import { FileInfo } from "./FileInfo";
import { CodePreview } from "./CodePreview";
import { ConnectionList } from "./ConnectionList";

export function Sidebar() {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const graphData = useGraphStore((s) => s.graphData);
  const selectNode = useGraphStore((s) => s.selectNode);

  const selectedNode = useMemo(() => {
    if (!graphData || !selectedNodeId) return null;
    return graphData.nodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [graphData, selectedNodeId]);

  return (
    <aside
      className={`flex h-full w-80 shrink-0 flex-col border-l border-border bg-bg-secondary transition-all duration-300 ease-out ${
        selectedNode ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ marginRight: selectedNode ? 0 : "-20rem" }}
    >
      {selectedNode && graphData ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="truncate font-mono text-xs font-medium text-text-primary">
              {selectedNode.filename}
            </span>
            <button
              onClick={() => selectNode(null)}
              className="flex h-6 w-6 items-center justify-center rounded text-text-muted transition-colors duration-200 hover:bg-bg-elevated hover:text-text-secondary"
              aria-label="Close sidebar"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <line x1="1" y1="1" x2="9" y2="9" />
                <line x1="9" y1="1" x2="1" y2="9" />
              </svg>
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-3">
            <FileInfo node={selectedNode} insights={graphData.insights} />

            <div className="border-t border-border pt-3">
              <SectionLabel text="Connections" />
              <ConnectionList node={selectedNode} />
            </div>

            <div className="border-t border-border pt-3">
              <SectionLabel text="Preview" />
              <CodePreview
                filePath={selectedNode.path}
                language={selectedNode.language}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-full items-center justify-center px-4">
          <span className="font-mono text-xs text-text-muted text-center">
            Click a node to see details
          </span>
        </div>
      )}
    </aside>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-text-muted">
      {text}
    </div>
  );
}
