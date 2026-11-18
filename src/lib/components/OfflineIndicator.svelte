<script lang="ts">
  /**
   * Offline status pill (Phase 5 of #1).
   *
   * The claim is cache-backed: `isShellCached()` checks Cache Storage for the
   * app shell, so the pill only promises offline search, inspect and copy once
   * the shell is actually cached. `online.current` is `undefined` on the server
   * but resolves immediately to `navigator.onLine` on the client, so the
   * `mounted` gate keeps SSR and the first hydration pass empty. Sits below the
   * toast stack (`z-50`) and ignores pointer events so it never blocks the UI.
   */
  import { onMount } from "svelte";
  import { online } from "svelte/reactivity/window";
  import { isShellCached } from "#lib/pwa.js";

  let mounted = $state(false);
  let shellCached = $state(false);

  async function refreshShellCache() {
    shellCached = await isShellCached();
  }

  onMount(() => {
    mounted = true;
    void refreshShellCache();
  });

  // Re-check the cache when the tab goes offline: the shell may have been
  // cached since the last check (e.g. the service worker finished installing).
  $effect(() => {
    if (online.current === false) {
      void refreshShellCache();
    }
  });
</script>

{#if mounted && online.current === false}
  <div
    class="pointer-events-none fixed inset-x-4 bottom-4 z-40 flex justify-center sm:inset-x-auto sm:bottom-6 sm:left-6 sm:justify-start"
  >
    <p
      role="status"
      aria-live="polite"
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
