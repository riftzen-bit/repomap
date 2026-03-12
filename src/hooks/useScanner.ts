import { useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useGraphStore } from "../stores/graphStore";
import type { GraphData, ScanProgress } from "../lib/types";

export function useScanner() {
  const unlistenRefs = useRef<UnlistenFn[]>([]);
  const { setScanStatus, updateScanProgress, setGraphData, setError, reset } =
    useGraphStore();

  const cleanup = useCallback(() => {
    for (const unlisten of unlistenRefs.current) {
      unlisten();
    }
    unlistenRefs.current = [];
  }, []);

  const startScan = useCallback(
    async (path: string) => {
      cleanup();
      reset();
      setScanStatus("scanning");

      try {
        const unlistenProgress = await listen<ScanProgress>(
          "scan:progress",
          (event) => {
            updateScanProgress({
              filesScanned: event.payload.filesScanned,
              totalFiles: event.payload.totalFiles,
            });
          },
        );

        const unlistenComplete = await listen<GraphData>(
          "scan:complete",
          (event) => {
            setGraphData(event.payload);
            cleanup();
          },
        );

        const unlistenError = await listen<string>("scan:error", (event) => {
          setError(event.payload);
          cleanup();
        });

        unlistenRefs.current = [
          unlistenProgress,
          unlistenComplete,
          unlistenError,
        ];

        await invoke("scan_project", { path });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to start scan";
        setError(message);
        cleanup();
      }
    },
    [cleanup, reset, setScanStatus, updateScanProgress, setGraphData, setError],
  );

  const cancelScan = useCallback(() => {
    cleanup();
    reset();
  }, [cleanup, reset]);

  return { startScan, cancelScan };
}
