/**
 * Runes-backed PWA install manager (Phase 5 of #1).
 *
 * Captures Chromium's one-shot `beforeinstallprompt` event so the app can
 * offer installation at a non-intrusive moment, tracks standalone mode, and
 * remembers dismissals in `localStorage`. Initialized from the root layout on
 * mount, so the server render is always banner-free and hydration is stable.
 */

import { MediaQuery } from "svelte/reactivity";
import {
  INSTALL_DISMISSED_KEY,
  isIosDevice,
  shouldOfferInstall,
  type InstallOutcome,
} from "./pwa.js";

/** Touch-first surfaces only; desktop browsers keep their own install UI. */
const coarsePointer = new MediaQuery("(pointer: coarse)");

/** The app is running from a home-screen install rather than a tab. */
const standaloneDisplay = new MediaQuery("(display-mode: standalone)");

class PwaManager {
  /** A native install prompt is available (Chromium). */
  canPrompt = $state(false);

  /** The app is already running from a home-screen install. */
  installed = $state(false);

  /** The visitor dismissed the banner; persisted across visits. */
  dismissed = $state(false);

  /** iOS has no prompt event, so show the Share → Home Screen hint instead. */
  ios = $state(false);

  /** Only offer installation on touch-first (mobile/tablet) surfaces. */
  mobile = $derived(coarsePointer.current);

  /** Whether the install banner should be visible right now. */
  banner = $derived(
    shouldOfferInstall({
      canPrompt: this.canPrompt,
      ios: this.ios,
      dismissed: this.dismissed,
      installed: this.installed,
      mobile: this.mobile,
    }),
  );

  #promptEvent: BeforeInstallPromptEvent | null = null;
  #initialized = false;

  #handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
    // Desktop browsers keep their own install affordance; the banner is mobile.
    if (!this.mobile) return;

    // Keep the browser's mini-infobar away; the banner owns the moment.
    event.preventDefault();
    window.__utf8IconsInstallPrompt = event;
    this.#promptEvent = event;
    this.canPrompt = true;
  };

  #handleInstalled = () => {
    this.installed = true;
    this.canPrompt = false;
    this.#promptEvent = null;
    window.__utf8IconsInstallPrompt = undefined;
  };

  /** Restore install state. Safe to call more than once. */
  init(): void {
    if (typeof window === "undefined" || this.#initialized) return;

    this.dismissed = this.#readDismissed();
    this.installed = standaloneDisplay.current || navigator.standalone === true;
    this.ios =
      !this.installed &&
      isIosDevice(
        navigator.userAgent,
        navigator.platform,
        navigator.maxTouchPoints,
      );

    // The inline bootstrap in app.html captures the event before hydration.
    const captured = window.__utf8IconsInstallPrompt;
    if (this.mobile && captured !== undefined) {
      this.#promptEvent = captured;
      this.canPrompt = true;
    }

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
    window.__utf8IconsInstallPrompt = undefined;
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
    this.#promptEvent = null;
    window.__utf8IconsInstallPrompt = undefined;
    try {
      localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
    } catch {
      // Private mode or quota exceeded — in-memory dismissal is enough.
    }
  }

  #readDismissed(): boolean {
    try {
      return localStorage.getItem(INSTALL_DISMISSED_KEY) === "1";
    } catch {
      return false;
    }
  }
}

/** Singleton shared by the layout and the install banner. */
export const pwa = new PwaManager();
