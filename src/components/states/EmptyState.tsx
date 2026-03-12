import { open } from "@tauri-apps/plugin-dialog";
import { useScanner } from "../../hooks/useScanner";

const LANGUAGES: [string, string][] = [
  ["Go", "#7bae7f"],
  ["Rust", "#d4915c"],
  ["TypeScript", "#6b9ec4"],
  ["Python", "#c9a84c"],
  ["Java", "#8b7ec4"],
  ["C / C++", "#a89f93"],
  ["Ruby", "#c45c5c"],
  ["PHP", "#8b7ec4"],
];

export function EmptyState() {
  const { startScan } = useScanner();

  async function handleOpen() {
    const selected = await open({ directory: true, multiple: false });
    if (typeof selected === "string") {
      startScan(selected);
    }
  }

  return (
    <div className="flex h-full w-full grain-bg">
      <div className="relative z-10 flex h-full w-full">
        {/* Left — large asymmetric typography */}
        <div className="flex flex-1 flex-col justify-end p-12 pb-24">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted mb-6">
            Codebase Visualizer
          </p>
          <h1 className="font-sans text-[72px] font-light leading-[0.9] tracking-[-0.04em] text-text-primary">
            Repo
            <br />
            <span className="text-accent-primary">Map</span>
          </h1>
          <div className="mt-8 h-px w-24 bg-border" />
          <p className="mt-6 max-w-xs font-sans text-sm leading-relaxed text-text-secondary">
            Drop a project folder to visualize its dependency graph,
            find circular imports, and understand the architecture at a glance.
          </p>

          <button
            onClick={handleOpen}
            className="mt-10 flex w-fit items-center gap-3 border border-border bg-bg-elevated px-5 py-3 font-mono text-xs tracking-wide text-text-primary transition-all duration-200 hover:border-accent-primary hover:text-accent-primary active:scale-[0.98]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <polyline points="13 2 13 9 20 9" />
            </svg>
            OPEN PROJECT
          </button>
        </div>

        {/* Right — vertical info strip */}
        <div className="flex w-64 flex-col justify-between border-l border-border p-8">
          <div>
            <p className="font-mono text-[10px] text-text-muted">v0.1.0</p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-muted">
              Languages
            </p>
            <div className="flex flex-col gap-1.5">
              {LANGUAGES.map(([lang, color]) => (
                <div key={lang} className="flex items-center gap-2.5">
                  <span
                    className="h-1 w-3 shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-mono text-[11px] text-text-secondary">
                    {lang}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="font-mono text-[10px] leading-relaxed text-text-muted">
            See your code.
            <br />
            Understand your
            <br />
            architecture.
          </p>
        </div>
      </div>
    </div>
  );
}
