<script lang="ts">
  import ThemeToggle from "#lib/components/ThemeToggle.svelte";
  import { theme } from "#lib/theme.svelte.js";
</script>

<div class="flex min-h-screen flex-col">
  <header
    class="border-b border-zinc-200 bg-white/80 backdrop-blur-md transition-colors dark:border-zinc-800 dark:bg-zinc-950/80 sticky top-0 z-10"
  >
    <div
      class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6"
    >
      <div class="flex items-center gap-3">
        <a
          href="/"
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-xl font-bold text-sky-400 shadow-xs transition hover:scale-105 active:scale-95 dark:bg-zinc-100 dark:text-sky-600"
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
          class="inline-flex h-8 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-2xs transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          aria-label="View on GitHub"
        >
          <span class="text-sm leading-none" aria-hidden="true">↗</span>
          <span>GitHub</span>
        </a>
      </div>
    </div>
  </header>

  <main
    class="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-12 sm:px-6"
  >
    <div class="mb-10 text-center sm:text-left">
      <h2
        class="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50"
      >
        Discover, preview & copy <br class="hidden sm:inline" />
        <span class="text-sky-600 dark:text-sky-400">native UTF-8</span> glyphs.
      </h2>
      <p class="mt-3 max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
        Zero icon dependencies. Zero SVG bloat. Instant offline client-side
        search across thousands of standard Unicode characters.
      </p>
    </div>

    <div
      class="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-6 dark:border-zinc-800 dark:bg-zinc-900/50"
    >
      <div
        class="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800"
      >
        <div>
          <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Phase 1: Project Scaffolding & Toolchain
          </h3>
          <p class="text-xs text-zinc-500 dark:text-zinc-400">
            Status: Initialized & Verified
          </p>
        </div>
        <span
          class="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
        >
          <span aria-hidden="true">✓</span> Complete
        </span>
      </div>

      <ul
        class="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs text-zinc-600 dark:text-zinc-300"
      >
        <li class="flex items-center gap-2">
          <span class="text-emerald-500 font-bold" aria-hidden="true">✓</span>
          <span>SvelteKit + Svelte 5 (Runes) + TypeScript</span>
        </li>
        <li class="flex items-center gap-2">
          <span class="text-emerald-500 font-bold" aria-hidden="true">✓</span>
          <span>Cloudflare Pages Adapter (@sveltejs/adapter-cloudflare)</span>
        </li>
        <li class="flex items-center gap-2">
          <span class="text-emerald-500 font-bold" aria-hidden="true">✓</span>
          <span>Tailwind CSS v4 with Vite integration</span>
        </li>
        <li class="flex items-center gap-2">
          <span class="text-emerald-500 font-bold" aria-hidden="true">✓</span>
          <span>Theme switching with system auto-detect & persistence</span>
        </li>
        <li class="flex items-center gap-2">
          <span class="text-emerald-500 font-bold" aria-hidden="true">✓</span>
          <span>Bun task scripts (dev, build, check, test)</span>
        </li>
        <li class="flex items-center gap-2">
          <span class="text-emerald-500 font-bold" aria-hidden="true">✓</span>
          <span>Strict Dogfooding: Pure UTF-8 icons only</span>
        </li>
      </ul>
    </div>

    <!-- Phase 2 status -->
    <div
      class="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-6 dark:border-zinc-800 dark:bg-zinc-900/50"
    >
      <div
        class="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800"
      >
        <div>
          <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Phase 2: Unicode Dataset Extraction Pipeline
          </h3>
          <p class="text-xs text-zinc-500 dark:text-zinc-400">
            Status: Extracted &amp; Committed
          </p>
        </div>
        <span
          class="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
        >
          <span aria-hidden="true">✓</span> Complete
        </span>
      </div>

      <ul
        class="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs text-zinc-600 dark:text-zinc-300"
      >
        <li class="flex items-center gap-2">
          <span class="text-emerald-500 font-bold" aria-hidden="true">✓</span>
          <span
            >Bun extraction pipeline with cached UCD downloads (Unicode 16.0.0)</span
          >
        </li>
        <li class="flex items-center gap-2">
          <span class="text-emerald-500 font-bold" aria-hidden="true">✓</span>
          <span>4,021 glyphs across 22 curated blocks + 255 flag emoji</span>
        </li>
        <li class="flex items-center gap-2">
          <span class="text-emerald-500 font-bold" aria-hidden="true">✓</span>
          <span
            >Full metadata: codepoint, decimal, HTML/CSS/JS escapes, keywords</span
          >
        </li>
        <li class="flex items-center gap-2">
          <span class="text-emerald-500 font-bold" aria-hidden="true">✓</span>
          <span>Minified payload: ~1.1 MB raw / ~163 kB gzip</span>
        </li>
      </ul>
    </div>

    <!-- Sampler of UTF-8 glyphs -->
    <div class="mt-8">
      <h4
        class="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3"
      >
        Glyph Dogfooding Preview
      </h4>
      <div class="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-12 gap-2">
        {#each ["ツ", "★", "⚡", "✦", "♥", "✿", "✓", "✕", "☀", "☾", "◑", "→", "←", "↑", "↓", "⇄", "🔍", "📋", "⚙", "∞", "♪", "▲", "▼", "◆"] as char}
          <div
            class="flex aspect-square flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white p-2 text-xl transition-all hover:scale-105 hover:border-sky-500 hover:shadow-xs active:scale-95 dark:border-zinc-800 dark:bg-zinc-900"
            title={char}
          >
            <span aria-hidden="true">{char}</span>
          </div>
        {/each}
      </div>
    </div>
  </main>

  <footer
    class="mt-auto border-t border-zinc-200 bg-zinc-50/50 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400"
  >
    <div class="mx-auto max-w-5xl px-4">
      <p>
        open-utf8-icons — Crafted with native UTF-8 glyphs &bull; Hosted on
        Cloudflare Pages (<a
          href="https://utf8.a3k.me"
          class="underline hover:text-sky-500">utf8.a3k.me</a
        >)
      </p>
    </div>
  </footer>
</div>
