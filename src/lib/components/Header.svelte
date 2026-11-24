<script lang="ts">
  /**
   * Responsive sticky header: ツ logo, wordmark, and one compact grouped
   * control cluster holding the theme modes and the repository link.
   * Every control is a native UTF-8 glyph — no SVGs, no icon libraries.
   */
  import ThemeToggle from "#lib/components/ThemeToggle.svelte";
</script>

<header
  class="sticky top-0 z-10 border-b border-zinc-200/80 bg-white/85 backdrop-blur-xl transition-colors dark:border-zinc-800/80 dark:bg-zinc-950/85"
>
  <div
    class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6"
  >
    <a href="/" class="group flex items-center gap-2.5 rounded-xl">
      <span
        class="flex h-9 w-9 items-center justify-center rounded-[10px] bg-zinc-900 text-lg font-bold text-sky-400 shadow-[0_1px_2px_rgba(9,9,11,0.18)] transition-transform duration-150 ease-out group-active:scale-[0.96] dark:bg-zinc-100 dark:text-sky-600"
        aria-hidden="true">ツ</span
      >
      <span class="flex flex-col leading-none">
        <span class="flex items-center gap-1.5">
          <span
            class="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
            >Open UTF-8 icons</span
          >
          <span
            class="rounded-full bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-sky-700 dark:text-sky-300"
            >v0.1.0</span
          >
        </span>
        <span class="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400"
          >utf8.a3k.me</span
        >
      </span>
      <span class="sr-only"> homepage</span>
    </a>

    <div
      class="flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100/80 p-0.5 dark:border-zinc-800 dark:bg-zinc-900/80"
    >
      <ThemeToggle bare />
      <span
        class="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-700"
        aria-hidden="true"
      ></span>
      <a
        href="https://github.com/amr3k/open-utf8-icons"
        target="_blank"
        rel="noreferrer"
        class="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-zinc-600 transition-[transform,color,background-color] duration-150 ease-out hover:bg-white hover:text-zinc-900 active:scale-[0.96] dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        aria-label="View on GitHub"
      >
        <span class="text-sm leading-none" aria-hidden="true">↗</span>
        <span class="hidden lg:inline">GitHub</span>
      </a>
    </div>
  </div>
</header>
