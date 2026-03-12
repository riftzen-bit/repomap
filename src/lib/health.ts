import type { Insights } from "./types";

export interface HealthScore {
  score: number;
  penalties: {
    circular: number;
    orphan: number;
    hub: number;
    coupling: number;
  };
}

export function computeHealthScore(insights: Insights): HealthScore {
  const circularPenalty = Math.min(30, insights.circularDeps.length * 5);

  const orphanPct = insights.totalFiles > 0
    ? (insights.orphanFiles.length / insights.totalFiles) * 100
    : 0;
  const orphanPenalty = Math.min(20, Math.round(orphanPct));

  const hubPenalty = Math.min(25, insights.hubFiles.length * 3);

  const avgEdges = insights.totalFiles > 0
    ? insights.totalEdges / insights.totalFiles
    : 0;
  const couplingPenalty = avgEdges > 5
    ? Math.min(25, Math.round((avgEdges - 5) * 5))
    : 0;

  const score = Math.max(0, 100 - circularPenalty - orphanPenalty - hubPenalty - couplingPenalty);

  return {
    score,
    penalties: {
      circular: circularPenalty,
      orphan: orphanPenalty,
      hub: hubPenalty,
      coupling: couplingPenalty,
    },
  };
}
