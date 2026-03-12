import { getCurrentWindow, type Window as TauriWindow } from "@tauri-apps/api/window";

function getTauriWindow(): TauriWindow | null {
  try {
    return getCurrentWindow();
  } catch {
    return null;
  }
}

export function TitleBar() {
  const appWindow = getTauriWindow();

  return (
    <header
      data-tauri-drag-region
      className="flex h-8 shrink-0 items-center justify-between border-b border-border/50 bg-bg-primary px-3 select-none"
    >
      {/* Left: minimal brand */}
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
        repomap
      </span>

      {/* Right: window controls — compact */}
      <div className="flex items-center">
        <button
          onClick={() => appWindow?.minimize()}
          className="flex h-8 w-10 items-center justify-center text-text-muted/60 transition-colors hover:text-text-secondary"
          aria-label="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
            <rect width="10" height="1" />
          </svg>
        </button>
        <button
          onClick={() => appWindow?.toggleMaximize()}
          className="flex h-8 w-10 items-center justify-center text-text-muted/60 transition-colors hover:text-text-secondary"
          aria-label="Maximize"
        >
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="0.5" y="0.5" width="9" height="9" />
          </svg>
        </button>
        <button
          onClick={() => appWindow?.close()}
          className="flex h-8 w-10 items-center justify-center text-text-muted/60 transition-colors hover:text-accent-danger"
          aria-label="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
            <line x1="1" y1="1" x2="9" y2="9" />
            <line x1="9" y1="1" x2="1" y2="9" />
          </svg>
        </button>
      </div>
    </header>
  );
}
