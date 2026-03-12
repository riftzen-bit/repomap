export function getResolvedThemeColors(): Record<string, string> {
  const style = getComputedStyle(document.documentElement);
  return {
    textPrimary: style.getPropertyValue("--color-text-primary").trim(),
    textSecondary: style.getPropertyValue("--color-text-secondary").trim(),
    textMuted: style.getPropertyValue("--color-text-muted").trim(),
    bgPrimary: style.getPropertyValue("--color-bg-primary").trim(),
    bgSurface: style.getPropertyValue("--color-bg-surface").trim(),
    border: style.getPropertyValue("--color-border").trim(),
    accentPrimary: style.getPropertyValue("--color-accent-primary").trim(),
    accentDanger: style.getPropertyValue("--color-accent-danger").trim(),
    accentWarning: style.getPropertyValue("--color-accent-warning").trim(),
  };
}
