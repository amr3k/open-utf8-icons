<script lang="ts">
  /**
   * Renders the global toast stack (one instance in the root layout).
   * The stack lifts above the install banner when it is visible — both
   * are fixed layers, so the offset change causes no layout shift.
   * Pure UTF-8 feedback glyphs (✓ / ✕) come from the toast text itself.
   */
  import { prefersReducedMotion } from "svelte/motion";
  import { fly } from "svelte/transition";
  import { flyOffset } from "#lib/motion.js";
  import { pwa } from "#lib/pwa.svelte.js";
  import { toasts } from "#lib/toast.svelte.js";

  const reducedMotion = $derived(prefersReducedMotion.current);
</script>

<div
  class="pointer-events-none fixed inset-x-0 {pwa.banner
    ? 'bottom-24'
    : 'bottom-6'} z-50 flex flex-col items-center gap-2 px-4 pb-[env(safe-area-inset-bottom)]"
  aria-live="polite"
>
  {#each toasts.items as toast (toast.id)}
    <div
      class="pointer-events-auto max-w-full"
      in:fly={flyOffset(reducedMotion, { y: 12 }, 200)}
      out:fly={flyOffset(reducedMotion, { y: 8 }, 140)}
    >
      <button
        type="button"
        onclick={() => toasts.dismiss(toast.id)}
        class="inline-flex max-w-full items-center gap-2 truncate rounded-full border border-zinc-200 bg-white/95 px-4 py-2 text-sm font-medium text-zinc-800 shadow-lg backdrop-blur transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        <span class="truncate">{toast.text}</span>
      </button>
    </div>
  {/each}
</div>
