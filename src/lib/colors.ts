const LANGUAGE_COLORS: Record<string, string> = {
  typescript: "#6b9ec4",
  tsx: "#6b9ec4",
  javascript: "#c9a84c",
  jsx: "#c9a84c",
  go: "#7bae7f",
  rust: "#d4915c",
  python: "#c4a64c",
  java: "#8b7ec4",
  ruby: "#c45c5c",
  php: "#8b7ec4",
  c: "#a89f93",
  cpp: "#a89f93",
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
