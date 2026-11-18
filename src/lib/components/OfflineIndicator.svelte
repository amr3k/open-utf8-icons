<script lang="ts">
  /**
   * Offline status pill (Phase 5 of #1).
   *
   * `online.current` is `undefined` on the server but resolves immediately to
   * `navigator.onLine` on the client, so a page first loaded while offline
   * would otherwise hydrate a pill the server never sent. The `mounted` gate
   * keeps SSR and the first hydration pass empty; the pill appears right after
   * mount. Sits below the toast stack (`z-50`) and ignores pointer events so it
   * never blocks the UI.
   */
  import { onMount } from "svelte";
  import { online } from "svelte/reactivity/window";

  let mounted = $state(false);

  onMount(() => {
    mounted = true;
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
      <span class="truncate"
        >Offline — search, inspect &amp; copy still work</span
      >
    </p>
  </div>
{/if}
