import { open } from "@tauri-apps/plugin-dialog";
import { useScanner } from "../../hooks/useScanner";

const SUPPORTED_LANGUAGES = [
  "TypeScript",
  "JavaScript",
  "Go",
  "Rust",
  "Python",
  "Java",
  "Ruby",
  "PHP",
  "C/C++",
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
    <div className="flex h-full w-full items-center justify-center dot-grid">
      <div className="flex flex-col items-center gap-8">
        {/* Logo / heading */}
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-mono text-5xl font-bold tracking-tight text-accent-cyan text-glow-cyan">
            RepoMap
          </h1>
          <p className="font-sans text-sm font-light tracking-wide text-text-secondary">
            See your code. Understand your architecture.
          </p>
        </div>

        {/* Open button */}
        <button
          onClick={handleOpen}
          className="group relative rounded border border-accent-cyan/30 bg-accent-cyan/5 px-6 py-3 font-mono text-sm text-accent-cyan transition-all duration-300 hover:border-accent-cyan/60 hover:bg-accent-cyan/10 glow-cyan"
        >
          <span className="flex items-center gap-2">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            Open Project Folder
          </span>
        </button>

        {/* Supported languages */}
        <div className="flex flex-col items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
            Supported Languages
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <span
                key={lang}
                className="rounded border border-border bg-bg-elevated px-2.5 py-1 font-mono text-[11px] text-text-secondary transition-colors duration-300 hover:border-text-muted"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
