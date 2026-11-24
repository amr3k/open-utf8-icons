<script lang="ts">
  /**
   * Virtualized-by-windowing glyph grid (Phase 3): renders an initial page
   * of cards and grows the window with an IntersectionObserver sentinel as
   * you scroll. Combined with `content-visibility: auto` on the cards, the
   * DOM stays small near the viewport and the browser skips painting
   * off-screen tiles — smooth 60fps scrolling with zero dependencies.
   *
   * The render window resets because the parent remounts this component
   * with a `{#key}` block whenever the result set changes.
   */
  import GlyphCard from "#lib/components/GlyphCard.svelte";
  import type { Glyph } from "#lib/data/types.js";
  import type { CopyFormat } from "#lib/copy.js";
  import { formatCount } from "#lib/format.js";

  interface Props {
    results: readonly Glyph[];
    format: CopyFormat;
    /** Code point keys of favorited glyphs, for the card star badge. */
    favorites?: ReadonlySet<string>;
    oncopy: (glyph: Glyph) => void;
    /** Open the glyph inspector for a card. */
    oninspect: (glyph: Glyph) => void;
    /** Optional handler to clear the active query/filters on empty state. */
    onclear?: () => void;
    /** Empty-state copy when the current collection/search has no results. */
    emptyTitle?: string;
    emptyHint?: string;
  }

  let {
    results,
    format,
    favorites = new Set<string>(),
    oncopy,
    oninspect,
    onclear,
    emptyTitle = "No glyphs match your search.",
    emptyHint = "Try a name like arrow, a keyword like favorite, or a code point like u+2605.",
  }: Props = $props();

  /** Cards per growth step; a smaller first page keeps the paint light. */
  const PAGE_SIZE = 48;

  /**
   * Start loading the next page this far before the sentinel is on screen.
   * A full page of cards is already >1000px of scroll buffer, so a small
   * margin keeps the next page out of the initial load/hydration.
   */
  const PREFETCH_MARGIN = 240;

  /** How many cards are currently mounted. */
  let visibleCount = $state(PAGE_SIZE);

  /**
   * Grow the window while the sentinel (just below the grid) is within reach.
   *
   * Runs as an attachment: mounted when the sentinel enters the DOM,
   * disconnected when it leaves. An IntersectionObserver alone is not enough
   * here: it only fires when the intersection *changes*, so if the sentinel is
   * still inside the prefetch margin after a page is appended (a tall viewport,
   * or rows that don't push it past the margin) it never becomes "not
   * intersecting" and growth stalls after a page or two. So each hit drains in
   * a rAF loop until the sentinel is genuinely out of reach; scrolling back
   * into range wakes the observer again.
   */
  function observeSentinel(el: HTMLDivElement): () => void {
    let frame = 0;
    let stopped = false;

    /** Same bounds as the observer's rootMargin, measured on demand. */
    function inReach(): boolean {
      const rect = el.getBoundingClientRect();
      return (
        rect.top <= window.innerHeight + PREFETCH_MARGIN &&
        rect.bottom >= -PREFETCH_MARGIN
      );
    }

    function drain(): void {
      if (stopped || frame !== 0) return;
      if (visibleCount >= results.length || !inReach()) return;
      visibleCount = Math.min(visibleCount + PAGE_SIZE, results.length);
      // Re-measure once Svelte has mounted the appended rows.
      frame = requestAnimationFrame(() => {
        frame = 0;
        drain();
      });
    }

    const observer = new IntersectionObserver(
      (records) => {
        if (records.some((record) => record.isIntersecting)) drain();
      },
      { rootMargin: `${PREFETCH_MARGIN}px 0px` },
    );
    observer.observe(el);

    return () => {
      stopped = true;
      if (frame !== 0) cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }

  let rendered = $derived(results.slice(0, visibleCount));
</script>

{#if results.length === 0}
  <div
    class="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/60 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/30"
  >
    <div class="text-4xl text-zinc-300 dark:text-zinc-700" aria-hidden="true">
      ◌
    </div>
    <p class="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
      {emptyTitle}
    </p>
    <p
      class="mt-1 max-w-sm text-pretty text-xs text-zinc-500 dark:text-zinc-400"
    >
      {emptyHint}
    </p>
    {#if onclear}
      <button
        type="button"
        onclick={onclear}
        class="mt-5 inline-flex h-9 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 text-xs font-medium text-zinc-700 shadow-2xs transition hover:bg-zinc-50 hover:text-zinc-900 active:scale-[0.96] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      >
        <span class="text-sm leading-none" aria-hidden="true">✕</span>
        <span>Clear search &amp; filters</span>
      </button>
    {/if}
  </div>
{:else}
  <div
    class="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12"
  >
    {#each rendered as glyph (glyph.codepoint)}
      <GlyphCard
        {glyph}
        {format}
        favorite={favorites.has(glyph.codepoint)}
        {oncopy}
        {oninspect}
      />
    {/each}
  </div>
  <div {@attach observeSentinel} class="h-px" aria-hidden="true"></div>
  <p
    class="mt-4 text-center text-xs tabular-nums text-zinc-500 dark:text-zinc-400"
    aria-live="polite"
  >
    Showing {formatCount(rendered.length)}
    <span class="text-zinc-500 dark:text-zinc-400">of</span>
    {formatCount(results.length)}
    {#if rendered.length < results.length}
      <span class="ml-1" aria-hidden="true">▾ scroll for more</span>
    {/if}
  </p>
{/if}
