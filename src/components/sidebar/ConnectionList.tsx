import { useMemo } from "react";
import type { Node, Edge, Insights } from "../../lib/types";
import { getLanguageColor } from "../../lib/colors";
import { useGraphStore } from "../../stores/graphStore";

interface ConnectionListProps {
  node: Node;
}

export function ConnectionList({ node }: ConnectionListProps) {
  const graphData = useGraphStore((s) => s.graphData);
  const focusNode = useGraphStore((s) => s.focusNode);

  const { imports, importedBy } = useMemo(() => {
    if (!graphData) return { imports: [], importedBy: [] };

    const nodeMap = new Map(graphData.nodes.map((n) => [n.id, n]));

    const outgoing: ConnectionEntry[] = [];
    const incoming: ConnectionEntry[] = [];

    for (const edge of graphData.edges) {
      if (edge.source === node.id) {
        const target = nodeMap.get(edge.target);
        if (target) {
          outgoing.push({
            node: target,
            edge,
            isCircular: isInCircularDep(
              edge.source,
              edge.target,
              graphData.insights,
            ),
          });
        }
      }
      if (edge.target === node.id) {
        const source = nodeMap.get(edge.source);
        if (source) {
          incoming.push({
            node: source,
            edge,
            isCircular: isInCircularDep(
              edge.source,
              edge.target,
              graphData.insights,
            ),
          });
        }
      }
    }

    return { imports: outgoing, importedBy: incoming };
  }, [graphData, node.id]);

  return (
    <div className="flex flex-col gap-3">
      <ConnectionSection
        title="Imports"
        entries={imports}
        onSelect={focusNode}
      />
      <ConnectionSection
        title="Imported By"
        entries={importedBy}
        onSelect={focusNode}
      />
    </div>
  );
}

interface ConnectionEntry {
  node: Node;
  edge: Edge;
  isCircular: boolean;
}

function ConnectionSection({
  title,
  entries,
  onSelect,
}: {
  title: string;
  entries: ConnectionEntry[];
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-text-muted">
        {title} ({entries.length})
      </div>
      {entries.length === 0 ? (
        <div className="pl-2 font-mono text-[11px] text-text-muted italic">
          None
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {entries.map((entry) => (
            <button
              key={entry.node.id}
              onClick={() => onSelect(entry.node.id)}
              className={`group flex w-full items-center gap-2 rounded px-2 py-1 text-left transition-colors duration-200 hover:bg-bg-elevated ${
                entry.isCircular ? "ring-1 ring-accent-danger/30" : ""
              }`}
            >
              {/* File icon colored by language */}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="shrink-0"
                style={{ color: getLanguageColor(entry.node.language) }}
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>

              <span className="truncate font-mono text-[11px] text-text-secondary transition-colors duration-200 group-hover:text-text-primary">
                {entry.node.id}
              </span>

              {entry.isCircular && (
                <span className="ml-auto shrink-0 font-mono text-[9px] text-accent-danger">
                  circular
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function isInCircularDep(
  sourceId: string,
  targetId: string,
  insights: Insights,
): boolean {
  return insights.circularDeps.some(
    (cycle) => cycle.includes(sourceId) && cycle.includes(targetId),
  );
}
