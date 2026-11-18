<script lang="ts">
  /**
   * Glyph inspector (Phase 4): a slide-over dialog with a high-contrast
   * preview, a cross-font rendering grid, every developer copy format, and
   * the Unicode technical attributes. Native `<dialog>` supplies the modal
   * behaviour, focus trap, Esc handling and focus restoration for free.
   */
  import type { Glyph } from "#lib/data/types.js";
  import { CATEGORY_LABELS } from "#lib/data/types.js";
  import {
    DEVELOPER_FORMATS,
    getCopyText,
    type DeveloperFormat,
  } from "#lib/copy.js";

  interface Props {
    /** Glyph to inspect; `null` keeps the dialog closed. */
    glyph: Glyph | null;
    /** Whether the active glyph is favorited. */
    favorite: boolean;
    onclose: () => void;
    oncopy: (glyph: Glyph, format: DeveloperFormat) => void;
    onfavorite: (glyph: Glyph) => void;
  }

  let { glyph, favorite, onclose, oncopy, onfavorite }: Props = $props();

  /** Font stacks for the cross-font rendering test grid. */
  const FONT_STACKS: { id: string; label: string; stack: string }[] = [
    {
      id: "system",
      label: "System UI",
      stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    },
    {
      id: "sans",
      label: "Sans-Serif",
      stack: 'Arial, Helvetica, "Liberation Sans", sans-serif',
    },
    {
      id: "serif",
      label: "Serif",
      stack: 'Georgia, "Times New Roman", "Liberation Serif", serif',
    },
    {
      id: "mono",
      label: "Monospace",
      stack:
        'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
    },
  ];

  let dialogEl = $state<HTMLDialogElement | null>(null);

  // Keep the native dialog's open state in sync with the selected glyph.
  $effect(() => {
    const el = dialogEl;
    if (el === null) return;
    if (glyph !== null && !el.open) {
      el.showModal();
    } else if (glyph === null && el.open) {
      el.close();
    }
  });

  // Modal dialogs don't lock background scrolling by themselves.
  $effect(() => {
    if (glyph === null) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  });

  /** Clicking the dimmed backdrop (the dialog box itself) closes the panel. */
  function handleDialogClick(event: MouseEvent) {
    if (event.target === dialogEl) onclose();
  }

  function categoryLabel(category: string): string {
    return CATEGORY_LABELS[category] ?? category;
  }
</script>

<dialog
  bind:this={dialogEl}
  onclose={onclose}
  onclick={handleDialogClick}
  aria-labelledby="glyph-inspector-title"
  class="m-0 ml-auto h-dvh max-h-none w-full max-w-lg overflow-hidden border border-zinc-200 bg-white p-0 text-zinc-900 shadow-2xl backdrop:bg-zinc-950/60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
>
  {#if glyph}
    <div class="flex h-full flex-col">
      <header
        class="flex items-start justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800"
      >
        <div class="min-w-0">
          <p
            class="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
          >
            Glyph inspector
          </p>
          <h2
            id="glyph-inspector-title"
            class="mt-0.5 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50"
          >
            {glyph.name}
          </h2>
          <p class="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
            {glyph.codepoint}
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onclick={() => onfavorite(glyph)}
            aria-pressed={favorite}
            aria-label={favorite
              ? `Remove ${glyph.name} from favorites`
              : `Add ${glyph.name} to favorites`}
            title={favorite ? "Remove from favorites" : "Add to favorites"}
            class="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-base leading-none text-zinc-500 transition hover:text-amber-500 active:scale-[0.96] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
          >
            <span aria-hidden="true">{favorite ? "★" : "☆"}</span>
          </button>
          <button
            type="button"
            onclick={onclose}
            aria-label="Close glyph inspector"
            title="Close (Esc)"
            class="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-sm leading-none text-zinc-500 transition hover:text-zinc-900 active:scale-[0.96] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto px-4 py-4">
        <div
          class="flex min-h-36 items-center justify-center rounded-2xl border border-zinc-900 bg-zinc-950 px-4 py-10 dark:border-zinc-100 dark:bg-zinc-100"
        >
          <span
            class="select-all text-7xl leading-none text-zinc-50 dark:text-zinc-950"
            aria-hidden="true">{glyph.char}</span
          >
          <span class="sr-only">Preview of {glyph.name}</span>
        </div>

        <section class="mt-5" aria-labelledby="font-grid-title">
          <h3
            id="font-grid-title"
            class="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
          >
            Cross-font rendering
          </h3>
          <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {#each FONT_STACKS as font (font.id)}
              <figure
                class="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 py-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span
                  class="text-3xl leading-none"
                  style:font-family={font.stack}
                  aria-hidden="true">{glyph.char}</span
                >
                <figcaption
                  class="text-[10px] font-medium text-zinc-500 dark:text-zinc-400"
                >
                  {font.label}
                </figcaption>
              </figure>
            {/each}
          </div>
        </section>

        <section class="mt-5" aria-labelledby="copy-formats-title">
          <div class="flex items-baseline justify-between gap-2">
            <h3
              id="copy-formats-title"
              class="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
            >
              Developer formats
            </h3>
            <span class="text-[10px] text-zinc-400 dark:text-zinc-500"
              >click to copy</span
            >
          </div>
          <ul
            class="mt-2 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800"
          >
            {#each DEVELOPER_FORMATS as format (format.id)}
              <li>
                <button
                  type="button"
                  onclick={() => oncopy(glyph, format.id)}
                  aria-label={`Copy ${format.label} for ${glyph.name}`}
                  title={format.hint}
                  class="group flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition hover:bg-zinc-50 active:bg-zinc-100 dark:hover:bg-zinc-900 dark:active:bg-zinc-800"
                >
                  <span class="min-w-0">
                    <span
                      class="block text-[10px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500"
                    >
                      {format.label}
                    </span>
                    <span
                      class="block truncate font-mono text-xs text-zinc-800 dark:text-zinc-200"
                    >
                      {getCopyText(glyph, format.id)}
                    </span>
                  </span>
                  <span
                    class="shrink-0 text-[11px] font-medium text-zinc-400 transition group-hover:text-sky-600 dark:text-zinc-500 dark:group-hover:text-sky-400"
                  >
                    <span aria-hidden="true">📋</span>
                    <span class="sr-only">Copy</span>
                  </span>
                </button>
              </li>
            {/each}
          </ul>
        </section>

        <section class="mt-5" aria-labelledby="attributes-title">
          <h3
            id="attributes-title"
            class="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
          >
            Unicode attributes
          </h3>
          <dl
            class="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-xl border border-zinc-200 px-3 py-3 text-xs dark:border-zinc-800"
          >
            <dt class="text-zinc-500 dark:text-zinc-400">Category</dt>
            <dd class="text-right text-zinc-800 dark:text-zinc-200">
              <span class="font-mono">{glyph.category}</span>
              <span class="text-zinc-400 dark:text-zinc-500"
                >· {categoryLabel(glyph.category)}</span
              >
            </dd>

            <dt class="text-zinc-500 dark:text-zinc-400">Block</dt>
            <dd class="text-right text-zinc-800 dark:text-zinc-200">
              {glyph.block}
            </dd>

            <dt class="text-zinc-500 dark:text-zinc-400">Script</dt>
            <dd class="text-right text-zinc-800 dark:text-zinc-200">
              {glyph.script}
            </dd>

            <dt class="text-zinc-500 dark:text-zinc-400">Decimal</dt>
            <dd
              class="text-right font-mono tabular-nums text-zinc-800 dark:text-zinc-200"
            >
              {glyph.dec}
            </dd>

            <dt class="text-zinc-500 dark:text-zinc-400">Hex</dt>
            <dd
              class="text-right font-mono text-zinc-800 dark:text-zinc-200"
            >
              {glyph.hex}
            </dd>
          </dl>
        </section>
      </div>

      <footer
        class="border-t border-zinc-200 px-4 py-2.5 text-[10px] text-zinc-400 dark:border-zinc-800 dark:text-zinc-500"
      >
        Favorites &amp; recent copies are stored locally in your browser.
      </footer>
    </div>
  {/if}
</dialog>
