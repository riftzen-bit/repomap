import { useGraphStore } from "../../stores/graphStore";
import { getLanguageColor } from "../../lib/colors";

export function LanguageFilter() {
  const graphData = useGraphStore((s) => s.graphData);
  const filters = useGraphStore((s) => s.filters);
  const updateFilters = useGraphStore((s) => s.updateFilters);

  if (!graphData) return null;

  const languages = Object.keys(graphData.insights.languageBreakdown).sort();
  const activeLangs = filters.languages;
  const allActive = activeLangs.length === 0;

  function toggle(lang: string) {
    const current = filters.languages;
    const next = current.includes(lang)
      ? current.filter((l) => l !== lang)
      : [...current, lang];
    updateFilters({ languages: next });
  }

  function toggleAll() {
    updateFilters({ languages: allActive ? [...languages] : [] });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
          Languages
        </span>
        <button
          onClick={toggleAll}
          className="font-mono text-[10px] text-text-muted transition-colors duration-200 hover:text-accent-primary"
        >
          {allActive ? "Deselect All" : "All"}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {languages.map((lang) => {
          const color = getLanguageColor(lang);
          const isActive = allActive || activeLangs.includes(lang);

          return (
            <button
              key={lang}
              onClick={() => toggle(lang)}
              className={`rounded px-2 py-0.5 font-mono text-[10px] transition-all duration-300 ${
                isActive ? "opacity-100" : "opacity-30"
              }`}
              style={{
                color,
                borderWidth: 1,
                borderColor: color + "40",
                backgroundColor: color + "10",
              }}
            >
              {lang}
              <span className="ml-1 text-text-muted">
                {graphData.insights.languageBreakdown[lang]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
