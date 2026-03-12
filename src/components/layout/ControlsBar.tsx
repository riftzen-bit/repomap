import { open } from "@tauri-apps/plugin-dialog";
import { useGraphStore } from "../../stores/graphStore";
import { useScanner } from "../../hooks/useScanner";
import { getLanguageColor } from "../../lib/colors";
import { SearchInput } from "../common/SearchInput";

const LAYOUTS = ["force", "tree", "circle"] as const;

export function ControlsBar() {
  const layout = useGraphStore((s) => s.layout);
  const setLayout = useGraphStore((s) => s.setLayout);
  const graphData = useGraphStore((s) => s.graphData);
  const filters = useGraphStore((s) => s.filters);
  const updateFilters = useGraphStore((s) => s.updateFilters);
  const projectRoot = useGraphStore((s) => s.projectRoot);
  const { startScan } = useScanner();

  const languages = graphData
    ? Object.keys(graphData.insights.languageBreakdown).sort()
    : [];

  async function handleOpenFolder() {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (typeof selected === "string") {
        startScan(selected);
      }
    } catch {
      // Dialog dismissed or unavailable -- no action needed
    }
  }

  function toggleLanguageFilter(lang: string) {
    const current = filters.languages;
    const next = current.includes(lang)
      ? current.filter((l) => l !== lang)
      : [...current, lang];
    updateFilters({ languages: next });
  }

  return (
    <div className="flex h-11 shrink-0 items-center gap-3 border-b border-border bg-bg-secondary px-3">
      {/* Open folder */}
      <button
        onClick={handleOpenFolder}
        className="flex items-center gap-1.5 rounded border border-border bg-bg-elevated px-3 py-1.5 font-mono text-xs text-text-secondary transition-all duration-300 hover:border-accent-primary hover:text-accent-primary"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        Open Folder
      </button>

      {/* Rescan project */}
      {projectRoot && (
        <button
          onClick={() => startScan(projectRoot)}
          title="Rescan project"
          className="flex items-center gap-1.5 rounded border border-border bg-bg-elevated px-3 py-1.5 font-mono text-xs text-text-secondary transition-all duration-300 hover:border-accent-primary hover:text-accent-primary"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
            <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
          </svg>
          Rescan
        </button>
      )}

      {/* Divider */}
      <div className="h-5 w-px bg-border" />

      {/* Layout toggle */}
      <div className="flex items-center rounded border border-border bg-bg-primary">
        {LAYOUTS.map((l) => (
          <button
            key={l}
            onClick={() => setLayout(l)}
            className={`px-2.5 py-1 font-mono text-xs capitalize transition-all duration-300 ${
              layout === l
                ? "bg-bg-elevated text-accent-primary"
                : "text-text-muted hover:text-text-secondary"
            } ${l === "force" ? "rounded-l" : ""} ${l === "circle" ? "rounded-r" : ""}`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-border" />

      {/* Search */}
      <div className="flex-1 max-w-64">
        <SearchInput />
      </div>

      {/* Language filters */}
      {languages.length > 0 && (
        <>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-1 overflow-x-auto">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => toggleLanguageFilter(lang)}
                className={`rounded px-2 py-0.5 font-mono text-[10px] transition-all duration-300 ${
                  filters.languages.length === 0 ||
                  filters.languages.includes(lang)
                    ? "opacity-100"
                    : "opacity-30"
                }`}
                style={{
                  color: getLanguageColor(lang),
                  borderWidth: 1,
                  borderColor: getLanguageColor(lang) + "40",
                  backgroundColor: getLanguageColor(lang) + "10",
                }}
              >
                {lang}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
