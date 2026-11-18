/**
 * Dataset access layer (Phases 3 & 4 of #1).
 *
 * Single import site for the committed Unicode dataset: the page and its
 * components consume the unpacked dataset, code point lookups for persisted
 * collections, and per-block stats from here, so the packed JSON is bundled
 * exactly once.
 *
 * The artifact is shipped in its packed wire format and expanded on load
 * (`unpackDataset`). Indexes the UI does not need for the first paint — the
 * permalink lookup, the search index — are built on first use.
 */

import packedJson from "./data/icons.json";
import type { Glyph, IconsDataset } from "./data/types.js";
import { unpackDataset } from "./data/unpack.js";
import { glyphHash, parseGlyphHash } from "./permalink.js";

/** The committed dataset, expanded once at module load. */
export const dataset: IconsDataset = unpackDataset(packedJson);

/** Every glyph, in curated dataset order. */
export const glyphs: readonly Glyph[] = dataset.glyphs;

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
 *
 * Built lazily: permalink visits are the exception, so a normal page load
 * never pays for hashing four thousand glyphs.
 */
let glyphByHash: ReadonlyMap<string, Glyph> | null = null;

function permalinkIndex(): ReadonlyMap<string, Glyph> {
  glyphByHash ??= new Map(
    dataset.glyphs.map((glyph) => [glyphHash(glyph), glyph]),
  );
  return glyphByHash;
}

/**
 * Resolve a URL fragment to a dataset glyph. Unknown code points and any
 * malformed or tampered fragment resolve to `undefined`; callers never need
 * to handle raw fragment text.
 */
export function glyphFromHash(hash: string): Glyph | undefined {
  const key = parseGlyphHash(hash);
  return key === null ? undefined : permalinkIndex().get(key);
}

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
