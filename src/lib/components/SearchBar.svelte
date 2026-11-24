<script lang="ts">
  /**
   * Unified search + quick-copy toolbar. `/` focuses from anywhere, `Esc`
   * clears outside a modal dialog, ✕ gives a touch-friendly clear. The
   * footer row hosts the page-supplied collection switcher, the quick-copy
   * formats, and a live tabular-nums match count — all in one surface.
   */
  import type { Snippet } from "svelte";
  import { COPY_FORMATS, type CopyFormat } from "#lib/copy.js";
  import PillButton from "#lib/components/PillButton.svelte";
  import { formatCount } from "#lib/format.js";
  import type { SearchStatus } from "#lib/search.js";
  import { PILL_GROUP } from "#lib/ui.js";

  interface Props {
    query?: string;
    copyFormat?: CopyFormat;
    status?: SearchStatus;
    /** Collection switcher (and any contextual actions) from the page. */
    actions?: Snippet;
  }

  let {
    query = $bindable(""),
    copyFormat = $bindable("char"),
    status = { matchCount: 0, totalCount: 0, filtersActive: false },
    actions,
  }: Props = $props();

  let input: HTMLInputElement | null = $state(null);

  function focusSearch() {
    input?.focus();
    input?.select();
  }

  function handleShortcut(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const target = event.target;
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

<section
  class="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(9,9,11,0.04),0_8px_24px_-16px_rgba(9,9,11,0.18)] transition-[border-color,box-shadow] duration-150 has-[:focus-visible]:border-sky-500/60 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sky-500/15 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
  aria-label="Search and quick-copy controls"
>
  <div class="flex items-center gap-3 px-4 py-3 sm:px-5">
    <span
      class="pointer-events-none text-lg leading-none text-zinc-400 dark:text-zinc-500"
      aria-hidden="true">⌕</span
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
      class="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-500 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:[&::-webkit-search-cancel-button]:hidden"
    />
    <div class="flex shrink-0 items-center">
      {#if query !== ""}
        <button
          type="button"
          onclick={clear}
          class="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-[transform,color,background-color] duration-150 ease-out hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.96] dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          aria-label="Clear search"
        >
          <span class="text-sm leading-none" aria-hidden="true">✕</span>
        </button>
      {:else}
        <kbd
          class="hidden h-6 min-w-6 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 px-1.5 text-[10px] font-medium text-zinc-500 sm:inline-flex dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
          aria-hidden="true">/</kbd
        >
      {/if}
    </div>
  </div>

  <div
    class="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-zinc-100 bg-zinc-50/60 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/30"
  >
    <div class="flex min-w-0 flex-wrap items-center gap-2">
      {#if actions}
        {@render actions()}
      {/if}
    </div>

    <div class="flex items-center gap-2.5">
      <span
        class="hidden text-[11px] font-medium uppercase tracking-wider text-zinc-500 sm:inline dark:text-zinc-400"
        >Copy as</span
      >
      <div class={PILL_GROUP} role="group" aria-label="Quick copy format">
        {#each COPY_FORMATS as format (format.id)}
          <PillButton
            active={copyFormat === format.id}
            onclick={() => (copyFormat = format.id)}
            title={format.hint}
          >
            <span class="tabular-nums">{format.label}</span>
          </PillButton>
        {/each}
      </div>

      {#if status.filtersActive}
        <p
          class="whitespace-nowrap text-xs tabular-nums text-zinc-500 dark:text-zinc-400"
          aria-live="polite"
        >
          {formatCount(status.matchCount)}
          <span class="text-zinc-500 dark:text-zinc-400">/</span>
          {formatCount(status.totalCount)}
        </p>
      {:else}
        <p
          class="hidden whitespace-nowrap text-xs tabular-nums text-zinc-500 sm:block dark:text-zinc-400"
          aria-live="polite"
        >
          {formatCount(status.totalCount)} glyphs
        </p>
      {/if}
    </div>
  </div>
</section>
