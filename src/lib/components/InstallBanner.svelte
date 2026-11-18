<script lang="ts">
  /**
   * Floating, dismissible install bottom sheet (Phase 5 of #1).
   *
   * Rendered as a fixed bottom overlay, so the page layout is identical
   * whether or not it is visible: it never shifts page content (no CLS)
   * and animates with transform + opacity only. Chromium gets the native
   * install prompt; iOS gets the Share → Add to Home Screen hint. Every
   * icon is a native UTF-8 glyph.
   */
  import { pwa } from "#lib/pwa.svelte.js";
  import { cubicOut } from "svelte/easing";
  import { prefersReducedMotion } from "svelte/motion";
  import { fly } from "svelte/transition";

  const reducedMotion = $derived(prefersReducedMotion.current);
</script>

{#if pwa.banner}
  <div
    class="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 pb-[env(safe-area-inset-bottom)]"
    in:fly={{
      y: reducedMotion ? 0 : 16,
      duration: reducedMotion ? 0 : 220,
      easing: cubicOut,
    }}
    out:fly={{
      y: reducedMotion ? 0 : 12,
      duration: reducedMotion ? 0 : 160,
      easing: cubicOut,
    }}
  >
    <div
      role="region"
      aria-label="Install app"
      class="pointer-events-auto w-full max-w-md flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2.5 shadow-2xs sm:px-4 dark:border-sky-900/70 dark:bg-sky-950/50"
    >
      <span
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-base font-bold leading-none text-sky-400 shadow-xs dark:bg-zinc-100 dark:text-sky-600"
        aria-hidden="true">ツ</span
      >

      <div class="min-w-0 flex-1">
        <p class="text-xs font-medium text-sky-950 sm:text-sm dark:text-sky-50">
          Install Open UTF-8 icons for instant offline glyph search.
        </p>
        {#if pwa.ios}
          <p
            class="mt-0.5 text-[11px] leading-snug text-sky-800 dark:text-sky-200"
          >
            Tap <span aria-hidden="true">⤴</span> Share, then
            <span class="font-medium">Add to Home Screen</span>.
          </p>
        {/if}
      </div>

      <div
        class="flex w-full items-center justify-end gap-1.5 sm:w-auto sm:shrink-0"
      >
        {#if pwa.canPrompt}
          <button
            type="button"
            onclick={() => void pwa.install()}
            title="Install Open UTF-8 icons"
            class="inline-flex h-8 items-center gap-1.5 rounded-full bg-sky-700 px-3 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-sky-600 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-sky-50 focus-visible:outline-none active:scale-[0.96] dark:bg-sky-500 dark:text-sky-950 dark:hover:bg-sky-400 dark:focus-visible:ring-offset-sky-950"
          >
            <span class="text-sm leading-none" aria-hidden="true">⤓</span>
            <span>Install</span>
          </button>
        {/if}

        <button
          type="button"
          onclick={() => pwa.dismiss()}
          aria-label="Dismiss install banner"
          title="Dismiss"
          class="flex h-8 w-8 items-center justify-center rounded-full text-sky-700 transition-colors hover:bg-sky-100 hover:text-sky-900 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-sky-50 focus-visible:outline-none active:scale-[0.96] dark:text-sky-200 dark:hover:bg-sky-900/60 dark:hover:text-sky-50 dark:focus-visible:ring-offset-sky-950"
        >
          <span class="text-sm leading-none" aria-hidden="true">✕</span>
        </button>
      </div>
    </div>
  </div>
{/if}
