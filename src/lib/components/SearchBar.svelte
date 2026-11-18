<script lang="ts">
  /**
   * Instant search input (Phase 3): `/` focuses from anywhere, `Esc` clears
   * from anywhere outside a modal dialog, ✕ gives a touch-friendly clear.
   * Also hosts the quick-copy format pills and a live tabular-nums match
   * count.
   */
  import { COPY_FORMATS, type CopyFormat } from "#lib/copy.js";
  import { formatCount } from "#lib/format.js";
  import type { SearchStatus } from "#lib/search.js";
  import {
    PILL_ACTIVE,
    PILL_BUTTON,
    PILL_GROUP,
    PILL_INACTIVE,
  } from "#lib/ui.js";

  interface Props {
    query?: string;
    copyFormat?: CopyFormat;
    status?: SearchStatus;
  }

  let {
    query = $bindable(""),
    copyFormat = $bindable("char"),
    status = { matchCount: 0, totalCount: 0, filtersActive: false },
  }: Props = $props();

  // `bind:this` is deliberate here: the `/` shortcut needs the live input
  // reference to focus imperatively — an attachment cannot replace this.
  let input: HTMLInputElement | null = $state(null);

  function focusSearch() {
    input?.focus();
    input?.select();
  }

  /**
   * Window-level shortcuts: `/` focuses the field (unless the user is
   * already typing somewhere), `Esc` clears the query — including after
   * clicking a glyph or a filter chip. Both are suspended whenever a modal
   * dialog owns the keyboard.
   */
  function handleShortcut(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const target = event.target;
    // A modal dialog (the glyph inspector) owns the keyboard: Esc must close
    // the panel instead of clearing the search behind it.
    if (target instanceof Element && target.closest("dialog[open]") !== null) {
      return;
    }

    if (event.key === "/") {
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }
      event.preventDefault();
      focusSearch();
      return;
    }

    if (event.key === "Escape" && query !== "") {
      event.preventDefault();
      query = "";
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    // The window handler clears a non-empty query; this local handler adds
    // the blur-on-empty behaviour while the input itself is focused.
    if (event.key === "Escape" && query === "") {
      input?.blur();
    }
  }

  function clear() {
    query = "";
    input?.focus();
  }
</script>

<svelte:window onkeydown={handleShortcut} />

<div class="flex flex-col gap-3">
  <div class="relative">
    <span
      class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-zinc-400 dark:text-zinc-500"
      aria-hidden="true">🔍</span
    >
    <input
      bind:this={input}
      bind:value={query}
      onkeydown={handleKeydown}
      type="search"
      inputmode="search"
      spellcheck="false"
      autocomplete="off"
      placeholder="Search glyphs — name, keyword, or code point"
      aria-label="Search glyphs by name, keyword, or code point"
      aria-keyshortcuts="/"
      class="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-14 text-sm text-zinc-900 shadow-2xs outline-none transition placeholder:text-zinc-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:[&::-webkit-search-cancel-button]:hidden"
    />
    <div class="absolute right-3 top-1/2 -translate-y-1/2">
      {#if query !== ""}
        <button
          type="button"
          onclick={clear}
          class="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 active:scale-[0.96] dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label="Clear search"
        >
          <span class="text-sm leading-none" aria-hidden="true">✕</span>
        </button>
      {:else}
        <kbd
          class="hidden h-6 min-w-6 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 px-1.5 text-[10px] font-medium text-zinc-400 sm:inline-flex dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500"
          aria-hidden="true">/</kbd
        >
      {/if}
    </div>
  </div>

  <div class="flex flex-wrap items-center justify-between gap-2">
    <div class={PILL_GROUP} role="group" aria-label="Quick copy format">
      {#each COPY_FORMATS as format (format.id)}
        <button
          type="button"
          onclick={() => (copyFormat = format.id)}
          aria-pressed={copyFormat === format.id}
          title={format.hint}
          class="{PILL_BUTTON} {copyFormat === format.id
            ? PILL_ACTIVE
            : PILL_INACTIVE}"
        >
          <span class="tabular-nums">{format.label}</span>
        </button>
      {/each}
    </div>

    <p
      class="text-xs tabular-nums text-zinc-500 dark:text-zinc-400"
      aria-live="polite"
    >
      {#if status.filtersActive}
        {formatCount(status.matchCount)}
        <span class="text-zinc-400 dark:text-zinc-500">of</span>
        {formatCount(status.totalCount)}
      {:else}
        {formatCount(status.totalCount)} glyphs
      {/if}
    </p>
  </div>
</div>
