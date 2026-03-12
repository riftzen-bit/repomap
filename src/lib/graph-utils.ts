import type { Edge } from "./types";

/**
 * BFS from startNodeId, returning all node IDs reachable within maxDepth hops.
 * Edges are traversed bidirectionally (source↔target).
 */
export function getNodesWithinDepth(
  startNodeId: string,
  edges: Edge[],
  maxDepth: number,
): Set<string> {
  const adj = new Map<string, string[]>();
  for (const edge of edges) {
    if (!adj.has(edge.source)) adj.set(edge.source, []);
    if (!adj.has(edge.target)) adj.set(edge.target, []);
    adj.get(edge.source)!.push(edge.target);
    adj.get(edge.target)!.push(edge.source);
  }

  const visited = new Set<string>([startNodeId]);
  let frontier = [startNodeId];

  for (let depth = 0; depth < maxDepth && frontier.length > 0; depth++) {
    const nextFrontier: string[] = [];
    for (const nodeId of frontier) {
      for (const neighbor of adj.get(nodeId) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          nextFrontier.push(neighbor);
        }
      }
    }
    frontier = nextFrontier;
  }

  return visited;
}
