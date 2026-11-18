<script lang="ts">
  import { theme } from "#lib/theme.svelte.js";

  interface Props {
    class?: string;
  }

  let { class: className = "" }: Props = $props();
</script>

<div
  class="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 p-0.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 {className}"
  role="group"
  aria-label="Theme"
>
  <button
    type="button"
    onclick={() => theme.setMode("light")}
    class="inline-flex items-center justify-center rounded-full px-2.5 py-1 font-medium transition {theme.mode ===
    'light'
      ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
      : 'hover:text-zinc-900 dark:hover:text-zinc-200'}"
    aria-label="Light mode"
    aria-pressed={theme.mode === "light"}
    title="Switch to Light mode"
  >
    <span class="text-sm leading-none sm:mr-1" aria-hidden="true">☀</span><span
      class="hidden sm:inline">Light</span
    >
  </button>
  <button
    type="button"
    onclick={() => theme.setMode("dark")}
    class="inline-flex items-center justify-center rounded-full px-2.5 py-1 font-medium transition {theme.mode ===
    'dark'
      ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
      : 'hover:text-zinc-900 dark:hover:text-zinc-200'}"
    aria-label="Dark mode"
    aria-pressed={theme.mode === "dark"}
    title="Switch to Dark mode"
  >
    <span class="text-sm leading-none sm:mr-1" aria-hidden="true">☾</span><span
      class="hidden sm:inline">Dark</span
    >
  </button>
  <button
    type="button"
    onclick={() => theme.setMode("system")}
    class="inline-flex items-center justify-center rounded-full px-2.5 py-1 font-medium transition {theme.mode ===
    'system'
      ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
      : 'hover:text-zinc-900 dark:hover:text-zinc-200'}"
    aria-label="System preference theme"
    aria-pressed={theme.mode === "system"}
    title="Follow system preference"
  >
    <span class="text-sm leading-none sm:mr-1" aria-hidden="true">◑</span><span
      class="hidden sm:inline">Auto</span
    >
  </button>
</div>
