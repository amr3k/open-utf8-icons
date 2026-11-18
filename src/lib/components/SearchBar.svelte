<script lang="ts">
  /**
   * Instant search input (Phase 3): `/` focuses (wired from the page),
   * `Esc` clears, ✕ gives a touch-friendly clear. Also hosts the quick-copy
   * format pills and a live tabular-nums match count.
   */
  import { COPY_FORMATS, type CopyFormat } from "#lib/copy.js";

  interface Props {
    query?: string;
    copyFormat?: CopyFormat;
    /** Number of glyphs matching the current query + block filter. */
    matchCount?: number;
    /** Number of glyphs in scope before the query is applied. */
    totalCount?: number;
    /** Whether the match count hit the result cap. */
    capped?: boolean;
    /** Whether a query or block filter is active. */
    filtered?: boolean;
    placeholder?: string;
  }

  let {
    query = $bindable(""),
    copyFormat = $bindable("char"),
    matchCount = 0,
    totalCount = 0,
    capped = false,
    filtered = false,
    placeholder = "Search glyphs — name, keyword, or code point",
  }: Props = $props();

  // `bind:this` is deliberate here: the `/` shortcut needs the live input
  // reference to focus imperatively — an attachment cannot replace this.
  let input: HTMLInputElement | null = $state(null);

  function focusSearch() {
    input?.focus();
    input?.select();
  }

  /** `/` focuses this field from anywhere on the page (unless already typing). */
  function handleShortcut(event: KeyboardEvent) {
    if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
    ) {
      return;
    }
    event.preventDefault();
    focusSearch();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      if (query !== "") {
        event.preventDefault();
        query = "";
      } else {
        input?.blur();
      }
    }
  }

  function clear() {
    query = "";
    input?.focus();
  }

  function formatCount(count: number): string {
    return count.toLocaleString("en-US");
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
      {placeholder}
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
    <div
      class="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 p-0.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
      role="group"
      aria-label="Quick copy format"
    >
      {#each COPY_FORMATS as format (format.id)}
        <button
          type="button"
          onclick={() => (copyFormat = format.id)}
          aria-pressed={copyFormat === format.id}
          title={format.hint}
          class="inline-flex items-center justify-center rounded-full px-2.5 py-1 font-medium transition active:scale-[0.96] {copyFormat ===
          format.id
            ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
            : 'hover:text-zinc-900 dark:hover:text-zinc-200'}"
        >
          <span class="tabular-nums">{format.label}</span>
        </button>
      {/each}
    </div>

    <p
      class="text-xs tabular-nums text-zinc-500 dark:text-zinc-400"
      aria-live="polite"
    >
      {#if filtered}
        {formatCount(matchCount)}{#if capped}+{/if}
        <span class="text-zinc-400 dark:text-zinc-500">of</span>
        {formatCount(totalCount)}
      {:else}
        {formatCount(totalCount)} glyphs
      {/if}
    </p>
  </div>
</div>
