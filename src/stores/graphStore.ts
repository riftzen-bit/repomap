import { create } from "zustand";
import type { GraphData, Filters } from "../lib/types";

export interface GraphStore {
  graphData: GraphData | null;
  projectRoot: string | null;
  selectedNodeId: string | null;
  focusRequestId: string | null;
  layout: "force" | "tree" | "circle";
  scanStatus: "idle" | "scanning" | "complete" | "error";
  scanProgress: { filesScanned: number; totalFiles: number } | null;
  errorMessage: string | null;
  filters: Filters;
  impactMode: boolean;
  clusteringEnabled: boolean;
  heatmapMode: boolean;
  heatmapData: Record<string, number> | null;
  bookmarks: string[];

  setGraphData: (data: GraphData, projectRoot: string) => void;
  selectNode: (id: string | null) => void;
  focusNode: (id: string) => void;
  setLayout: (layout: GraphStore["layout"]) => void;
  setScanStatus: (status: GraphStore["scanStatus"]) => void;
  updateScanProgress: (progress: GraphStore["scanProgress"]) => void;
  setError: (message: string) => void;
  updateFilters: (filters: Partial<Filters>) => void;
  setImpactMode: (enabled: boolean) => void;
  setClusteringEnabled: (enabled: boolean) => void;
  setHeatmapMode: (enabled: boolean) => void;
  setHeatmapData: (data: Record<string, number>) => void;
  toggleBookmark: (nodeId: string) => void;
  clearBookmarks: () => void;
  reset: () => void;
}

const initialState = {
  graphData: null,
  projectRoot: null,
  selectedNodeId: null,
  focusRequestId: null,
  layout: "force" as const,
  scanStatus: "idle" as const,
  scanProgress: null,
  errorMessage: null,
  filters: {
    languages: [],
    directories: [],
    minConnections: 0,
    maxDepth: null,
  },
  impactMode: false,
  clusteringEnabled: false,
  heatmapMode: false,
  heatmapData: null,
  bookmarks: [] as string[],
};

function bookmarkKey(root: string | null): string {
  const normalized = (root ?? "").replace(/\/+$/, "");
  return `repomap:bookmarks:${normalized}`;
}

function persistBookmarks(bookmarks: string[], root: string | null) {
  try {
    localStorage.setItem(bookmarkKey(root), JSON.stringify(bookmarks));
  } catch {
    // localStorage unavailable or full — ignore
  }
}

function loadBookmarks(root: string | null): string[] {
  try {
    const stored = localStorage.getItem(bookmarkKey(root));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export const useGraphStore = create<GraphStore>()((set) => ({
  ...initialState,

  setGraphData: (data, projectRoot) =>
    set({ graphData: data, projectRoot, scanStatus: "complete", errorMessage: null, bookmarks: loadBookmarks(projectRoot) }),

  selectNode: (id) =>
    set((state) =>
      id === null
        ? {
            selectedNodeId: null,
            impactMode: false,
            heatmapMode: false,
            filters:
              state.filters.maxDepth !== null
                ? { ...state.filters, maxDepth: null }
                : state.filters,
          }
        : { selectedNodeId: id },
    ),

  focusNode: (id) => set({ selectedNodeId: id, focusRequestId: id }),

  setLayout: (layout) =>
    set((state) => ({
      layout,
      clusteringEnabled: layout === "force" ? state.clusteringEnabled : false,
    })),

  setScanStatus: (status) => set({ scanStatus: status }),

  updateScanProgress: (progress) => set({ scanProgress: progress }),

  setError: (message) =>
    set({ scanStatus: "error", errorMessage: message, scanProgress: null }),

  updateFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  setImpactMode: (enabled) =>
    set((state) => ({
      impactMode: enabled,
      heatmapMode: enabled ? false : state.heatmapMode,
    })),

  setClusteringEnabled: (enabled) => set({ clusteringEnabled: enabled }),

  setHeatmapMode: (enabled) =>
    set((state) => ({
      heatmapMode: enabled,
      impactMode: enabled ? false : state.impactMode,
    })),

  setHeatmapData: (data) => set({ heatmapData: data }),

  toggleBookmark: (nodeId) =>
    set((state) => {
      const next = state.bookmarks.includes(nodeId)
        ? state.bookmarks.filter((id) => id !== nodeId)
        : [...state.bookmarks, nodeId];
      persistBookmarks(next, state.projectRoot);
      return { bookmarks: next };
    }),
  clearBookmarks: () =>
    set((state) => {
      persistBookmarks([], state.projectRoot);
      return { bookmarks: [] };
    }),

  reset: () => set(initialState),
}));
