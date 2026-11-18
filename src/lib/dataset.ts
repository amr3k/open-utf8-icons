/**
 * Dataset access layer (Phases 3 & 4 of #1).
 *
 * Single import site for the committed Unicode dataset: the page and its
 * components consume the dataset, the precomputed search index, code point
 * lookups for persisted collections, and per-block stats from here, so the
 * JSON is bundled exactly once.
 */

import iconsJson from "./data/icons.json";
import type { Glyph, IconsDataset } from "./data/types.js";
import { glyphHash, parseGlyphHash } from "./permalink.js";
import { buildSearchEntries, type SearchEntry } from "./search.js";

/** The committed dataset produced by `scripts/generate-icons.ts`. */
export const dataset: IconsDataset = iconsJson;

/** Every glyph, in curated dataset order. */
export const glyphs: readonly Glyph[] = dataset.glyphs;

/** Precomputed search index — build once, share across renders. */
export const searchEntries: readonly SearchEntry[] = buildSearchEntries(
  dataset.glyphs,
);

/**
 * Code point label → glyph lookup, used to resolve persisted favorites and
 * recent copies back into dataset records.
 */
export const glyphByCodepoint: ReadonlyMap<string, Glyph> = new Map(
  dataset.glyphs.map((glyph) => [glyph.codepoint, glyph]),
);

/**
 * URL fragment → glyph lookup for shareable inspector permalinks.
 * Keys are canonical hashes like `#U+2605` or `#U+1F1FA-U+1F1F8`.
 */
export const glyphByHash: ReadonlyMap<string, Glyph> = new Map(
  dataset.glyphs.map((glyph) => [glyphHash(glyph), glyph]),
);

/**
 * Resolve a URL fragment to a dataset glyph. Unknown code points and any
 * malformed or tampered fragment resolve to `undefined`; callers never need
 * to handle raw fragment text.
 */
export function glyphFromHash(hash: string): Glyph | undefined {
  const key = parseGlyphHash(hash);
  return key === null ? undefined : glyphByHash.get(key);
}

/** Code point label → search entry, used to keep collection ordering. */
export const searchEntryByCodepoint: ReadonlyMap<string, SearchEntry> = new Map(
  searchEntries.map((entry) => [entry.glyph.codepoint, entry]),
);

/** Name and glyph count of one browsing category (Unicode block). */
export interface BlockStat {
  block: string;
  count: number;
}

/**
 * Count glyphs per block, preserving first-appearance (dataset) order.
 * Used for the block browser and for collection-scoped chip counts.
 */
export function countBlocks(glyphs: readonly Glyph[]): BlockStat[] {
  const counts = new Map<string, number>();
  for (const glyph of glyphs) {
    counts.set(glyph.block, (counts.get(glyph.block) ?? 0) + 1);
  }
  return [...counts.entries()].map(([block, count]) => ({ block, count }));
}

/** Blocks in first-appearance (curated dataset) order. */
export const blockStats: readonly BlockStat[] = countBlocks(dataset.glyphs);
