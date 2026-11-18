<script lang="ts">
  /**
   * Collection switcher (Phase 4): All / ★ Favorites / 🕘 Recent. Renders as
   * the same segmented pill control used elsewhere, with optional counts.
   */
  import PillButton from "#lib/components/PillButton.svelte";
  import type { LibraryView } from "#lib/library.js";
  import { formatCount } from "#lib/format.js";
  import { PILL_GROUP } from "#lib/ui.js";

  interface Props {
    view: LibraryView;
    favoritesCount?: number;
    recentCount?: number;
    onselect: (view: LibraryView) => void;
  }

  let { view, favoritesCount = 0, recentCount = 0, onselect }: Props = $props();

  const VIEWS: {
    id: LibraryView;
    icon: string;
    label: string;
    count: (favorites: number, recent: number) => number | null;
  }[] = [
    { id: "all", icon: "", label: "All", count: () => null },
    {
      id: "favorites",
      icon: "★",
      label: "Favorites",
      count: (favorites) => favorites,
    },
    {
      id: "recent",
      icon: "🕘",
      label: "Recent",
      count: (_, recent) => recent,
    },
  ];
</script>

<div class={PILL_GROUP} role="group" aria-label="Glyph collection">
  {#each VIEWS as item (item.id)}
    {@const count = item.count(favoritesCount, recentCount)}
    <PillButton active={view === item.id} onclick={() => onselect(item.id)}>
      {#if item.icon}
        <span class="mr-1 text-xs leading-none" aria-hidden="true"
          >{item.icon}</span
        >
      {/if}
      <span>{item.label}</span>
      {#if count !== null && count > 0}
        <span class="ml-1 tabular-nums text-zinc-600 dark:text-zinc-400"
          >{formatCount(count)}</span
        >
      {/if}
    </PillButton>
  {/each}
</div>
