// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }

  /** Chromium's install prompt event (not yet in the DOM type definitions). */
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: readonly string[];
    readonly userChoice: Promise<{
      outcome: "accepted" | "dismissed";
      platform: string;
    }>;
    prompt(): Promise<void>;
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }

  interface Window {
    /** Captured by the inline bootstrap in `app.html` before hydration. */
    __utf8IconsInstallPrompt?: BeforeInstallPromptEvent;
  }

  interface Navigator {
    /** Safari's legacy iOS standalone flag. */
    readonly standalone?: boolean;
  }
}

export {};
