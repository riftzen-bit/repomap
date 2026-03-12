const LANGUAGE_COLORS: Record<string, string> = {
  typescript: "#00d4ff",
  tsx: "#00d4ff",
  javascript: "#f0db4f",
  jsx: "#f0db4f",
  go: "#00ff88",
  rust: "#ff8800",
  python: "#ffcc00",
  java: "#4488ff",
  ruby: "#ff66aa",
  php: "#aa66ff",
  c: "#99aabb",
  cpp: "#99aabb",
};

export function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language.toLowerCase()] ?? "#7a7a8e";
}

export function getLanguageColorWithAlpha(
  language: string,
  alpha: number,
): string {
  const hex = getLanguageColor(language);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
