/**
 * Shared `fly` parameters for the app's one-shot entrance and exit motions.
 *
 * Every animation collapses to a no-op when the visitor prefers reduced
 * motion. Components read `prefersReducedMotion.current` once and pass the
 * value in, so the same offsets, durations and easing stay in step across the
 * toast stack, the install banner, the offline pill and the inspector.
 */

import type { FlyParams } from "svelte/transition";
import { cubicOut } from "svelte/easing";

/**
 * `fly` parameters for an offset that disappears under reduced motion.
 *
 * Only the axes supplied are moved; the other stays at `0`.
 */
export function flyOffset(
  reducedMotion: boolean,
  offset: { x?: number; y?: number },
  duration: number,
): FlyParams {
  return {
    x: reducedMotion ? 0 : (offset.x ?? 0),
    y: reducedMotion ? 0 : (offset.y ?? 0),
    duration: reducedMotion ? 0 : duration,
    easing: cubicOut,
  };
}
