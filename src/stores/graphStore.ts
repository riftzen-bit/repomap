import { create } from "zustand";
import type { GraphData } from "../lib/types";

interface Filters {
  languages: string[];
  directories: string[];
  minConnections: number;
}

export interface GraphStore {
  graphData: GraphData | null;
  selectedNodeId: string | null;
  layout: "force" | "tree" | "circle";
  scanStatus: "idle" | "scanning" | "complete" | "error";
  scanProgress: { filesScanned: number; totalFiles: number } | null;
  errorMessage: string | null;
  filters: Filters;

  setGraphData: (data: GraphData) => void;
  selectNode: (id: string | null) => void;
  setLayout: (layout: GraphStore["layout"]) => void;
  setScanStatus: (status: GraphStore["scanStatus"]) => void;
  updateScanProgress: (progress: GraphStore["scanProgress"]) => void;
  setError: (message: string) => void;
  updateFilters: (filters: Partial<Filters>) => void;
  reset: () => void;
}

const initialState = {
  graphData: null,
  selectedNodeId: null,
  layout: "force" as const,
  scanStatus: "idle" as const,
  scanProgress: null,
  errorMessage: null,
  filters: {
    languages: [],
    directories: [],
    minConnections: 0,
  },
};

export const useGraphStore = create<GraphStore>()((set) => ({
  ...initialState,

  setGraphData: (data) =>
    set({ graphData: data, scanStatus: "complete", errorMessage: null }),

  selectNode: (id) => set({ selectedNodeId: id }),

  setLayout: (layout) => set({ layout }),

  setScanStatus: (status) => set({ scanStatus: status }),

  updateScanProgress: (progress) => set({ scanProgress: progress }),

  setError: (message) =>
    set({ scanStatus: "error", errorMessage: message, scanProgress: null }),

  updateFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  reset: () => set(initialState),
}));
