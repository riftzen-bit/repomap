import { useState, useMemo } from "react";
import type { Node, SymbolKind, Insights } from "../../lib/types";
import { getLanguageColor } from "../../lib/colors";
import { Badge } from "../common/Badge";
import { useGraphStore } from "../../stores/graphStore";
import { getImpactedNodes } from "../../lib/graph-utils";
import { GitBlame } from "./GitBlame";

interface FileInfoProps {
  node: Node;
  insights: Insights;
}

const SYMBOL_GROUP_ORDER: SymbolKind[] = [
  "class",
  "struct",
  "interface",
  "function",
  "type",
  "const",
];

export function FileInfo({ node, insights }: FileInfoProps) {
  const [symbolsOpen, setSymbolsOpen] = useState(false);

  const isHub = insights.hubFiles.includes(node.id);
  const isOrphan = insights.orphanFiles.includes(node.id);
  const isCircular = insights.circularDeps.some((cycle) =>
    cycle.includes(node.id),
  );

  const groupedSymbols = useMemo(() => {
    const groups: Partial<Record<SymbolKind, typeof node.symbols>> = {};
    for (const sym of node.symbols) {
      if (!groups[sym.kind]) groups[sym.kind] = [];
      groups[sym.kind]!.push(sym);
    }
    return SYMBOL_GROUP_ORDER.filter((kind) => groups[kind]).map((kind) => ({
      kind,
      symbols: groups[kind]!,
    }));
  }, [node.symbols]);

  const langColor = getLanguageColor(node.language);

  return (
    <div className="flex flex-col gap-3">
      {/* File path */}
      <div className="font-mono text-xs text-text-secondary break-all leading-relaxed">
        {node.id}
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-1.5">
        <Badge label={node.language} color={langColor} variant="solid" />
        {isHub && <Badge label="Hub File" color="#c9a84c" variant="solid" />}
        {isOrphan && <Badge label="Orphan" color="#7a7a8e" variant="outline" />}
        {isCircular && (
          <Badge label="Circular Dep" color="#c45c5c" variant="solid" />
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <MetricRow label="Lines" value={node.lines} />
        <MetricRow label="Imports" value={node.imports.length} />
        <MetricRow label="Imported by" value={node.importedBy.length} />
        <MetricRow label="Symbols" value={node.symbols.length} />
      </div>

      {/* Git Blame */}
      <GitBlame filePath={node.id} />

      {/* Impact Analysis */}
      <ImpactToggle node={node} />

      {/* Symbols (collapsible) */}
      {node.symbols.length > 0 && (
        <div className="border-t border-border pt-2">
          <button
            onClick={() => setSymbolsOpen(!symbolsOpen)}
            className="flex w-full items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-text-muted transition-colors duration-200 hover:text-text-secondary"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className={`transition-transform duration-300 ${symbolsOpen ? "rotate-90" : ""}`}
            >
              <polyline points="3,1 7,5 3,9" />
            </svg>
            Symbols ({node.symbols.length})
          </button>

          {symbolsOpen && (
            <div className="mt-2 flex flex-col gap-2">
              {groupedSymbols.map(({ kind, symbols }) => (
                <div key={kind}>
                  <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                    {kind}s
                  </div>
                  <div className="flex flex-col gap-0.5 pl-2">
                    {symbols.map((sym) => (
                      <div
                        key={`${sym.name}-${sym.line}`}
                        className="flex items-center justify-between font-mono text-[11px]"
                      >
                        <span className="text-text-secondary truncate">
                          {sym.name}
                        </span>
                        <span className="ml-2 shrink-0 text-text-muted">
                          L{sym.line}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ImpactToggle({ node }: { node: Node }) {
  const impactMode = useGraphStore((s) => s.impactMode);
  const setImpactMode = useGraphStore((s) => s.setImpactMode);
  const graphData = useGraphStore((s) => s.graphData);

  const impactCount = useMemo(() => {
    if (!graphData) return { direct: 0, total: 0 };
    const impacted = getImpactedNodes(node.id, graphData.edges);
    let direct = 0;
    for (const depth of impacted.values()) {
      if (depth === 1) direct++;
    }
    return { direct, total: impacted.size };
  }, [node.id, graphData]);

  if (impactCount.total === 0) return null;

  return (
    <div className="border-t border-border pt-2">
      <button
        onClick={() => setImpactMode(!impactMode)}
        className={`flex w-full items-center justify-between rounded border px-2.5 py-1.5 font-mono text-[11px] transition-all duration-300 ${
          impactMode
            ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
            : "border-border bg-bg-elevated text-text-secondary hover:border-accent-primary hover:text-accent-primary"
        }`}
      >
        <span>Impact Analysis</span>
        <span className="text-[10px] text-text-muted">
          {impactCount.direct} direct / {impactCount.total} total
        </span>
      </button>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between font-mono text-[11px]">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-secondary">{value}</span>
    </div>
  );
}
