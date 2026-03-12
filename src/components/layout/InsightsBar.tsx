import { useMemo } from "react";
import { useGraphStore } from "../../stores/graphStore";
import { getLanguageColor } from "../../lib/colors";

export function InsightsBar() {
  const graphData = useGraphStore((s) => s.graphData);
  const filters = useGraphStore((s) => s.filters);

  const filtersActive =
    filters.languages.length > 0 ||
    filters.directories.length > 0 ||
    filters.minConnections > 0 ||
    filters.maxDepth !== null;

  const visibleCount = useMemo(() => {
    if (!graphData || !filtersActive) return 0;

    const connectionCounts = new Map<string, number>();
    for (const edge of graphData.edges) {
      connectionCounts.set(
        edge.source,
        (connectionCounts.get(edge.source) ?? 0) + 1,
      );
      connectionCounts.set(
        edge.target,
        (connectionCounts.get(edge.target) ?? 0) + 1,
      );
    }

    return graphData.nodes.filter((node) => {
      if (
        filters.languages.length > 0 &&
        !filters.languages.includes(node.language)
      )
        return false;

      if (filters.directories.length > 0) {
        const topDir = node.id.includes("/") ? node.id.split("/")[0] : ".";
        if (!filters.directories.includes(topDir)) return false;
      }

      if ((connectionCounts.get(node.id) ?? 0) < filters.minConnections)
        return false;

      return true;
    }).length;
  }, [graphData, filters, filtersActive]);

  if (!graphData) return null;

  const { insights } = graphData;

  return (
    <div className="flex h-7 shrink-0 items-center gap-4 border-t border-border bg-bg-secondary px-3">
      {/* Filtered count */}
      {filtersActive && (
        <span className="font-mono text-[10px] text-text-muted">
          Showing{" "}
          <span className="text-text-secondary">{visibleCount}</span>
          {" "}of{" "}
          <span className="text-text-secondary">{insights.totalFiles}</span>
        </span>
      )}

      {/* Total files */}
      <Metric label="Files" value={insights.totalFiles} />

      {/* Circular deps */}
      <Metric
        label="Circular"
        value={insights.circularDeps.length}
        color={insights.circularDeps.length > 0 ? "text-accent-danger" : undefined}
      />

      {/* Orphan files */}
      <Metric
        label="Orphans"
        value={insights.orphanFiles.length}
        color={
          insights.orphanFiles.length > 0 ? "text-accent-warning" : undefined
        }
      />

      {/* Hub files */}
      <Metric
        label="Hubs"
        value={insights.hubFiles.length}
        color={insights.hubFiles.length > 0 ? "text-accent-warning" : undefined}
      />

      {/* Divider */}
      <div className="h-3.5 w-px bg-border" />

      {/* Language breakdown */}
      <div className="flex items-center gap-1.5">
        {Object.entries(insights.languageBreakdown)
          .sort(([, a], [, b]) => b - a)
          .map(([lang, count]) => (
            <span
              key={lang}
              className="flex items-center gap-1 font-mono text-[10px]"
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: getLanguageColor(lang) }}
              />
              <span className="text-text-secondary">
                {lang}
              </span>
              <span className="text-text-muted">{count}</span>
            </span>
          ))}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 font-mono text-[10px]">
      <span className="text-text-muted">{label}</span>
      <span className={color ?? "text-text-secondary"}>{value}</span>
    </div>
  );
}
