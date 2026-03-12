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

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg-primary">
      <TitleBar />
      <ControlsBar />

      {/* Main content area */}
      <div className="flex min-h-0 flex-1">
        {scanStatus === "idle" && <EmptyState />}
        {scanStatus === "scanning" && <ScanningState />}
        {scanStatus === "error" && <ErrorState />}
        {scanStatus === "complete" && <MainContent />}
      </div>

      <InsightsBar />
    </div>
  );
}

function MainContent() {
  return (
    <>
      <GraphCanvas />

      {/* Sidebar */}
      <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-bg-secondary">
        {/* Sidebar placeholder - will be implemented in sidebar task */}
        <div className="flex h-full items-center justify-center">
          <span className="font-mono text-xs text-text-muted">Sidebar</span>
        </div>
      </aside>
    </>
  );
}
