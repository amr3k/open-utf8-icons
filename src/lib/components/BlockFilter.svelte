<script lang="ts">
  /**
   * Category/block browser (Phase 3): horizontally scrollable filter chips
   * with per-block counts, doubling as the "sidebar" on wide screens.
   * Tapping the active chip (or "All") clears the filter.
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

  /** Select a block; tapping the active block again clears the filter. */
  function select(name: string) {
    block = block === name ? null : name;
  }
</script>

<div
  class="mt-4 flex gap-2 overflow-x-auto pb-1 text-xs"
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
      <span class="tabular-nums opacity-60">{formatCount(count)}</span>
    </button>
  {/snippet}

  {@render chip("All", total, block === null, () => (block = null))}
  {#each blocks as stat (stat.block)}
    {@render chip(stat.block, stat.count, block === stat.block, () =>
      select(stat.block),
    )}
  {/each}
</div>
