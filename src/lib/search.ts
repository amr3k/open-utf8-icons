/**
 * Instant client-side search engine for the Unicode dataset.
 *
 * Pure functions only — no runes, no DOM — so the whole engine is unit
 * testable with `bun test`. The dataset is small enough (~4k glyphs) that
 * scoring every entry on each keystroke stays well under a frame budget,
 * which keeps the UI dependency-free and fully offline.
 *
 * Matching strategy (highest signal first):
 * - exact character match (typing the glyph itself)
 * - exact code point match (`U+2605`, `2605`, `0x2605`, or decimal `9733`)
 * - name / keyword prefix and substring matches
 * - code point prefix matches (`26`, `973`)
 * - greedy subsequence ("fuzzy") matching over names and keywords
 */

import type { Glyph } from "./data/types.js";

/** Precomputed, lowercase search index for a single glyph. */
export interface SearchEntry {
  /** Position of the glyph in dataset order (used as a stable tie-breaker). */
  index: number;
  glyph: Glyph;
  /** Lowercased official name, e.g. `"black star"`. */
  nameLower: string;
  /** Lowercased name words, e.g. `["black", "star"]`. */
  nameWords: string[];
  /** Lowercase hex parts without padding, e.g. `["2605"]` / flags `["1f1ff", "1f1fc"]`. */
  hexParts: string[];
  /** Decimal parts as strings, e.g. `["9733"]` / flags `["127487", "127484"]`. */
  decParts: string[];
}

/** Strip leading zeros from a hex string so `0024` and `24` compare equal. */
function normalizeHex(raw: string): string {
  return raw.replace(/^0+/, "") || "0";
}

/**
 * Build the precomputed search index for a set of glyphs.
 * Run once at dataset load; the result is read-only and shared.
 */
export function buildSearchEntries(glyphs: readonly Glyph[]): SearchEntry[] {
  return glyphs.map((glyph, index) => {
    const nameLower = glyph.name.toLowerCase();
    return {
      index,
      glyph,
      nameLower,
      nameWords: nameLower.split(" "),
      hexParts: glyph.hex.split(" ").map(normalizeHex),
      decParts:
        typeof glyph.dec === "number"
          ? [String(glyph.dec)]
          : glyph.dec.split(" "),
    };
  });
}

/** Normalize user input: trim, lowercase, collapse runs of whitespace. */
export function normalizeQuery(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Code point candidates parsed from a normalized query. */
export interface CodepointQuery {
  /** Lowercase, unpadded hex digits if the query can be a hex code point. */
  hex: string | null;
  /** Digits if the query can be a decimal code point. */
  dec: string | null;
}

/**
 * Parse a normalized query for code point intent.
 *
 * - `"u+2605"` / `"0x2605"` → hex `2605`
 * - `"9733"` → dec `9733` (also hex, since digits are valid hex)
 * - `"2605"` / `"0024"` → hex (with leading zeros stripped)
 * - anything else (too short, or non-hex characters) → `null`
 */
export function parseCodepointQuery(query: string): CodepointQuery | null {
  const prefixed = query.match(/^(?:u\+|0x)([0-9a-f]{1,6})$/);
  if (prefixed) {
    return { hex: normalizeHex(prefixed[1]!), dec: null };
  }
  if (/^[0-9]{1,7}$/.test(query)) {
    // Digits are simultaneously a decimal and a hex candidate. Strip leading
    // zeros on both so `0024` matches the glyph for decimal 24 as well.
    const digits = normalizeHex(query);
    return { hex: digits, dec: digits };
  }
  if (/^[0-9a-f]{2,6}$/.test(query)) {
    return { hex: normalizeHex(query), dec: null };
  }
  return null;
}

/**
 * Greedy subsequence match over `haystack`.
 *
 * Returns a compactness score in `0..100` (tighter matches score higher,
 * long haystacks are penalized slightly), or `null` when `needle` is not a
 * subsequence of `haystack`.
 */
export function fuzzyScore(haystack: string, needle: string): number | null {
  if (needle.length === 0) return 0;
  if (needle.length > haystack.length) return null;

  let searchFrom = 0;
  let first = -1;
  let last = -1;
  let gaps = 0;

  for (const char of needle) {
    const found = haystack.indexOf(char, searchFrom);
    if (found === -1) return null;
    if (first === -1) {
      first = found;
    } else {
      gaps += found - last - 1;
    }
    last = found;
    searchFrom = found + 1;
  }

  const span = last - first + 1;
  const compactness = needle.length / span;
  const lengthPenalty = Math.min(haystack.length, 40) / 40;
  const gapPenalty = Math.min(gaps * 4, 20);
  // A real subsequence match always scores at least 1, so callers can treat
  // 0/null cleanly (0 is reserved for the empty needle).
  return Math.max(1, Math.round(100 * compactness * lengthPenalty) - gapPenalty);
}

// Matching scores — deliberately spread apart so ordering is predictable.
const SCORE_CHAR_EXACT = 1000;
const SCORE_DEC_EXACT = 620;
const SCORE_HEX_EXACT = 600;
const SCORE_NAME_PREFIX = 500;
const SCORE_WORD_PREFIX = 400;
const SCORE_KEYWORD_PREFIX = 300;
const SCORE_NAME_CONTAINS = 250;
const SCORE_KEYWORD_CONTAINS = 150;
const SCORE_DEC_PREFIX = 130;
const SCORE_HEX_PREFIX = 120;

/**
 * Score one entry against a normalized query.
 *
 * Returns the best single score achieved by the entry, or `null` when
 * nothing matches. Ties are broken by dataset order downstream.
 */
export function scoreEntry(
  entry: SearchEntry,
  query: string,
  codepoint: CodepointQuery | null,
): number | null {
  if (query === "") return 0;

  let exact = 0;
  if (entry.glyph.char.toLowerCase() === query) {
    exact = SCORE_CHAR_EXACT;
  }

  let codepointExact = 0;
  let codepointPrefix = 0;
  if (codepoint !== null && query.length >= 2) {
    // Extract narrowed values before the callbacks below — control flow
    // analysis cannot reach into closures.
    const hex = codepoint.hex;
    if (hex !== null) {
      if (entry.hexParts.includes(hex)) {
        codepointExact = SCORE_HEX_EXACT;
      } else if (hex.length >= 2 && entry.hexParts.some((part) => part.startsWith(hex))) {
        codepointPrefix = SCORE_HEX_PREFIX;
      }
    }
    const dec = codepoint.dec;
    if (dec !== null) {
      if (entry.decParts.includes(dec)) {
        codepointExact = Math.max(codepointExact, SCORE_DEC_EXACT);
      } else if (entry.decParts.some((part) => part.startsWith(dec))) {
        codepointPrefix = Math.max(codepointPrefix, SCORE_DEC_PREFIX);
      }
    }
  }

  const keywords = entry.glyph.keywords;
  const singleWord = !query.includes(" ");
  let text = 0;

  if (entry.nameLower.startsWith(query)) {
    text = SCORE_NAME_PREFIX;
  } else if (entry.nameWords.some((word) => word.startsWith(query))) {
    text = SCORE_WORD_PREFIX;
  } else if (
    singleWord &&
    keywords.length > 0 &&
    keywords.some((word) => word.startsWith(query))
  ) {
    text = SCORE_KEYWORD_PREFIX;
  } else if (entry.nameLower.includes(query)) {
    text = SCORE_NAME_CONTAINS;
  } else if (
    singleWord &&
    keywords.length > 0 &&
    keywords.some((word) => word.includes(query))
  ) {
    text = SCORE_KEYWORD_CONTAINS;
  } else {
    // Fuzzy subsequence matching runs over names only — running it over the
    // joined keyword blob proved far too noisy (scattered hits like
    // "leftward**s** lef**t** **a****r**row" matching "star").
    const fuzzyName = fuzzyScore(entry.nameLower, query);
    if (fuzzyName !== null) {
      text = fuzzyName; // 1..100
    }
  }

  const best = Math.max(exact, codepointExact, codepointPrefix, text);
  return best > 0 ? best : null;
}

export interface SearchOptions {
  /** Maximum number of results to return. Defaults to all matches. */
  limit?: number;
}

/**
 * Search a precomputed index and return the best-ranked glyphs.
 *
 * An empty query returns every glyph in dataset order. Results are sorted by
 * descending score; equal scores keep dataset order (stable sort).
 */
export function searchGlyphs(
  entries: readonly SearchEntry[],
  query: string,
  options: SearchOptions = {},
): Glyph[] {
  const limit = options.limit ?? Number.POSITIVE_INFINITY;
  const normalized = normalizeQuery(query);

  if (normalized === "") {
    const all = entries.slice(0, Math.min(entries.length, limit));
    return all.map((entry) => entry.glyph);
  }

  const codepoint = parseCodepointQuery(normalized);
  const hits: { glyph: Glyph; score: number }[] = [];
  for (const entry of entries) {
    const score = scoreEntry(entry, normalized, codepoint);
    if (score !== null) {
      hits.push({ glyph: entry.glyph, score });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, Math.min(hits.length, limit)).map((hit) => hit.glyph);
}
