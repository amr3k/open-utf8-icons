/**
 * Runes-backed PWA install manager (Phase 5 of #1).
 *
 * Captures Chromium's one-shot `beforeinstallprompt` event so the app can
 * offer installation at a non-intrusive moment, tracks standalone mode, and
 * remembers dismissals in `localStorage`. Initialized from the root layout on
 * mount, so the server render is always banner-free and hydration is stable.
 */

import {
  INSTALL_DISMISSED_KEY,
  isIosDevice,
  isStandalone,
  parseInstallDismissed,
  shouldOfferInstall,
  type InstallOutcome,
} from "./pwa.js";

class PwaManager {
  /** A native install prompt is available (Chromium). */
  canPrompt = $state(false);

  /** The app is already running from a home-screen install. */
  installed = $state(false);

  /** The visitor dismissed the banner; persisted across visits. */
  dismissed = $state(false);

  /** iOS has no prompt event, so show the Share → Home Screen hint instead. */
  ios = $state(false);

  /** Whether the install banner should be visible right now. */
  banner = $derived(
    shouldOfferInstall({
      canPrompt: this.canPrompt,
      ios: this.ios,
      dismissed: this.dismissed,
      installed: this.installed,
    }),
  );

  #promptEvent: BeforeInstallPromptEvent | null = null;
  #initialized = false;

  #handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
    // Keep the browser's mini-infobar away; the banner owns the moment.
    event.preventDefault();
    this.#promptEvent = event;
    this.canPrompt = true;
  };

  #handleInstalled = () => {
    this.installed = true;
    this.canPrompt = false;
    this.#promptEvent = null;
  };

  /** Restore install state. Safe to call more than once. */
  init(): void {
    if (typeof window === "undefined" || this.#initialized) return;

    this.dismissed = this.#readDismissed();
    this.installed = isStandalone(
      window.matchMedia("(display-mode: standalone)").matches,
      navigator.standalone === true,
    );
    this.ios =
      !this.installed &&
      isIosDevice(
        navigator.userAgent,
        navigator.platform,
        navigator.maxTouchPoints,
      );

    window.addEventListener(
      "beforeinstallprompt",
      this.#handleBeforeInstallPrompt,
    );
    window.addEventListener("appinstalled", this.#handleInstalled);
    this.#initialized = true;
  }

  destroy(): void {
    if (typeof window === "undefined") return;
    window.removeEventListener(
      "beforeinstallprompt",
      this.#handleBeforeInstallPrompt,
    );
    window.removeEventListener("appinstalled", this.#handleInstalled);
    this.#initialized = false;
  }

  /** Show the native install prompt; resolves with the visitor's choice. */
  async install(): Promise<InstallOutcome> {
    const event = this.#promptEvent;
    if (event === null) return "unavailable";

    // The event is single-use: calling prompt() again throws.
    this.#promptEvent = null;
    this.canPrompt = false;

    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === "accepted") this.installed = true;
      return choice.outcome;
    } catch {
      return "unavailable";
    }
  }

  /** Hide the banner permanently (best-effort persistence). */
  dismiss(): void {
    this.dismissed = true;
    try {
      localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
    } catch {
      // Private mode or quota exceeded — in-memory dismissal is enough.
    }
  }

  #readDismissed(): boolean {
    try {
      return parseInstallDismissed(localStorage.getItem(INSTALL_DISMISSED_KEY));
    } catch {
      return false;
    }
  }
}

/** Singleton shared by the layout and the install banner. */
export const pwa = new PwaManager();
