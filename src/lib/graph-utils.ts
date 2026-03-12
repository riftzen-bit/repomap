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

/**
 * Reverse-BFS: find all files affected if startNode changes.
 * Follows edges in reverse (source imports target → if target changes, source is affected).
 * Returns Map<nodeId, depth> where depth = hops from startNode.
 */
export function getImpactedNodes(
  startNodeId: string,
  edges: Edge[],
): Map<string, number> {
  const reverseAdj = new Map<string, string[]>();
  for (const edge of edges) {
    if (!reverseAdj.has(edge.target)) reverseAdj.set(edge.target, []);
    reverseAdj.get(edge.target)!.push(edge.source);
  }

  const impacted = new Map<string, number>();
  const visited = new Set<string>([startNodeId]);
  let frontier = [startNodeId];
  let depth = 0;

  while (frontier.length > 0) {
    depth++;
    const nextFrontier: string[] = [];
    for (const nodeId of frontier) {
      for (const dependent of reverseAdj.get(nodeId) ?? []) {
        if (!visited.has(dependent)) {
          visited.add(dependent);
          impacted.set(dependent, depth);
          nextFrontier.push(dependent);
        }
      }
    }
    frontier = nextFrontier;
  }

  return impacted;
}
