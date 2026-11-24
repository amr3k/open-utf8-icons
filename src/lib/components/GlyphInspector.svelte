<script lang="ts">
  /**
   * Glyph inspector (Phase 4): a slide-over dialog with a high-contrast
   * preview, a cross-font rendering grid, every developer copy format, and
   * the Unicode technical attributes. Native `<dialog>` supplies the modal
   * behaviour, focus trap, Esc handling and focus restoration for free.
   *
   * The drawer keeps rendering the last glyph through its exit transition,
   * then hands control back to the native dialog, so closing feels as
   * deliberate as opening.
   */
  import type { Glyph } from "#lib/data/types.js";
  import { CATEGORY_LABELS } from "#lib/data/types.js";
  import {
    DEVELOPER_FORMATS,
    getCopyText,
    type DeveloperFormat,
  } from "#lib/copy.js";
  import { flyOffset } from "#lib/motion.js";
  import { prefersReducedMotion } from "svelte/motion";
  import { fade, fly } from "svelte/transition";

  interface Props {
    /** Glyph to inspect; `null` keeps the dialog closed. */
    glyph: Glyph | null;
    /** Whether the active glyph is favorited. */
    favorite: boolean;
    onclose: () => void;
    oncopy: (glyph: Glyph, format: DeveloperFormat) => void;
    onfavorite: (glyph: Glyph) => void;
  }

  let {
    glyph: selectedGlyph,
    favorite,
    onclose,
    oncopy,
    onfavorite,
  }: Props = $props();

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

  const PANEL_MS = 240;
  const SCRIM_MS = 200;

  let dialogEl = $state<HTMLDialogElement | null>(null);
  /** Glyph rendered in the drawer — retained through the exit animation. */
  let glyph = $state<Glyph | null>(null);
  /** Favorite state for the rendered glyph, retained with it. */
  let isFavorite = $state(false);
  /** Whether the drawer contents are mounted and visible. */
  let open = $state(false);

  const reducedMotion = $derived(prefersReducedMotion.current);

  // Keep the native dialog's open state in sync with the selected glyph.
  $effect(() => {
    const el = dialogEl;
    if (el === null) return;

    if (selectedGlyph !== null) {
      glyph = selectedGlyph;
      isFavorite = favorite;
      if (!el.open) el.showModal();
      open = true;
    } else {
      // The panel plays its outro first; `handleOutroEnd` closes the dialog.
      open = false;
    }
  });

  // Modal dialogs don't lock background scrolling by themselves.
  $effect(() => {
    if (selectedGlyph === null) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  });

  /** Whether the current press started on the dimmed backdrop. */
  let pressedBackdrop = false;

  /** Close through the exit transition instead of hiding the dialog at once. */
  function requestClose() {
    onclose();
  }

  /** Esc is cancelable; prevent the native snap-close and animate instead. */
  function handleCancel(event: Event) {
    event.preventDefault();
    requestClose();
  }

  function handleDialogPointerDown(event: PointerEvent) {
    pressedBackdrop = event.target === dialogEl;
  }

  /**
   * Only a press that both starts and ends on the backdrop closes the panel,
   * so dragging a selection out of the preview doesn't dismiss it.
   */
  function handleDialogClick(event: MouseEvent) {
    if (pressedBackdrop && event.target === dialogEl) requestClose();
    pressedBackdrop = false;
  }

  /** End of the panel outro: now it is safe to hide the top-layer dialog. */
  function handleOutroEnd() {
    if (open || selectedGlyph !== null) return;
    dialogEl?.close();
  }

  /** A native close (outside our flow) should still clear the selection. */
  function handleNativeClose() {
    if (selectedGlyph !== null) onclose();
  }

  function categoryLabel(category: string): string {
    return CATEGORY_LABELS[category] ?? category;
  }
</script>

<dialog
  bind:this={dialogEl}
  oncancel={handleCancel}
  onclose={handleNativeClose}
  onpointerdown={handleDialogPointerDown}
  onclick={handleDialogClick}
  aria-labelledby="glyph-inspector-title"
  class="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-zinc-900"
>
  {#if open && glyph !== null}
    {@const activeGlyph = glyph}
    <!-- Pointer-transparent scrim: the click still lands on the dialog. -->
    <div
      class="pointer-events-none absolute inset-0 bg-zinc-950/60"
      transition:fade={{ duration: reducedMotion ? 0 : SCRIM_MS }}
    ></div>

    <div
      class="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col overflow-hidden border-l border-zinc-200 bg-white shadow-2xl sm:rounded-l-[1.75rem] dark:border-zinc-800 dark:bg-zinc-950"
      transition:fly={flyOffset(reducedMotion, { x: 48 }, PANEL_MS)}
      onoutroend={handleOutroEnd}
    >
      <!-- Plain <div>: a <header> inside a dialog is exposed as a second
           banner landmark, duplicating the site header. -->
      <div
        class="flex items-start justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800"
      >
        <div class="min-w-0">
          <p
            class="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
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

        <div class="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onclick={() => onfavorite(activeGlyph)}
            aria-pressed={isFavorite}
            aria-label={isFavorite
              ? `Remove ${glyph.name} from favorites`
              : `Add ${glyph.name} to favorites`}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            class="relative flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-base leading-none text-zinc-500 transition-colors after:absolute after:-inset-1 after:content-[''] hover:border-amber-300 hover:text-amber-500 active:scale-[0.96] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-amber-700"
          >
            <span aria-hidden="true">{isFavorite ? "★" : "☆"}</span>
          </button>
          <button
            type="button"
            onclick={requestClose}
            aria-label="Close glyph inspector"
            title="Close (Esc)"
            class="relative flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-sm leading-none text-zinc-500 transition-colors after:absolute after:-inset-1 after:content-[''] hover:border-zinc-300 hover:text-zinc-900 active:scale-[0.96] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
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
            class="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
          >
            Cross-font rendering
          </h3>
          <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {#each FONT_STACKS as font (font.id)}
              <figure
                class="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 py-3 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
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
              class="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
            >
              Developer formats
            </h3>
            <span class="text-[10px] text-zinc-500 dark:text-zinc-400"
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
                  onclick={() => oncopy(activeGlyph, format.id)}
                  title={format.hint}
                  class="group flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-zinc-50 active:bg-zinc-100 dark:hover:bg-zinc-900 dark:active:bg-zinc-800"
                >
                  <span class="min-w-0">
                    <span
                      class="block text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
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
                    class="shrink-0 text-[11px] font-medium text-zinc-500 transition-colors group-hover:text-sky-600 dark:text-zinc-400 dark:group-hover:text-sky-400"
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
            class="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
          >
            Unicode attributes
          </h3>
          <dl
            class="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-xl border border-zinc-200 px-3 py-3 text-xs dark:border-zinc-800"
          >
            <dt class="text-zinc-500 dark:text-zinc-400">Category</dt>
            <dd class="text-right text-zinc-800 dark:text-zinc-200">
              <span class="font-mono">{glyph.category}</span>
              <span class="text-zinc-500 dark:text-zinc-400"
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
              class="text-right font-mono tabular-nums text-zinc-800 dark:text-zinc-200"
            >
              {glyph.hex}
            </dd>
          </dl>
        </section>
      </div>

      <!-- Plain <div>: a <footer> inside a dialog is exposed as a second
           contentinfo landmark, duplicating the site footer. -->
      <div
        class="border-t border-zinc-200 px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] text-[10px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
      >
        Favorites &amp; recent copies are stored locally in your browser.
      </div>
    </div>
  {/if}
</dialog>
