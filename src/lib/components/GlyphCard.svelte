<script lang="ts">
  /**
   * A single glyph tile (Phase 3): click anywhere to quick-copy in the
   * selected format. `content-visibility: auto` lets the browser skip
   * rendering off-screen tiles so huge grids stay smooth without any
   * virtualization dependency.
   */
  import type { Glyph } from "#lib/data/types.js";
  import { getCopyText, type CopyFormat } from "#lib/copy.js";

  interface Props {
    glyph: Glyph;
    format: CopyFormat;
    oncopy: (glyph: Glyph) => void;
  }

  let { glyph, format, oncopy }: Props = $props();

  let title = $derived(
    `${glyph.name} (${glyph.codepoint}) — click to copy ${getCopyText(glyph, format)}`,
  );
</script>

<button
  type="button"
  onclick={() => oncopy(glyph)}
  {title}
  class="group relative flex aspect-square select-none flex-col items-center justify-center gap-1 rounded-xl border border-zinc-200 bg-white p-2 text-center shadow-2xs transition hover:border-sky-500 hover:shadow-xs active:scale-[0.96] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-sky-500 [content-visibility:auto] [contain-intrinsic-size:auto_104px]"
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
  <span
    class="absolute right-1.5 top-1.5 text-[11px] opacity-0 transition-opacity group-hover:opacity-100"
    aria-hidden="true">📋</span
  >
</button>
