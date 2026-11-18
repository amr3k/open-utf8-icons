<script lang="ts">
  /**
   * One button inside a segmented pill control.
   *
   * The theme toggle, the quick-copy formats and the collection switcher all
   * render the same active/inactive states and `aria-pressed` semantics; this
   * keeps those in one place while each caller owns its own inner content
   * (glyph, label, count). The group wrapper stays a plain element with
   * `PILL_GROUP` because the three groups differ in layout only.
   */
  import type { Snippet } from "svelte";
  import { PILL_ACTIVE, PILL_BUTTON, PILL_INACTIVE } from "#lib/ui.js";

  interface Props {
    /** Whether this button represents the group's current value. */
    active: boolean;
    onclick: () => void;
    /** Tooltip text, when the label alone is not self-explanatory. */
    title?: string;
    /** Overrides the visible text for assistive technology. */
    ariaLabel?: string;
    children: Snippet;
  }

  let { active, onclick, title, ariaLabel, children }: Props = $props();
</script>

<button
  type="button"
  {onclick}
  {title}
  aria-label={ariaLabel}
  aria-pressed={active}
  class="{PILL_BUTTON} {active ? PILL_ACTIVE : PILL_INACTIVE}"
>
  {@render children()}
</button>
