/**
 * Pure install-prompt and standalone helpers (Phase 5 of #1).
 *
 * The runes-backed `pwa.svelte.ts` manager owns browser state; everything
 * here is deterministic so the platform-detection and persistence rules can
 * be unit tested without a DOM.
 */

/** localStorage key recording that the install banner was dismissed. */
export const INSTALL_DISMISSED_KEY = "utf8:install-dismissed";

/** Result of the native install prompt. */
export type InstallOutcome = "accepted" | "dismissed" | "unavailable";

/** Parse the persisted "install banner dismissed" flag. */
export function parseInstallDismissed(raw: string | null): boolean {
  return raw === "1";
}

/**
 * Whether the app is already running as an installed PWA. Covers both the
 * standard display-mode media query and Safari's legacy `navigator.standalone`.
 */
export function isStandalone(
  displayModeStandalone: boolean,
  navigatorStandalone: boolean,
): boolean {
  return displayModeStandalone || navigatorStandalone;
}

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
 */
export function shouldOfferInstall(input: {
  canPrompt: boolean;
  ios: boolean;
  dismissed: boolean;
  installed: boolean;
}): boolean {
  if (input.dismissed || input.installed) return false;
  return input.canPrompt || input.ios;
}
