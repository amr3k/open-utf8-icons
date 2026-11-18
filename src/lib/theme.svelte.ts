import {
  type ThemeMode,
  type ResolvedTheme,
  THEME_STORAGE_KEY,
  getThemeColor,
  resolveTheme,
} from "./theme-utils.js";

export type { ThemeMode, ResolvedTheme };
export { THEME_STORAGE_KEY, resolveTheme };

class ThemeManager {
  mode = $state<ThemeMode>("system");
  resolved = $state<ResolvedTheme>("light");
  private isInitialized = false;

  private mediaQuery: MediaQueryList | null = null;
  private handleMediaChange = (e: MediaQueryListEvent) => {
    if (this.mode === "system") {
      this.applyTheme(resolveTheme("system", e.matches));
    }
  };

  init() {
    if (typeof window === "undefined" || this.isInitialized) return;

    this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this.mediaQuery.addEventListener("change", this.handleMediaChange);

    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      this.mode = stored;
    } else {
      this.mode = "system";
    }

    this.applyTheme(resolveTheme(this.mode, this.mediaQuery.matches));
    this.isInitialized = true;
  }

  destroy() {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener("change", this.handleMediaChange);
      this.mediaQuery = null;
    }
    this.isInitialized = false;
  }

  setMode(newMode: ThemeMode) {
    this.mode = newMode;
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, newMode);
      const systemDark = this.mediaQuery?.matches ?? false;
      this.applyTheme(resolveTheme(newMode, systemDark));
    }
  }

  private applyTheme(target: ResolvedTheme) {
    this.resolved = target;
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    if (target === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }

    // Match the mobile browser chrome to the app surface (PWA + Safari tab).
    const themeColor = document.querySelector('meta[name="theme-color"]');
    themeColor?.setAttribute("content", getThemeColor(target));
  }
}

export const theme = new ThemeManager();
