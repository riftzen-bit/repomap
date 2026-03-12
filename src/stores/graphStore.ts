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
};

export const useGraphStore = create<GraphStore>()((set) => ({
  ...initialState,

  setGraphData: (data, projectRoot) =>
    set({ graphData: data, projectRoot, scanStatus: "complete", errorMessage: null }),

  selectNode: (id) =>
    set((state) =>
      id === null
        ? {
            selectedNodeId: null,
            impactMode: false,
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

  setImpactMode: (enabled) => set({ impactMode: enabled }),

  setClusteringEnabled: (enabled) => set({ clusteringEnabled: enabled }),

  reset: () => set(initialState),
}));
