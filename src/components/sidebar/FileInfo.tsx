import { useState, useMemo } from "react";
import type { Node, SymbolKind, Insights } from "../../lib/types";
import { getLanguageColor } from "../../lib/colors";
import { Badge } from "../common/Badge";

interface FileInfoProps {
  node: Node;
  insights: Insights;
}

const SYMBOL_GROUP_ORDER: SymbolKind[] = [
  "class",
  "struct",
  "interface",
  "trait",
  "enum",
  "function",
  "method",
  "type",
  "constant",
  "variable",
  "module",
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
        {node.path}
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-1.5">
        <Badge label={node.language} color={langColor} variant="solid" />
        {isHub && <Badge label="Hub File" color="#ffaa00" variant="solid" />}
        {isOrphan && <Badge label="Orphan" color="#7a7a8e" variant="outline" />}
        {isCircular && (
          <Badge label="Circular Dep" color="#ff3355" variant="solid" />
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <MetricRow label="Lines" value={node.size} />
        <MetricRow label="Imports" value={node.importCount} />
        <MetricRow label="Imported by" value={node.exportCount} />
        <MetricRow label="Symbols" value={node.symbols.length} />
      </div>

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

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between font-mono text-[11px]">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-secondary">{value}</span>
    </div>
  );
}
