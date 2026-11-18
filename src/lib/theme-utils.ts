export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

/** Browser chrome colors, mirrored by the inline bootstrap in `app.html`. */
export const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: "#ffffff",
  dark: "#09090b",
};

/**
 * Pure helper to compute resolved theme from current mode and system preference
 */
export function resolveTheme(
  mode: ThemeMode,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (mode === "dark") return "dark";
  if (mode === "light") return "light";
  return systemPrefersDark ? "dark" : "light";
}

/** `theme-color` value matching the resolved theme. */
export function getThemeColor(theme: ResolvedTheme): string {
  return THEME_COLORS[theme];
}

/**
 * Cycle through theme modes: system -> light -> dark -> system
 */
export function getNextThemeMode(current: ThemeMode): ThemeMode {
  switch (current) {
    case "system":
      return "light";
    case "light":
      return "dark";
    case "dark":
      return "system";
    default:
      return "system";
  }
}

/**
 * Native UTF-8 icon representing the mode
 */
export function getThemeIcon(mode: ThemeMode): string {
  switch (mode) {
    case "light":
      return "☀";
    case "dark":
      return "☾";
    case "system":
      return "◑";
  }
}
