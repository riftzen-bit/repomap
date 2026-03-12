import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useScanner } from "../../hooks/useScanner";
import { useRecentProjects } from "../../hooks/useRecentProjects";
import {
  GoIcon, RustIcon, TypeScriptIcon, PythonIcon,
  JavaIcon, CppIcon, RubyIcon, PhpIcon,
} from "../../lib/language-icons";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const LANGUAGES: [string, () => React.JSX.Element][] = [
  ["Go", GoIcon],
  ["Rust", RustIcon],
  ["TypeScript", TypeScriptIcon],
  ["Python", PythonIcon],
  ["Java", JavaIcon],
  ["C++", CppIcon],
  ["Ruby", RubyIcon],
  ["PHP", PhpIcon],
];

const FEATURES = [
  { icon: "graph", label: "Dependency graph", detail: "Force, tree & circle layouts" },
  { icon: "cycle", label: "Circular imports", detail: "Auto-detected & highlighted" },
  { icon: "export", label: "Export", detail: "JSON & Mermaid diagrams" },
];

function FeatureIcon({ type }: { type: string }) {
  const cls = "text-text-muted";
  if (type === "graph") return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls}>
      <circle cx="5" cy="6" r="2" /><circle cx="19" cy="6" r="2" /><circle cx="12" cy="18" r="2" />
      <line x1="5" y1="8" x2="12" y2="16" /><line x1="19" y1="8" x2="12" y2="16" />
    </svg>
  );
  if (type === "cycle") return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls}>
      <path d="M21 12a9 9 0 1 1-6.22-8.56" /><polyline points="21 3 21 9 15 9" />
    </svg>
  );
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function EmptyState() {
  const { startScan } = useScanner();
  const { entries: recentProjects, clear: clearRecent } = useRecentProjects();
  const [showHelp, setShowHelp] = useState(false);

  async function handleOpen() {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (typeof selected === "string") {
        startScan(selected);
      }
    } catch {
      // Dialog dismissed or unavailable -- no action needed
    }
  }

  return (
    <div className="flex h-full w-full overflow-hidden grain-bg">
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-6 overflow-y-auto px-4">

        {/* Icon cluster */}
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-[340px]">
          {LANGUAGES.map(([lang, IconComponent]) => (
            <div
              key={lang}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-bg-elevated border border-border/50"
              title={lang}
            >
              <IconComponent />
            </div>
          ))}
        </div>

        {/* Title block */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-text-primary">
            RepoMap
          </h1>
          <p className="max-w-xs text-[13px] font-light leading-relaxed text-text-secondary">
            Visualize dependencies, trace circular imports,
            and understand your codebase architecture.
          </p>
        </div>

        {/* Primary action */}
        <button
          onClick={handleOpen}
          className="flex items-center gap-2.5 rounded-lg bg-accent-primary px-5 py-2.5 text-[13px] font-medium text-bg-primary transition-all duration-150 hover:brightness-110 active:scale-[0.97]"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          Open Project
        </button>

        {/* Shortcut hint */}
        <div className="flex items-center gap-1.5 text-text-muted">
          <kbd className="rounded bg-bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
            Ctrl
          </kbd>
          <span className="text-[10px]">+</span>
          <kbd className="rounded bg-bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
            O
          </kbd>
          <span className="ml-1 text-[11px] text-text-muted">to open</span>
        </div>

        {/* Help — inline, compact, part of the flow */}
        {!showHelp ? (
          <button
            onClick={() => setShowHelp(true)}
            className="mt-4 flex items-center gap-1.5 text-[11px] text-text-muted/60 transition-colors hover:text-text-muted"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            How it works
          </button>
        ) : (
          <div className="mt-2 flex flex-col items-center gap-3 w-full max-w-lg">
            {/* Feature list — compact rows, not cards */}
            <div className="flex w-full flex-col divide-y divide-border/50 rounded-lg border border-border bg-bg-elevated">
              {FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-3 px-4 py-2.5 min-w-0">
                  <span className="shrink-0"><FeatureIcon type={f.icon} /></span>
                  <span className="truncate text-[12px] font-medium text-text-primary">{f.label}</span>
                  <span className="ml-auto hidden shrink-0 text-[11px] text-text-muted sm:block">{f.detail}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="text-[11px] text-text-muted/50 transition-colors hover:text-text-muted"
            >
              Hide
            </button>
          </div>
        )}

        {/* Recent projects */}
        {recentProjects.length > 0 && (
          <div className="mt-2 flex w-full max-w-sm flex-col items-center gap-1.5">
            <div className="flex w-full items-center justify-between px-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                Recent
              </span>
              <button
                onClick={clearRecent}
                className="font-mono text-[10px] text-text-muted/50 transition-colors hover:text-text-muted"
              >
                Clear
              </button>
            </div>
            <div className="flex w-full flex-col divide-y divide-border/50 rounded-lg border border-border bg-bg-elevated">
              {recentProjects.map((project) => (
                <button
                  key={project.path}
                  onClick={() => startScan(project.path)}
                  className="group flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-bg-surface"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="shrink-0 text-text-muted"
                  >
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="truncate font-mono text-xs text-text-secondary group-hover:text-text-primary">
                    {project.name}
                  </span>
                  <span className="ml-auto shrink-0 font-mono text-[10px] text-text-muted">
                    {relativeTime(project.scannedAt)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
