import { useMemo } from "react";
import { useGraphStore } from "../../stores/graphStore";

export function DirectoryFilter() {
  const graphData = useGraphStore((s) => s.graphData);
  const filters = useGraphStore((s) => s.filters);
  const updateFilters = useGraphStore((s) => s.updateFilters);

  const directories = useMemo(() => {
    if (!graphData) return [];

    const dirSet = new Set<string>();
    for (const node of graphData.nodes) {
      // Extract top-level directory from the relative path
      const parts = node.id.split("/");
      if (parts.length > 1) {
        dirSet.add(parts[0]);
      } else {
        dirSet.add("."); // root-level files
      }
    }
    return Array.from(dirSet).sort();
  }, [graphData]);

  if (directories.length === 0) return null;

  const activeDirs = filters.directories;
  const allActive = activeDirs.length === 0;

  function toggle(dir: string) {
    const current = filters.directories;
    const next = current.includes(dir)
      ? current.filter((d) => d !== dir)
      : [...current, dir];
    updateFilters({ directories: next });
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
        Directories
      </span>
      <div className="flex flex-col gap-0.5">
        {directories.map((dir) => {
          const isActive = allActive || activeDirs.includes(dir);

          return (
            <button
              key={dir}
              onClick={() => toggle(dir)}
              className={`flex items-center gap-2 rounded px-2 py-1 text-left font-mono text-[11px] transition-all duration-200 hover:bg-bg-elevated ${
                isActive
                  ? "text-text-secondary"
                  : "text-text-muted opacity-40"
              }`}
            >
              {/* Folder icon */}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <span className="truncate">{dir === "." ? "(root)" : dir}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
