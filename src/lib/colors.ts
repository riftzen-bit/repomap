const LANGUAGE_COLORS: Record<string, string> = {
  typescript: "#5da4e8",
  tsx: "#5da4e8",
  javascript: "#ecd24a",
  jsx: "#ecd24a",
  go: "#6ad4a0",
  rust: "#f08040",
  python: "#f7d44f",
  java: "#b07ee8",
  ruby: "#e85050",
  php: "#9b8fef",
  c: "#c8c0b4",
  cpp: "#c8c0b4",
};

export function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language.toLowerCase()] ?? "#a89f93";
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
