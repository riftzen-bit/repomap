import { useGraphStore } from "./stores/graphStore";
import { TitleBar } from "./components/layout/TitleBar";
import { ControlsBar } from "./components/layout/ControlsBar";
import { InsightsBar } from "./components/layout/InsightsBar";
import { EmptyState } from "./components/states/EmptyState";
import { ScanningState } from "./components/states/ScanningState";
import { ErrorState } from "./components/states/ErrorState";
import { GraphCanvas } from "./components/graph/GraphCanvas";

export function App() {
  const scanStatus = useGraphStore((s) => s.scanStatus);
  const hasGraph = scanStatus === "complete";

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
      <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-bg-secondary">
        <div className="flex h-full items-center justify-center">
          <span className="font-mono text-xs text-text-muted">
            Click a node to inspect
          </span>
        </div>
      </aside>
    </>
  );
}
