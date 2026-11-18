<script lang="ts">
  /**
   * Light / Dark / Auto segmented control. Labels collapse to glyph-only on
   * small screens; every state exposes aria-pressed and a descriptive label.
   */
  import PillButton from "#lib/components/PillButton.svelte";
  import { theme, type ThemeMode } from "#lib/theme.svelte.js";
  import { PILL_GROUP } from "#lib/ui.js";

  interface Props {
    class?: string;
  }

  let { class: className = "" }: Props = $props();

  const MODES: { mode: ThemeMode; icon: string; label: string }[] = [
    { mode: "light", icon: "☀", label: "Light" },
    { mode: "dark", icon: "☾", label: "Dark" },
    { mode: "system", icon: "◑", label: "Auto" },
  ];
</script>

<div class="{PILL_GROUP} {className}" role="group" aria-label="Theme">
  {#each MODES as { mode, icon, label } (mode)}
    <PillButton
      active={theme.mode === mode}
      onclick={() => theme.setMode(mode)}
      ariaLabel={mode === "system"
        ? "System preference theme"
        : `${label} mode`}
      title={mode === "system"
        ? "Follow system preference"
        : `Switch to ${label} mode`}
    >
      <span class="text-sm leading-none sm:mr-1" aria-hidden="true">{icon}</span>
      <span class="hidden sm:inline">{label}</span>
    </PillButton>
  {/each}
</div>
