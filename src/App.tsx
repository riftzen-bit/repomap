import { useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useGraphStore } from "./stores/graphStore";
import { useScanner } from "./hooks/useScanner";
import { TitleBar } from "./components/layout/TitleBar";
import { ControlsBar } from "./components/layout/ControlsBar";
import { InsightsBar } from "./components/layout/InsightsBar";
import { EmptyState } from "./components/states/EmptyState";
import { ScanningState } from "./components/states/ScanningState";
import { ErrorState } from "./components/states/ErrorState";
import { GraphCanvas } from "./components/graph/GraphCanvas";
import { Sidebar } from "./components/sidebar/Sidebar";

export function App() {
  const scanStatus = useGraphStore((s) => s.scanStatus);
  const hasGraph = scanStatus === "complete";
  const { startScan } = useScanner();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === "o") {
        e.preventDefault();
        open({ directory: true, multiple: false })
          .then((selected) => {
            if (typeof selected === "string") {
              startScan(selected);
            }
          })
          .catch(() => {
            // Dialog dismissed or unavailable
          });
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [startScan]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg-primary">
      <TitleBar />

      {/* Controls bar only visible when graph is loaded */}
      {hasGraph && <ControlsBar />}

      {/* Main content area */}
      <div className="flex min-h-0 flex-1">
        {scanStatus === "idle" && <EmptyState />}
        {scanStatus === "scanning" && <ScanningState />}
        {scanStatus === "error" && <ErrorState />}
        {hasGraph && <MainContent />}
      </div>

      {/* Insights bar only visible when graph is loaded */}
      {hasGraph && <InsightsBar />}
    </div>
  );
}

function MainContent() {
  return (
    <>
      <GraphCanvas />
      <Sidebar />
    </>
  );
}
