<script lang="ts">
  /**
   * Responsive sticky header (Phase 3): ツ logo, title, theme toggle, and a
   * repository link — every control is a native UTF-8 glyph, no SVGs.
   */
  import ThemeToggle from "#lib/components/ThemeToggle.svelte";
</script>

<header
  class="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-md transition-colors dark:border-zinc-800 dark:bg-zinc-950/80"
>
  <div
    class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6"
  >
    <div class="flex items-center gap-3">
      <a
        href="/"
        class="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-xl font-bold text-sky-400 shadow-xs transition hover:scale-105 active:scale-[0.96] dark:bg-zinc-100 dark:text-sky-600"
        aria-label="open-utf8-icons homepage"
      >
        <span aria-hidden="true">ツ</span>
      </a>
      <div>
        <div class="flex items-center gap-2">
          <h1
            class="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            open-utf8-icons
          </h1>
          <span
            class="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-600 dark:text-sky-400"
            >v0.1.0</span
          >
        </div>
        <p class="text-xs text-zinc-500 dark:text-zinc-400">utf8.a3k.me</p>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <ThemeToggle />
      <a
        href="https://github.com/amr3k/open-utf8-icons"
        target="_blank"
        rel="noreferrer"
        class="inline-flex h-8 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-2xs transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 active:scale-[0.96] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        aria-label="View on GitHub"
      >
        <span class="text-sm leading-none" aria-hidden="true">↗</span>
        <span>GitHub</span>
      </a>
    </div>
  </div>
</header>
