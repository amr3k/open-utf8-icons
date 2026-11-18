<script lang="ts">
  /**
   * Category/block browser (Phase 3): horizontally scrollable filter chips
   * with per-block counts, doubling as the "sidebar" on wide screens.
   * Tapping the active chip (or "All") clears the filter.
   */
  import type { BlockStat } from "#lib/dataset.js";

  interface Props {
    blocks: readonly BlockStat[];
    total: number;
    block?: string | null;
  }

  let { blocks, total, block = $bindable(null) }: Props = $props();

  function formatCount(count: number): string {
    return count.toLocaleString("en-US");
  }
</script>

<div
  class="mt-4 flex gap-2 overflow-x-auto pb-1 text-xs"
  role="group"
  aria-label="Filter by Unicode block"
>
  <button
    type="button"
    onclick={() => (block = null)}
    aria-pressed={block === null}
    class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 font-medium transition active:scale-[0.96] {block ===
    null
      ? 'border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
      : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100'}"
  >
    <span>All</span>
    <span class="tabular-nums opacity-60">{formatCount(total)}</span>
  </button>
  {#each blocks as stat (stat.block)}
    <button
      type="button"
      onclick={() => (block = stat.block === block ? null : stat.block)}
      aria-pressed={block === stat.block}
      class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 font-medium transition active:scale-[0.96] {block ===
      stat.block
        ? 'border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
        : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100'}"
    >
      <span>{stat.block}</span>
      <span class="tabular-nums opacity-60">{formatCount(stat.count)}</span>
    </button>
  {/each}
</div>
