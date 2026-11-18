<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import SearchBar from "#lib/components/SearchBar.svelte";
  import BlockFilter from "#lib/components/BlockFilter.svelte";
  import GlyphGrid from "#lib/components/GlyphGrid.svelte";
  import ViewFilter from "#lib/components/ViewFilter.svelte";
  import GlyphInspector from "#lib/components/GlyphInspector.svelte";
  import {
    countBlocks,
    dataset,
    glyphByCodepoint,
    glyphFromHash,
    glyphs,
  } from "#lib/dataset.js";
  import { glyphHash } from "#lib/permalink.js";
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

  /**
   * Hydration always starts with the drawer closed, so server and client
   * markup match. The fragment is resolved on the client only, against the
   * bundled dataset.
   */
  let hydrated = $state(false);

  /**
   * The fragment the visitor can see in the address bar. A shallow navigation
   * (how the drawer opens and closes) deliberately leaves `page.url` pointing
   * at the rendered page — the new URL lives in `page.shallow.url` instead.
   * Fall back to `page.url` for a shared permalink on first load, when no
   * shallow navigation has happened yet. Using `page.url` alone here made the
   * fragment never change on click, so the drawer never opened.
   */
  const currentHash = $derived(
    page.shallow !== null ? page.shallow.url.hash : page.url.hash,
  );

  /**
   * Glyph shown in the inspector drawer. The URL fragment is the single
   * source of truth: opening and closing are shallow SvelteKit navigations,
   * so Back and Forward walk the inspected glyphs like any other history —
   * and a shared permalink opens the same drawer on load.
   */
  const selected = $derived(
    hydrated ? (glyphFromHash(currentHash) ?? null) : null,
  );

  onMount(() => {
    hydrated = true;
  });

  /** Favorited code point keys — a Set keeps per-card lookups O(1). */
  let favoriteKeys = $derived(new Set(library.favorites));

  /** Glyphs in the active collection, in collection order. */
  let viewGlyphs = $derived.by<readonly Glyph[]>(() => {
    if (view === "favorites") {
      return library.favorites.flatMap((key) => {
        const glyph = glyphByCodepoint.get(key);
        return glyph === undefined ? [] : [glyph];
      });
    }
    if (view === "recent") {
      return library.recents.flatMap((recent) => {
        const glyph = glyphByCodepoint.get(recent.key);
        return glyph === undefined ? [] : [glyph];
      });
    }
    return glyphs;
  });

  /** Glyphs in scope for the active collection + block filter. */
  let contextGlyphs = $derived(
    block === null
      ? viewGlyphs
      : viewGlyphs.filter((glyph) => glyph.block === block),
  );

  /**
   * Scored search results over the scoped glyphs. Ranked matches are never
   * truncated — the windowed grid renders them 48 at a time.
   */
  let results = $derived(searchGlyphs(contextGlyphs, query));

  let status = $derived<SearchStatus>({
    matchCount: results.length,
    totalCount: contextGlyphs.length,
    filtersActive: query.trim() !== "" || block !== null,
  });

  /** Block chips reflect the active collection, not the whole dataset. */
  let scopedBlocks = $derived(countBlocks(viewGlyphs));

  /** Context-aware empty state for the grid. */
  let emptyState = $derived.by(() => {
    if (query.trim() === "" && block === null) {
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

  /**
   * Open the inspector and add a shareable history entry for this glyph.
   * The navigation is shallow, so no `load` function re-runs and the scroll
   * position and focus stay where they are.
   */
  function inspectGlyph(glyph: Glyph) {
    const hash = glyphHash(glyph);
    if (currentHash === hash) return;
    void goto(hash, { state: page.state, shallow: true });
  }

  /**
   * Drop the glyph fragment without adding a history entry, so dismissing
   * the drawer never comes back on Back.
   */
  function closeInspector() {
    if (currentHash === "") return;
    void goto(`${page.url.pathname}${page.url.search}`, {
      state: page.state,
      shallow: true,
      replace: true,
    });
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

  /** Report a render failure without taking the directory down with it. */
  function reportError(error: unknown) {
    console.error("[open-utf8-icons] render error:", error);
  }

  /**
   * A drawer that throws is removed by its boundary for the rest of the
   * session; the toast is the only trace the visitor gets, so say so.
   */
  function reportInspectorError(error: unknown) {
    reportError(error);
    toasts.show("✕ The glyph inspector failed to render");
  }
</script>

<svelte:head>
  <title>{SITE_TITLE}</title>
</svelte:head>

<main class="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
  <div class="rise-in mb-8">
    <h2
      class="text-balance text-3xl font-extrabold leading-[1.1] tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50"
    >
      Discover, preview &amp; copy
      <span class="text-sky-600 dark:text-sky-400">native UTF-8</span> glyphs.
    </h2>
    <p class="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
      {formatCount(dataset.count)} glyphs from Unicode {dataset.unicode}
      &middot; instant offline search &middot; click a glyph to inspect &middot; press
      <kbd
        class="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 px-1 text-[10px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
        >/</kbd
      > to search
    </p>
  </div>

  <div class="rise-in" style="animation-delay: 60ms">
    <SearchBar bind:query bind:copyFormat {status} />
  </div>

  <div
    class="rise-in mt-4 flex flex-wrap items-center gap-2"
    style="animation-delay: 100ms"
  >
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
        class="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-900 active:scale-[0.96] dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <span aria-hidden="true">✕</span>
        <span>Clear recents</span>
      </button>
    {/if}
  </div>

  <div class="rise-in" style="animation-delay: 140ms">
    <BlockFilter blocks={scopedBlocks} total={viewGlyphs.length} bind:block />
  </div>

  <div class="rise-in" style="animation-delay: 180ms">
    <svelte:boundary onerror={reportError}>
      <!-- #key resets the grid's render window when the query/filter changes,
           but not when results merely reorder (e.g. recents after a copy) -->
      {#key `${view}|${block ?? ""}|${query}`}
        <GlyphGrid
          {results}
          format={copyFormat}
          favorites={favoriteKeys}
          oncopy={handleCopy}
          oninspect={inspectGlyph}
          onclear={clearAll}
          emptyTitle={emptyState.title}
          emptyHint={emptyState.hint}
        />
      {/key}

      {#snippet failed(_error, reset)}
        <div
          class="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/60 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/30"
        >
          <div
            class="text-4xl text-zinc-300 dark:text-zinc-700"
            aria-hidden="true"
          >
            ⚠
          </div>
          <p class="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            The grid failed to render.
          </p>
          <p
            class="mt-1 max-w-sm text-pretty text-xs text-zinc-500 dark:text-zinc-400"
          >
            Your search and filters are still here — retry to rebuild the
            results.
          </p>
          <button
            type="button"
            onclick={reset}
            class="mt-5 inline-flex h-9 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 text-xs font-medium text-zinc-700 shadow-2xs transition hover:bg-zinc-50 hover:text-zinc-900 active:scale-[0.96] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <span class="text-sm leading-none" aria-hidden="true">↻</span>
            <span>Retry</span>
          </button>
        </div>
      {/snippet}
    </svelte:boundary>
  </div>
</main>

<!-- A drawer that throws is removed, but the directory keeps working. -->
<svelte:boundary onerror={reportInspectorError}>
  <GlyphInspector
    glyph={selected}
    favorite={selected !== null && favoriteKeys.has(selected.codepoint)}
    onclose={closeInspector}
    oncopy={handleCopy}
    onfavorite={handleToggleFavorite}
  />
</svelte:boundary>
