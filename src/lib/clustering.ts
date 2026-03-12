import type { Node } from "./types";

export interface Cluster {
  id: string;
  label: string;
  nodeIds: string[];
}

export function computeClusters(nodes: Node[]): Cluster[] {
  if (nodes.length < 2) return [];

  const topDirCounts = new Map<string, string[]>();
  for (const node of nodes) {
    const parts = node.id.split("/");
    if (parts.length < 2) continue;
    const topDir = parts[0];
    if (!topDirCounts.has(topDir)) topDirCounts.set(topDir, []);
    topDirCounts.get(topDir)!.push(node.id);
  }

  let useSecondLevel = false;
  for (const [, ids] of topDirCounts) {
    if (ids.length / nodes.length > 0.8) {
      useSecondLevel = true;
      break;
    }
  }

  const groups = new Map<string, string[]>();

  for (const node of nodes) {
    const parts = node.id.split("/");
    if (parts.length < 2) continue;

    let dir: string;
    if (useSecondLevel && parts.length >= 3) {
      dir = `${parts[0]}/${parts[1]}`;
    } else if (useSecondLevel) {
      continue;
    } else {
      dir = parts[0];
    }

    if (!groups.has(dir)) groups.set(dir, []);
    groups.get(dir)!.push(node.id);
  }

  // When there are 3+ distinct groups, all are meaningful clusters (min 1).
  // With fewer groups, require at least 2 files to avoid trivial single-file clusters.
  const minSize = groups.size >= 3 ? 1 : 2;

  return Array.from(groups.entries())
    .filter(([, ids]) => ids.length >= minSize)
    .map(([dir, ids]) => ({
      id: dir,
      label: dir,
      nodeIds: ids,
    }));
}
