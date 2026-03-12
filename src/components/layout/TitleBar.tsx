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
      className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-bg-primary px-4 select-none"
    >
      {/* Left: logo mark + name */}
      <div className="flex items-center gap-2.5">
        {/* Small abstract graph icon */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="3" cy="3" r="1.5" fill="var(--color-accent-primary)" />
          <circle cx="11" cy="3" r="1.5" fill="var(--color-text-muted)" />
          <circle cx="7" cy="11" r="1.5" fill="var(--color-text-muted)" />
          <line x1="3" y1="3" x2="11" y2="3" stroke="var(--color-border)" strokeWidth="0.8" />
          <line x1="3" y1="3" x2="7" y2="11" stroke="var(--color-border)" strokeWidth="0.8" />
          <line x1="11" y1="3" x2="7" y2="11" stroke="var(--color-border)" strokeWidth="0.8" />
        </svg>
        <span className="text-[13px] font-medium tracking-tight text-text-secondary">
          RepoMap
        </span>
      </div>

      {/* Right: window controls */}
      <div className="flex items-center">
        <button
          onClick={() => appWindow?.minimize()}
          className="flex h-10 w-10 items-center justify-center text-text-muted/50 transition-colors hover:text-text-secondary"
          aria-label="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
            <rect width="10" height="1" />
          </svg>
        </button>
        <button
          onClick={() => appWindow?.toggleMaximize()}
          className="flex h-10 w-10 items-center justify-center text-text-muted/50 transition-colors hover:text-text-secondary"
          aria-label="Maximize"
        >
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="0.5" y="0.5" width="9" height="9" />
          </svg>
        </button>
        <button
          onClick={() => appWindow?.close()}
          className="flex h-10 w-10 items-center justify-center text-text-muted/50 transition-colors hover:text-accent-danger"
          aria-label="Close"
        >
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3">
            <line x1="1" y1="1" x2="9" y2="9" />
            <line x1="9" y1="1" x2="1" y2="9" />
          </svg>
        </button>
      </div>
    </header>
  );
}
