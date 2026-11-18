/**
 * Shared Tailwind class tokens for the pill-style controls used across the
 * directory UI. Plain strings keep the markup declarative while guaranteeing
 * every control renders identical active/inactive states.
 */

/** Outer container of a segmented pill group (theme toggle, copy format). */
export const PILL_GROUP =
  "inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 p-0.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400";

/** A button inside a segmented pill group. */
export const PILL_BUTTON =
  "inline-flex items-center justify-center rounded-full px-2.5 py-1 font-medium transition active:scale-[0.96]";

/** Selected state inside a segmented pill group. */
export const PILL_ACTIVE =
  "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100";

/** Unselected state inside a segmented pill group. */
export const PILL_INACTIVE = "hover:text-zinc-900 dark:hover:text-zinc-200";

/** Standalone filter chip (block browser). */
export const CHIP_BASE =
  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 font-medium transition active:scale-[0.96]";

/** Selected filter chip. */
export const CHIP_ACTIVE =
  "border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900";

/** Unselected filter chip. */
export const CHIP_INACTIVE =
  "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100";
