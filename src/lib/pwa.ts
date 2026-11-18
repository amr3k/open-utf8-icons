/**
 * Install-prompt and offline helpers (Phase 5 of #1).
 *
 * The runes-backed `pwa.svelte.ts` manager owns browser state; the install
 * rules here are deterministic so they can be unit tested without a DOM.
 * `isShellCached` is the one small browser probe, kept total and try/catch
 * safe.
 */

/** localStorage key recording that the install banner was dismissed. */
export const INSTALL_DISMISSED_KEY = "utf8:install-dismissed";

/** Result of the native install prompt. */
export type InstallOutcome = "accepted" | "dismissed" | "unavailable";

/**
 * Detect iPhone / iPad / iPod, including iPadOS 13+ which reports a macOS
 * user agent but exposes touch points.
 */
export function isIosDevice(
  userAgent: string,
  platform: string,
  maxTouchPoints: number,
): boolean {
  if (/iphone|ipad|ipod/i.test(userAgent)) return true;
  return /mac/i.test(platform) && maxTouchPoints > 1;
}

/**
 * Whether the non-intrusive install banner should be rendered. Chromium
 * browsers announce installability via `beforeinstallprompt`; iOS has no
 * prompt event, so it gets the "Share → Add to Home Screen" hint instead.
 * The spec targets mobile surfaces, so a fine primary pointer (desktop) is
 * excluded even when the browser supports installation.
 */
export function shouldOfferInstall(input: {
  canPrompt: boolean;
  ios: boolean;
  dismissed: boolean;
  installed: boolean;
  mobile: boolean;
}): boolean {
  if (!input.mobile || input.dismissed || input.installed) return false;
  return input.canPrompt || input.ios;
}

/**
 * Whether Cache Storage holds the app shell (`/`), i.e. the directory will
 * still open after going offline. Used by the offline status pill so it does
 * not promise cached functionality that was never installed.
 */
export async function isShellCached(): Promise<boolean> {
  if (typeof caches === "undefined") return false;
  try {
    return (await caches.match("/")) !== undefined;
  } catch {
    return false;
  }
}
