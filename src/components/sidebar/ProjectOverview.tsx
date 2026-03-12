import { useGraphStore } from "../../stores/graphStore";
import { getLanguageColor } from "../../lib/colors";
import { HealthGauge } from "./HealthGauge";

export function ProjectOverview() {
  const graphData = useGraphStore((s) => s.graphData);
  const focusNode = useGraphStore((s) => s.focusNode);
  const projectRoot = useGraphStore((s) => s.projectRoot);

  if (!graphData) return null;

  const { insights } = graphData;
  const projectName = projectRoot?.split("/").pop() ?? "Project";

  return (
    <div className="flex flex-col gap-4">
      {/* Project name */}
      <div>
        <div className="font-mono text-sm font-medium text-text-primary">
          {projectName}
        </div>
        <div className="mt-1 font-mono text-[10px] text-text-muted">
          {insights.totalFiles} files &middot;{" "}
          {graphData.edges.length} connections
        </div>
      </div>

      {/* Health score */}
      <HealthGauge insights={insights} />

      {/* Language breakdown */}
      <div>
        <SectionLabel text="Languages" />
        <div className="flex flex-col gap-1">
          {Object.entries(insights.languageBreakdown)
            .sort(([, a], [, b]) => b - a)
            .map(([lang, count]) => {
              const pct = Math.round((count / insights.totalFiles) * 100);
              const color = getLanguageColor(lang);
              return (
                <div key={lang} className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="flex-1 font-mono text-[11px] text-text-secondary">
                    {lang}
                  </span>
                  <span className="font-mono text-[10px] text-text-muted">
                    {count}
                  </span>
                  <div className="w-16 overflow-hidden rounded-full bg-bg-primary">
                    <div
                      className="h-1 rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Circular dependencies */}
      {insights.circularDeps.length > 0 && (
        <div>
          <SectionLabel text={`Circular Dependencies (${insights.circularDeps.length})`} />
          <div className="flex flex-col gap-1">
            {insights.circularDeps.map((cycle, i) => (
              <div key={i} className="rounded border border-accent-danger/20 bg-accent-danger/5 px-2 py-1.5">
                <div className="flex flex-wrap gap-1">
                  {cycle.map((fileId) => {
                    const name = fileId.split("/").pop() ?? fileId;
                    return (
                      <button
                        key={fileId}
                        onClick={() => focusNode(fileId)}
                        className="font-mono text-[10px] text-accent-danger underline-offset-2 hover:underline"
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hub files */}
      {insights.hubFiles.length > 0 && (
        <div>
          <SectionLabel text={`Hub Files (${insights.hubFiles.length})`} />
          <div className="flex flex-col gap-0.5">
            {insights.hubFiles.map((fileId) => (
              <button
                key={fileId}
                onClick={() => focusNode(fileId)}
                className="flex items-center gap-2 rounded px-2 py-1 text-left transition-colors hover:bg-bg-elevated"
              >
                <span className="font-mono text-[11px] text-accent-warning truncate">
                  {fileId}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Orphan files */}
      {insights.orphanFiles.length > 0 && (
        <div>
          <SectionLabel text={`Orphan Files (${insights.orphanFiles.length})`} />
          <div className="flex flex-col gap-0.5">
            {insights.orphanFiles.slice(0, 20).map((fileId) => (
              <button
                key={fileId}
                onClick={() => focusNode(fileId)}
                className="flex items-center gap-2 rounded px-2 py-1 text-left transition-colors hover:bg-bg-elevated"
              >
                <span className="font-mono text-[11px] text-text-muted truncate">
                  {fileId}
                </span>
              </button>
            ))}
            {insights.orphanFiles.length > 20 && (
              <div className="px-2 font-mono text-[10px] text-text-muted">
                +{insights.orphanFiles.length - 20} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-text-muted">
      {text}
    </div>
  );
}
