<script lang="ts">
  import SearchBar from "#lib/components/SearchBar.svelte";
  import BlockFilter from "#lib/components/BlockFilter.svelte";
  import GlyphGrid from "#lib/components/GlyphGrid.svelte";
  import ViewFilter from "#lib/components/ViewFilter.svelte";
  import GlyphInspector from "#lib/components/GlyphInspector.svelte";
  import {
    countBlocks,
    dataset,
    searchEntries,
    searchEntryByCodepoint,
  } from "#lib/dataset.js";
  import { searchGlyphs, type SearchStatus } from "#lib/search.js";
  import { formatCount } from "#lib/format.js";
  import {
    copyToClipboard,
    getCopyText,
    type CopyFormat,
    type DeveloperFormat,
  } from "#lib/copy.js";
  import { library } from "#lib/library.svelte.js";
  import type { LibraryView } from "#lib/library.js";
  import { SITE_TITLE } from "#lib/seo.js";
  import { toasts } from "#lib/toast.svelte.js";
  import type { Glyph } from "#lib/data/types.js";

  let query = $state("");
  let block = $state<string | null>(null);
  let copyFormat = $state<CopyFormat>("char");
  let view = $state<LibraryView>("all");
  /** Glyph shown in the inspector drawer, or `null` when closed. */
  let selected = $state<Glyph | null>(null);

  /** Favorited code point keys — a Set keeps per-card lookups O(1). */
  let favoriteKeys = $derived(new Set(library.favorites));

  /** Entries in the active collection, in collection order. */
  let viewEntries = $derived.by(() => {
    if (view === "favorites") {
      return library.favorites.flatMap((key) => {
        const entry = searchEntryByCodepoint.get(key);
        return entry === undefined ? [] : [entry];
      });
    }
    if (view === "recent") {
      return library.recents.flatMap((recent) => {
        const entry = searchEntryByCodepoint.get(recent.key);
        return entry === undefined ? [] : [entry];
      });
    }
    return searchEntries;
  });

  /** Entries in scope for the active collection + block filter. */
  let contextEntries = $derived(
    block === null
      ? viewEntries
      : viewEntries.filter((entry) => entry.glyph.block === block),
  );

  /**
   * Scored search results over the scoped entries. Ranked matches are never
   * truncated — the windowed grid renders them 96 at a time.
   */
  let results = $derived(searchGlyphs(contextEntries, query));

  let status = $derived<SearchStatus>({
    matchCount: results.length,
    totalCount: contextEntries.length,
    filtersActive: query.trim() !== "" || block !== null,
  });

  /** Block chips reflect the active collection, not the whole dataset. */
  let scopedBlocks = $derived(
    countBlocks(viewEntries.map((entry) => entry.glyph)),
  );

  /** Context-aware empty state for the grid. */
  let emptyState = $derived.by(() => {
    if (query.trim() !== "" || block !== null) {
      return {
        title: "No glyphs match your search.",
        hint: "Try a name like arrow, a keyword like favorite, or a code point like u+2605.",
      };
    }
    if (view === "favorites") {
      return {
        title: "No favorites yet.",
        hint: "Open any glyph and select ☆ to keep it here.",
      };
    }
    if (view === "recent") {
      return {
        title: "No recent copies yet.",
        hint: "Copy any glyph — your most recent copies land here.",
      };
    }
    return {
      title: "No glyphs match your search.",
      hint: "Try a name like arrow, a keyword like favorite, or a code point like u+2605.",
    };
  });

  /** Quick copy from a card or copy a developer format from the inspector. */
  async function handleCopy(
    glyph: Glyph,
    format: DeveloperFormat = copyFormat,
  ) {
    const copied = await copyToClipboard(getCopyText(glyph, format));
    if (copied) library.recordCopy(glyph.codepoint, format);
    toasts.show(
      copied
        ? `✓ Copied ${glyph.char} — ${glyph.name}`
        : `✕ Copy failed for ${glyph.char}`,
    );
  }

  function handleToggleFavorite(glyph: Glyph) {
    const wasFavorite = library.isFavorite(glyph.codepoint);
    library.toggleFavorite(glyph.codepoint);
    toasts.show(
      wasFavorite
        ? `☆ Removed ${glyph.char} from favorites`
        : `★ Added ${glyph.char} to favorites`,
    );
  }

  /** Switch collections; the block chip belongs to the previous view. */
  function selectView(next: LibraryView) {
    view = next;
    block = null;
  }

  function clearAll() {
    query = "";
    block = null;
    view = "all";
  }
</script>

<svelte:head>
  <title>{SITE_TITLE}</title>
</svelte:head>

<main class="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-10 sm:px-6">
  <div class="mb-8">
    <h2
      class="text-balance text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50"
    >
      Discover, preview &amp; copy
      <span class="text-sky-600 dark:text-sky-400">native UTF-8</span> glyphs.
    </h2>
    <p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
      {formatCount(dataset.count)} glyphs from Unicode {dataset.unicode}
      &middot; instant offline search &middot; click a glyph to inspect &middot; press
      <kbd
        class="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 px-1 text-[10px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
        >/</kbd
      > to search
    </p>
  </div>

  <SearchBar bind:query bind:copyFormat {status} />

  <div class="mt-4 flex flex-wrap items-center gap-2">
    <ViewFilter
      {view}
      favoritesCount={library.favorites.length}
      recentCount={library.recents.length}
      onselect={selectView}
    />
    {#if view === "recent" && library.recents.length > 0}
      <button
        type="button"
        onclick={() => library.clearRecents()}
        class="inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-900 active:scale-[0.96] dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <span aria-hidden="true">✕</span>
        <span>Clear recents</span>
      </button>
    {/if}
  </div>

  <BlockFilter blocks={scopedBlocks} total={viewEntries.length} bind:block />

  <!-- #key resets the grid's render window when the query/filter changes, but
       not when results merely reorder (e.g. recents after a copy) -->
  {#key `${view}|${block ?? ""}|${query}`}
    <GlyphGrid
      {results}
      format={copyFormat}
      favorites={favoriteKeys}
      oncopy={handleCopy}
      oninspect={(glyph) => (selected = glyph)}
      onclear={clearAll}
      emptyTitle={emptyState.title}
      emptyHint={emptyState.hint}
    />
  {/key}
</main>

<GlyphInspector
  glyph={selected}
  favorite={selected !== null && favoriteKeys.has(selected.codepoint)}
  onclose={() => (selected = null)}
  oncopy={handleCopy}
  onfavorite={handleToggleFavorite}
/>
