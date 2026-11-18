<script lang="ts">
  /**
   * A single glyph tile (Phases 3 & 4): clicking the tile opens the glyph
   * inspector, while the 📋 corner button keeps the 1-click quick copy.
   * `content-visibility: auto` lets the browser skip rendering off-screen
   * tiles so huge grids stay smooth without any virtualization dependency.
   */
  import type { Glyph } from "#lib/data/types.js";
  import { getCopyText, type CopyFormat } from "#lib/copy.js";

  interface Props {
    glyph: Glyph;
    format: CopyFormat;
    /** Whether this glyph is in the user's favorites. */
    favorite?: boolean;
    oncopy: (glyph: Glyph) => void;
    oninspect: (glyph: Glyph) => void;
  }

  let {
    glyph,
    format,
    favorite = false,
    oncopy,
    oninspect,
  }: Props = $props();

  let copyText = $derived(getCopyText(glyph, format));
</script>

<article
  class="group relative aspect-square select-none rounded-xl border border-zinc-200 bg-white text-center shadow-2xs transition hover:border-sky-500 hover:shadow-xs focus-within:border-sky-500 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-sky-500 [content-visibility:auto] [contain-intrinsic-size:auto_104px]"
>
  <button
    type="button"
    onclick={() => oninspect(glyph)}
    aria-label={`Inspect ${glyph.name} (${glyph.codepoint})`}
    title={`Inspect ${glyph.name} (${glyph.codepoint})`}
    class="flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl p-2 active:scale-[0.96]"
  >
    <span
      class="pointer-events-none px-1 text-2xl leading-none text-zinc-900 dark:text-zinc-100 md:text-3xl"
      aria-hidden="true">{glyph.char}</span
    >
    <span
      class="w-full truncate text-[10px] font-medium text-zinc-500 dark:text-zinc-400"
      >{glyph.name}</span
    >
    <span class="text-[9px] tabular-nums text-zinc-400 dark:text-zinc-500"
      >{glyph.codepoint}</span
    >
  </button>

  <button
    type="button"
    onclick={() => oncopy(glyph)}
    aria-label={`Copy ${glyph.name} (${copyText})`}
    title={`Copy ${copyText} — ${glyph.name}`}
    class="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-md text-[11px] text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 active:scale-[0.96] sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
  >
    <span aria-hidden="true">📋</span>
  </button>

  {#if favorite}
    <span
      class="pointer-events-none absolute left-1 top-1 text-[11px] text-amber-500"
      title="Favorite"
      aria-hidden="true">★</span
    >
  {/if}
</article>
