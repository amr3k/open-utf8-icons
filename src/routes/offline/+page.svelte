<script lang="ts">
  /**
   * Prerendered offline fallback (Phase 5 of #1). The service worker serves
   * this page when a navigation has no cached shell and the network is down.
   * Once the shell is cached, the directory itself runs fully offline.
   */
  function reload() {
    location.reload();
  }
</script>

<svelte:head>
  <title>Offline — Open UTF-8 icons</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main
  class="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-4 py-16 sm:px-6"
>
  <div
    class="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white px-6 py-10 text-center shadow-xs sm:px-10 dark:border-zinc-800 dark:bg-zinc-900"
  >
    <div
      class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 text-3xl font-bold leading-none text-sky-400 shadow-sm dark:bg-zinc-100 dark:text-sky-600"
      aria-hidden="true"
    >
      ツ
    </div>

    <h2
      class="mt-6 text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50"
    >
      You're offline
    </h2>
    <p class="mx-auto mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
      The connection dropped before the app shell was cached. Reconnect and
      reload once — after that, every glyph, search, inspect and copy action
      works offline.
    </p>

    <div
      class="mt-6 flex flex-col items-stretch justify-center gap-2 sm:flex-row"
    >
      <button
        type="button"
        onclick={reload}
        class="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none active:scale-[0.96] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-900"
      >
        <span class="text-base leading-none" aria-hidden="true">↻</span>
        <span>Try again</span>
      </button>

      <a
        href="/"
        class="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none active:scale-[0.96] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 dark:focus-visible:ring-offset-zinc-900"
      >
        <span class="text-base leading-none" aria-hidden="true">←</span>
        <span>Back to directory</span>
      </a>
    </div>

    <p
      class="mt-6 border-t border-zinc-100 pt-4 text-xs leading-relaxed text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
    >
      Tip: install Open UTF-8 icons from your browser menu — or tap Share then
      Add to Home Screen on iOS — so the directory stays one tap away next time.
    </p>
  </div>
</main>
