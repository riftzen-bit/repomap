import { getCurrentWindow } from "@tauri-apps/api/window";
import { useGraphStore } from "../../stores/graphStore";

export function TitleBar() {
  const projectName = useGraphStore((s) => s.graphData?.projectName);
  const appWindow = getCurrentWindow();

  return (
    <header
      data-tauri-drag-region
      className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-bg-secondary px-3 select-none"
    >
      {/* Left: brand */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-bold tracking-wider text-accent-primary">
          RepoMap
        </span>
      </div>

      {/* Center: project name */}
      <div
        data-tauri-drag-region
        className="absolute inset-x-0 flex justify-center pointer-events-none"
      >
        <span className="font-mono text-xs text-text-secondary truncate max-w-64">
          {projectName ?? ""}
        </span>
      </div>

      {/* Right: window controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => appWindow.minimize()}
          className="flex h-7 w-7 items-center justify-center rounded text-text-muted transition-colors duration-200 hover:bg-bg-elevated hover:text-text-secondary"
          aria-label="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
            <rect width="10" height="1" />
          </svg>
        </button>
        <button
          onClick={() => appWindow.toggleMaximize()}
          className="flex h-7 w-7 items-center justify-center rounded text-text-muted transition-colors duration-200 hover:bg-bg-elevated hover:text-text-secondary"
          aria-label="Maximize"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <rect x="0.5" y="0.5" width="9" height="9" />
          </svg>
        </button>
        <button
          onClick={() => appWindow.close()}
          className="flex h-7 w-7 items-center justify-center rounded text-text-muted transition-colors duration-200 hover:bg-bg-elevated hover:text-accent-danger"
          aria-label="Close"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <line x1="0" y1="0" x2="10" y2="10" />
            <line x1="10" y1="0" x2="0" y2="10" />
          </svg>
        </button>
      </div>
    </header>
  );
}
