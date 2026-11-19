<script lang="ts">
  /**
   * Light / Dark / Auto segmented control. Labels collapse below `lg`;
   * `bare` drops the outer surface so the control can nest inside the
   * header's single grouped control cluster.
   */
  import PillButton from "#lib/components/PillButton.svelte";
  import { theme, type ThemeMode } from "#lib/theme.svelte.js";
  import { PILL_GROUP, PILL_GROUP_BARE } from "#lib/ui.js";

  interface Props {
    class?: string;
    /** Render without its own border/background when nested in a group. */
    bare?: boolean;
  }

  let { class: className = "", bare = false }: Props = $props();

  const MODES: { mode: ThemeMode; icon: string; label: string }[] = [
    { mode: "light", icon: "☀", label: "Light" },
    { mode: "dark", icon: "☾", label: "Dark" },
    { mode: "system", icon: "◑", label: "Auto" },
  ];
</script>

<div
  class="{bare ? PILL_GROUP_BARE : PILL_GROUP} {className}"
  role="group"
  aria-label="Theme"
>
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
      <span class="text-sm leading-none lg:mr-1" aria-hidden="true">{icon}</span>
      <span class="hidden lg:inline">{label}</span>
    </PillButton>
  {/each}
</div>
