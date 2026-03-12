import { useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useGraphStore } from "../stores/graphStore";
import { addRecent } from "./useRecentProjects";
import type { GraphData, ScanProgress } from "../lib/types";

export function useScanner() {
  const unlistenRefs = useRef<UnlistenFn[]>([]);
  const projectPathRef = useRef<string | null>(null);
  const fileChangedUnlistenRef = useRef<UnlistenFn | null>(null);
  const { setScanStatus, updateScanProgress, setGraphData, setError, reset } =
    useGraphStore();

  const cleanup = useCallback(() => {
    for (const unlisten of unlistenRefs.current) {
      unlisten();
    }
    unlistenRefs.current = [];

    if (fileChangedUnlistenRef.current) {
      fileChangedUnlistenRef.current();
      fileChangedUnlistenRef.current = null;
    }
  }, []);

  const startScan = useCallback(
    async (path: string) => {
      cleanup();
      reset();
      setScanStatus("scanning");
      projectPathRef.current = path;

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

        const debounceRef = { timer: null as ReturnType<typeof setTimeout> | null };

        const unlistenComplete = await listen<GraphData>(
          "scan:complete",
          async (event) => {
            setGraphData(event.payload, path);
            addRecent(path);

            // Remove scan event listeners (but keep file-changed listener alive)
            for (const unlisten of unlistenRefs.current) {
              unlisten();
            }
            unlistenRefs.current = [];

            // Set up file-changed listener for auto-rescan
            if (fileChangedUnlistenRef.current) {
              fileChangedUnlistenRef.current();
            }
            const unlistenChanged = await listen("file-changed", () => {
              if (debounceRef.timer) clearTimeout(debounceRef.timer);
              debounceRef.timer = setTimeout(() => {
                if (projectPathRef.current) {
                  startScan(projectPathRef.current);
                }
              }, 2000);
            });
            fileChangedUnlistenRef.current = unlistenChanged;
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

  const cancelScan = useCallback(async () => {
    await invoke("cancel_scan").catch(() => {});
    await invoke("stop_file_watcher").catch(() => {});
    cleanup();
    reset();
  }, [cleanup, reset]);

  return { startScan, cancelScan };
}
