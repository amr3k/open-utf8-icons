import { MediaQuery } from "svelte/reactivity";
import {
  type ThemeMode,
  type ResolvedTheme,
  THEME_STORAGE_KEY,
  getThemeColor,
  resolveTheme,
} from "./theme-utils.js";

export type { ThemeMode, ResolvedTheme };
export { THEME_STORAGE_KEY, resolveTheme };

/**
 * System colour-scheme preference. `MediaQuery` reports `false` in the server
 * bundle and listens for `change` itself, so the manager needs neither a
 * `matchMedia` call nor a listener to keep `system` mode live.
 */
const systemDark = new MediaQuery("(prefers-color-scheme: dark)");

class ThemeManager {
  /** Selected mode; `system` follows the OS. */
  mode = $state<ThemeMode>("system");

  /** Mode resolved against the OS preference — what the document shows. */
  resolved = $derived(resolveTheme(this.mode, systemDark.current));

  #initialized = false;

  /** Restore the persisted mode. Safe to call more than once. */
  init(): void {
    if (typeof window === "undefined" || this.#initialized) return;
    this.mode = readStoredMode() ?? "system";
    this.#initialized = true;
  }

  /** Select a mode and remember it (best-effort persistence). */
  setMode(mode: ThemeMode): void {
    this.mode = mode;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Private mode or blocked storage — the in-memory mode still applies.
    }
  }

  /**
   * Mirror the resolved theme into the document.
   *
   * Called from an `$effect` in the root layout, so reading `resolved` makes
   * it re-run when either the mode or the OS preference changes. The inline
   * bootstrap in `app.html` has already painted the same class, so the first
   * run is a no-op that only repeats what the visitor sees.
   */
  apply(): void {
    const target = this.resolved;
    const root = document.documentElement;

    root.classList.toggle("dark", target === "dark");
    root.style.colorScheme = target;

    // Keep mobile browser chrome and Safari's tab bar in step with the app.
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", getThemeColor(target));
  }
}

/** Persisted mode, or `null` when absent, unknown, or storage is blocked. */
function readStoredMode(): ThemeMode | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" || stored === "system"
      ? stored
      : null;
  } catch {
    return null;
  }
}

export const theme = new ThemeManager();
