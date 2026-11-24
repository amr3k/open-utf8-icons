<script lang="ts">
  /**
   * Category/block browser: one horizontally scrollable rail with hidden
   * scrollbar and faded edges. "All blocks" is deliberately distinct from
   * the collection switcher's "All" above it.
   */
  import type { BlockStat } from "#lib/dataset.js";
  import { formatCount } from "#lib/format.js";
  import { CHIP_ACTIVE, CHIP_BASE, CHIP_INACTIVE } from "#lib/ui.js";

  interface Props {
    blocks: readonly BlockStat[];
    total: number;
    block?: string | null;
  }

  let { blocks, total, block = $bindable(null) }: Props = $props();

  function select(name: string) {
    block = block === name ? null : name;
  }
</script>

<div
  class="no-scrollbar edge-fade mt-3 flex gap-2 overflow-x-auto pb-1 text-xs"
  role="group"
  aria-label="Filter by Unicode block"
>
  {#snippet chip(
    label: string,
    count: number,
    active: boolean,
    onclick: () => void,
  )}
    <button
      type="button"
      {onclick}
      aria-pressed={active}
      class="{CHIP_BASE} {active ? CHIP_ACTIVE : CHIP_INACTIVE}"
    >
      <span>{label}</span>
      <span
        class="rounded-full px-1.5 py-0.5 text-[10px] leading-none tabular-nums {active
          ? 'bg-white/15 text-zinc-200 dark:bg-zinc-900/20 dark:text-zinc-700'
          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}"
        >{formatCount(count)}</span
      >
    </button>
  {/snippet}

  {@render chip("All blocks", total, block === null, () => (block = null))}
  {#each blocks as stat (stat.block)}
    {@render chip(stat.block, stat.count, block === stat.block, () =>
      select(stat.block),
    )}
  {/each}
</div>
