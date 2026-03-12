import { useState, useEffect, useRef, useCallback } from "react";
import { useGraphStore } from "../../stores/graphStore";

export function SearchInput() {
  const [query, setQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const graphData = useGraphStore((s) => s.graphData);
  const selectNode = useGraphStore((s) => s.selectNode);

  const [results, setResults] = useState<Array<{ id: string; path: string }>>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const search = useCallback(
    (term: string) => {
      if (!graphData || term.trim() === "") {
        setResults([]);
        setShowDropdown(false);
        return;
      }
      const lower = term.toLowerCase();
      const matches = graphData.nodes
        .filter(
          (n) =>
            n.filename.toLowerCase().includes(lower) ||
            n.path.toLowerCase().includes(lower),
        )
        .slice(0, 10)
        .map((n) => ({ id: n.id, path: n.path }));
      setResults(matches);
      setShowDropdown(matches.length > 0);
    },
    [graphData],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  function handleSelect(id: string) {
    selectNode(id);
    setShowDropdown(false);
    setQuery("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && results.length > 0) {
      handleSelect(results[0].id);
    }
    if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  }

  return (
    <div className="relative w-full">
      {/* Search icon */}
      <svg
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length > 0 && setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        placeholder="Search files..."
        className="w-full rounded border border-border bg-bg-elevated py-1.5 pr-7 pl-8 font-mono text-xs text-text-primary placeholder:text-text-muted outline-none transition-colors duration-300 focus:border-accent-cyan"
      />

      {/* Clear button */}
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted transition-colors duration-200 hover:text-text-secondary"
          aria-label="Clear search"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <line x1="1" y1="1" x2="9" y2="9" />
            <line x1="9" y1="1" x2="1" y2="9" />
          </svg>
        </button>
      )}

      {/* Dropdown results */}
      {showDropdown && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full rounded border border-border bg-bg-elevated shadow-lg">
          {results.map((r) => (
            <button
              key={r.id}
              onMouseDown={() => handleSelect(r.id)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-xs text-text-secondary transition-colors duration-200 hover:bg-bg-secondary hover:text-text-primary"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="shrink-0 text-text-muted"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="truncate">{r.path}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
