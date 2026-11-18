/**
 * Dataset access layer (Phase 3 of #1).
 *
 * Single import site for the committed Unicode dataset: the page and its
 * components consume the dataset, the precomputed search index, and
 * per-block stats from here, so the 1.5 MB JSON is bundled exactly once.
 */

import iconsJson from "./data/icons.json";
import type { Glyph, IconsDataset } from "./data/types.js";
import { buildSearchEntries, type SearchEntry } from "./search.js";

/** The committed dataset produced by `scripts/generate-icons.ts`. */
export const dataset: IconsDataset = iconsJson;

/** Every glyph, in curated dataset order. */
export const glyphs: readonly Glyph[] = dataset.glyphs;

/** Precomputed search index — build once, share across renders. */
export const searchEntries: readonly SearchEntry[] =
  buildSearchEntries(dataset.glyphs);

/** Name and glyph count of one browsing category (Unicode block). */
export interface BlockStat {
  block: string;
  count: number;
}

/** Blocks in first-appearance (curated dataset) order. */
export const blockStats: readonly BlockStat[] = (() => {
  const counts = new Map<string, number>();
  for (const glyph of dataset.glyphs) {
    counts.set(glyph.block, (counts.get(glyph.block) ?? 0) + 1);
  }
  return [...counts.entries()].map(([block, count]) => ({ block, count }));
})();

/**
 * Hard cap on rendered search results. The dataset tops out at ~4k glyphs,
 * so this only kicks in for broad codepoint-prefix queries; the grid then
 * asks the user to refine the query instead of flooding the DOM.
 */
export const RESULT_LIMIT = 500;
