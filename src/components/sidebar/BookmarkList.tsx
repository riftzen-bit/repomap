import { useGraphStore } from "../../stores/graphStore";

export function BookmarkList() {
  const bookmarks = useGraphStore((s) => s.bookmarks);
  const clearBookmarks = useGraphStore((s) => s.clearBookmarks);
  const focusNode = useGraphStore((s) => s.focusNode);

  if (bookmarks.length === 0) return null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
          Bookmarks ({bookmarks.length})
        </div>
        <button
          onClick={clearBookmarks}
          className="font-mono text-[10px] text-text-muted hover:text-accent-danger transition-colors"
        >
          Clear all
        </button>
      </div>
      <div className="flex flex-col gap-0.5">
        {bookmarks.map((id) => (
          <button
            key={id}
            onClick={() => focusNode(id)}
            className="flex items-center gap-2 rounded px-2 py-1 text-left transition-colors hover:bg-bg-elevated"
          >
            <span className="inline-block h-2 w-2 shrink-0 rounded-full border-2 border-[#c9a84c]" />
            <span className="font-mono text-[11px] text-text-secondary truncate">
              {id}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
