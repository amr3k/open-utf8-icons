/**
 * Shareable glyph permalinks (`#U+2605`).
 *
 * The glyph inspector mirrors its selection into the URL fragment so an open
 * glyph can be bookmarked, reloaded, or shared. Fragments are untrusted input:
 * parsing is strict, length-capped, and case-normalized, and the result is
 * only ever used as a lookup key against the bundled dataset — never
 * interpolated into markup. A crafted URL therefore cannot inject HTML or
 * script; it can at most point at a glyph that does not exist.
 */

import type { Glyph } from "./data/types.js";

/** Longest accepted fragment — bounds work on untrusted URLs. */
const MAX_HASH_LENGTH = 160;

/** One `U+XXXX` code point, or a `-`-joined sequence of them. */
const GLYPH_HASH_PATTERN = /^#U\+[0-9A-F]{4,6}(?:-U\+[0-9A-F]{4,6}){0,7}$/;

/**
 * Shareable fragment for a glyph, e.g. `#U+2605`.
 *
 * Multi-codepoint sequences (regional-indicator flags) replace the dataset's
 * space separator with `-`, e.g. `#U+1F1FA-U+1F1F8`.
 */
export function glyphHash(glyph: Glyph): string {
  return `#${glyph.codepoint.trim().toUpperCase().replace(/\s+/g, "-")}`;
}

/**
 * Normalize an untrusted URL fragment into a glyph hash key.
 *
 * Accepts a case-insensitive `u+` prefix, percent-encoding, and whitespace
 * between code points. Returns `null` for anything that is not a strict,
 * bounded code point sequence. The returned value is safe to use as a Map
 * key; callers must still resolve it against the dataset.
 */
export function parseGlyphHash(hash: string): string | null {
  if (hash.length > MAX_HASH_LENGTH) return null;

  let fragment = hash.trim();
  if (fragment.startsWith("#")) fragment = fragment.slice(1);
  try {
    fragment = decodeURIComponent(fragment);
  } catch {
    return null;
  }

  const normalized = `#${fragment.trim().toUpperCase().replace(/\s+/g, "-")}`;
  return GLYPH_HASH_PATTERN.test(normalized) ? normalized : null;
}
