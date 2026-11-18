<script lang="ts">
  import SearchBar from "#lib/components/SearchBar.svelte";
  import BlockFilter from "#lib/components/BlockFilter.svelte";
  import GlyphGrid from "#lib/components/GlyphGrid.svelte";
  import { blockStats, dataset, glyphs, searchEntries } from "#lib/dataset.js";
  import { searchGlyphs, type SearchStatus } from "#lib/search.js";
  import { formatCount } from "#lib/format.js";
  import { copyToClipboard, getCopyText, type CopyFormat } from "#lib/copy.js";
  import { toasts } from "#lib/toast.svelte.js";
  import type { Glyph } from "#lib/data/types.js";

  let query = $state("");
  let block = $state<string | null>(null);
  let copyFormat = $state<CopyFormat>("char");

  /** Entries in scope for the active block filter (all glyphs when null). */
  let contextEntries = $derived(
    block === null
      ? searchEntries
      : searchEntries.filter((entry) => entry.glyph.block === block),
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

  /** 1-click quick copy in the selected format, confirmed by a toast. */
  async function handleCopy(glyph: Glyph) {
    const copied = await copyToClipboard(getCopyText(glyph, copyFormat));
    toasts.show(
      copied
        ? `✓ Copied ${glyph.char} — ${glyph.name}`
        : `✕ Copy failed for ${glyph.char}`,
    );
  }

  function clearAll() {
    query = "";
    block = null;
  }
</script>

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
      &middot; instant offline search &middot; press
      <kbd
        class="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 px-1 text-[10px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
        >/</kbd
      > to search
    </p>
  </div>

  <SearchBar bind:query bind:copyFormat {status} />

  <BlockFilter blocks={blockStats} total={glyphs.length} bind:block />

  <!-- #key resets the grid's render window whenever the result set changes -->
  {#key results}
    <GlyphGrid
      {results}
      format={copyFormat}
      oncopy={handleCopy}
      onclear={clearAll}
    />
  {/key}
</main>
