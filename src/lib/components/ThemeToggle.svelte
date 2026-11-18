<script lang="ts">
  import { theme, getThemeIcon, type ThemeMode } from "#lib/theme.svelte.js";

  interface Props {
    class?: string;
  }

  let { class: className = "" }: Props = $props();

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      theme.toggle();
    }
  }
</script>

<div
  class="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 p-0.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 {className}"
>
  <button
    type="button"
    onclick={() => theme.setMode("light")}
    class="inline-flex items-center justify-center rounded-full px-2 py-1 font-medium transition-all {theme.mode ===
    'light'
      ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
      : 'hover:text-zinc-900 dark:hover:text-zinc-200'}"
    aria-label="Light mode"
    title="Switch to Light mode"
  >
    <span class="mr-1 text-sm leading-none" aria-hidden="true">☀</span>
    <span>Light</span>
  </button>
  <button
    type="button"
    onclick={() => theme.setMode("dark")}
    class="inline-flex items-center justify-center rounded-full px-2 py-1 font-medium transition-all {theme.mode ===
    'dark'
      ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
      : 'hover:text-zinc-900 dark:hover:text-zinc-200'}"
    aria-label="Dark mode"
    title="Switch to Dark mode"
  >
    <span class="mr-1 text-sm leading-none" aria-hidden="true">☾</span>
    <span>Dark</span>
  </button>
  <button
    type="button"
    onclick={() => theme.setMode("system")}
    class="inline-flex items-center justify-center rounded-full px-2 py-1 font-medium transition-all {theme.mode ===
    'system'
      ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
      : 'hover:text-zinc-900 dark:hover:text-zinc-200'}"
    aria-label="System preference theme"
    title="Follow system preference"
  >
    <span class="mr-1 text-sm leading-none" aria-hidden="true">◑</span>
    <span>Auto</span>
  </button>
</div>
