import { useEffect } from "react";
import { getCurrentWindow, type Window as TauriWindow } from "@tauri-apps/api/window";
import { useGraphStore } from "../../stores/graphStore";

const THEME_STORAGE_KEY = "repomap-theme";

function getTauriWindow(): TauriWindow | null {
  try {
    return getCurrentWindow();
  } catch {
    return null;
  }
}

function loadStoredTheme(): "dark" | "light" {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage unavailable
  }
  return "dark";
}

export function TitleBar() {
  const appWindow = getTauriWindow();
  const theme = useGraphStore((s) => s.theme);
  const setTheme = useGraphStore((s) => s.setTheme);

  // Load persisted theme on mount
  useEffect(() => {
    const stored = loadStoredTheme();
    if (stored !== theme) {
      setTheme(stored);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply data-theme attribute and persist
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

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

      {/* Right: theme toggle + window controls */}
      <div className="flex items-center">
        <button
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center text-text-muted/50 transition-colors hover:text-text-secondary"
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          {theme === "dark" ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
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
