<script lang="ts">
  /**
   * Offline status pill (Phase 5 of #1).
   *
   * The claim is cache-backed: `isShellCached()` checks Cache Storage for the
   * app shell, so the pill only promises offline search, inspect and copy once
   * the shell is actually cached. `online.current` tracks connectivity and
   * drives the cache probe, so no hand-written `offline` listener is needed.
   * It is `undefined` on the server but resolves immediately on the client, so
   * the `mounted` gate keeps SSR and the first hydration pass empty. Sits
   * below the toast stack (`z-50`), lifts above the install banner when it is
   * visible, and ignores pointer events so it never blocks the UI.
   */
  import { onMount } from "svelte";
  import { prefersReducedMotion } from "svelte/motion";
  import { online } from "svelte/reactivity/window";
  import { fade, fly } from "svelte/transition";
  import { flyOffset } from "#lib/motion.js";
  import { isShellCached } from "#lib/pwa.js";
  import { pwa } from "#lib/pwa.svelte.js";

  let mounted = $state(false);
  let shellCached = $state(false);

  const reducedMotion = $derived(prefersReducedMotion.current);

  async function refreshShellCache() {
    shellCached = await isShellCached();
  }

  onMount(() => {
    mounted = true;
    void refreshShellCache();
  });

  // The shell may have been cached (or evicted) since the last check, so
  // re-probe whenever connectivity drops.
  $effect(() => {
    if (online.current === false) void refreshShellCache();
  });
</script>

{#if mounted && online.current === false}
  <div
    class="pointer-events-none fixed inset-x-4 {pwa.banner
      ? 'bottom-24'
      : 'bottom-4 sm:bottom-6'} z-40 flex justify-center sm:inset-x-auto sm:left-6 sm:justify-start"
  >
    <p
      role="status"
      aria-live="polite"
      in:fly={flyOffset(reducedMotion, { y: 6 }, 180)}
      out:fade={{ duration: reducedMotion ? 0 : 120 }}
      class="inline-flex max-w-full items-center gap-1.5 rounded-full border border-amber-300/80 bg-amber-50/95 px-3 py-1.5 text-xs font-medium text-amber-900 shadow-lg backdrop-blur dark:border-amber-900/60 dark:bg-amber-950/90 dark:text-amber-200"
    >
      <span class="shrink-0 leading-none" aria-hidden="true">⚡</span>
      <span class="truncate">
        {#if shellCached}
          Offline — search, inspect &amp; copy still work
        {:else}
          Offline — reconnect once to cache the directory
        {/if}
      </span>
    </p>
  </div>
{/if}
