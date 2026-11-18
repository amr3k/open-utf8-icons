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
 * - exact name / complete name-word / exact keyword matches
 * - name / word / keyword prefix matches
 * - name / keyword substring matches
 * - code point prefix matches (`26`, `973`)
 * - greedy subsequence ("fuzzy") matching over names and keywords
 *
 * Results sort by descending score; equal scores prefer shorter (more
 * canonical) names; remaining ties keep input order (stable sort).
 *
 * Indexes are built lazily, one glyph at a time, and cached on the glyph
 * object: the initial page load never pays for an index it may not use.
 */

import type { Glyph } from "./data/types.js";

/** Precomputed, lowercase search index for a single glyph. */
export interface SearchEntry {
  /** Position of the glyph in the source list (informational only). */
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

/** Build the lowercase index record for one glyph. */
function createSearchEntry(glyph: Glyph, index: number): SearchEntry {
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
}

/**
 * Build the precomputed search index for a set of glyphs.
 * Used by tests and tooling; the UI searches glyphs directly through
 * `searchGlyphs`, which indexes each glyph on first use.
 */
export function buildSearchEntries(glyphs: readonly Glyph[]): SearchEntry[] {
  return glyphs.map((glyph, index) => createSearchEntry(glyph, index));
}

/**
 * Index records cached per glyph object. The first keystroke builds the
 * index for the glyphs it touches; later searches reuse the same records,
 * so the dataset arrives without a startup index build.
 */
const entryCache = new WeakMap<Glyph, SearchEntry>();

/** Index record for a glyph, built (and cached) on first use. */
export function searchEntryFor(glyph: Glyph, index = 0): SearchEntry {
  const cached = entryCache.get(glyph);
  if (cached !== undefined) return cached;
  const entry = createSearchEntry(glyph, index);
  entryCache.set(glyph, entry);
  return entry;
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
 * Greedy subsequence match over `haystack` (a single name or keyword — never
 * a joined blob, which produces noisy cross-word hits).
 *
 * Returns a relevance score (`1..~125`), or `null` when `needle` is not a
 * subsequence of `haystack`. The score rewards:
 * - compact matches (few gaps between matched characters),
 * - matches whose characters start name words (e.g. "blstr" → **bl**ack
 *   **st**a**r**),
 * - matches anchored at the start of the haystack, and
 * - shorter haystacks, so canonical names beat incidental subsequences
 *   buried inside long names.
 */
export function fuzzyScore(haystack: string, needle: string): number | null {
  if (needle.length === 0) return 0;
  if (needle.length > haystack.length) return null;

  let searchFrom = 0;
  let first = -1;
  let last = -1;
  let gaps = 0;
  let wordStarts = 0;

  for (const char of needle) {
    const found = haystack.indexOf(char, searchFrom);
    if (found === -1) return null;
    if (found === 0 || haystack.charAt(found - 1) === " ") {
      wordStarts += 1;
    }
    if (first === -1) {
      first = found;
    } else {
      gaps += found - last - 1;
    }
    last = found;
    searchFrom = found + 1;
  }

  const span = last - first + 1;
  const compactness = needle.length / span; // 0..1
  // Longer haystacks score lower (factor 1.0 → 0.5 as length grows 0 → 60).
  const lengthFactor = 1 - Math.min(haystack.length, 60) / 120;
  const boundaryBonus = 15 * wordStarts;
  const anchorBonus = first === 0 ? 10 : 0;
  const gapPenalty = Math.min(gaps * 2, 20);
  // A real subsequence match always scores at least 1, so callers can treat
  // 0/null cleanly (0 is reserved for the empty needle).
  return Math.max(
    1,
    Math.round(100 * compactness * lengthFactor + boundaryBonus + anchorBonus) -
      gapPenalty,
  );
}

// Matching scores — deliberately spread apart so ordering is predictable.
const SCORE_CHAR_EXACT = 1000;
const SCORE_DEC_EXACT = 620;
const SCORE_HEX_EXACT = 600;
const SCORE_NAME_EXACT = 550;
const SCORE_WORD_EXACT = 500;
const SCORE_NAME_PREFIX = 450;
const SCORE_WORD_PREFIX = 400;
const SCORE_KEYWORD_EXACT = 350;
const SCORE_KEYWORD_PREFIX = 300;
const SCORE_NAME_CONTAINS = 250;
const SCORE_KEYWORD_CONTAINS = 150;
const SCORE_DEC_PREFIX = 130;
const SCORE_HEX_PREFIX = 120;

/**
 * Score one entry against a normalized query.
 *
 * Returns the best single score achieved by the entry, or `null` when
 * nothing matches. Ties are broken by shorter names, then dataset order.
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
      } else if (
        hex.length >= 2 &&
        entry.hexParts.some((part) => part.startsWith(hex))
      ) {
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
  let text = 0;

  if (entry.nameLower === query) {
    text = SCORE_NAME_EXACT;
  } else if (entry.nameWords.some((word) => word === query)) {
    text = SCORE_WORD_EXACT;
  } else if (keywords.some((keyword) => keyword === query)) {
    text = SCORE_KEYWORD_EXACT;
  } else if (entry.nameLower.startsWith(query)) {
    text = SCORE_NAME_PREFIX;
  } else if (entry.nameWords.some((word) => word.startsWith(query))) {
    text = SCORE_WORD_PREFIX;
  } else if (keywords.some((keyword) => keyword.startsWith(query))) {
    text = SCORE_KEYWORD_PREFIX;
  } else if (entry.nameLower.includes(query)) {
    text = SCORE_NAME_CONTAINS;
  } else if (keywords.some((keyword) => keyword.includes(query))) {
    text = SCORE_KEYWORD_CONTAINS;
  } else {
    // Fuzzy subsequence matching: the best match over the name and each
    // keyword individually. Keywords are scored one at a time — matching
    // against a joined blob produced noisy cross-word hits.
    let best = fuzzyScore(entry.nameLower, query);
    for (const keyword of keywords) {
      const score = fuzzyScore(keyword, query);
      if (score !== null && (best === null || score > best)) {
        best = score;
      }
    }
    if (best !== null) {
      text = best; // 1..~115
    }
  }

  const best = Math.max(exact, codepointExact, codepointPrefix, text);
  return best > 0 ? best : null;
}

/** UI-facing status of the current search + filter combination. */
export interface SearchStatus {
  /** Glyphs matching the current query within the active block filter. */
  matchCount: number;
  /** Glyphs in scope before the query is applied (block filter included). */
  totalCount: number;
  /** Whether a query or block filter is narrowing the directory. */
  filtersActive: boolean;
}

/**
 * Search a set of glyphs and return the best-ranked matches.
 *
 * An empty query returns the glyphs in their original order (the same array,
 * so callers pay nothing for the default view). Otherwise every glyph is
 * scored through its cached search entry; results sort by descending score;
 * equal scores prefer shorter names, then input order (stable sort).
 * `limit` defaults to unlimited — callers render the list windowed instead of
 * truncating matches the user can never reach.
 */
export function searchGlyphs(
  glyphs: readonly Glyph[],
  query: string,
  limit: number = Number.POSITIVE_INFINITY,
): readonly Glyph[] {
  const normalized = normalizeQuery(query);

  if (normalized === "") {
    return limit >= glyphs.length ? glyphs : glyphs.slice(0, limit);
  }

  const codepoint = parseCodepointQuery(normalized);
  const hits: { glyph: Glyph; score: number }[] = [];
  for (let index = 0; index < glyphs.length; index++) {
    const glyph = glyphs[index]!;
    const entry = searchEntryFor(glyph, index);
    const score = scoreEntry(entry, normalized, codepoint);
    if (score !== null) {
      hits.push({ glyph, score });
    }
  }

  // Sort by score; equal scores prefer shorter (more canonical) names, and
  // remaining ties keep input order (Array#sort is stable).
  hits.sort(
    (a, b) => b.score - a.score || a.glyph.name.length - b.glyph.name.length,
  );
  return hits.slice(0, Math.min(hits.length, limit)).map((hit) => hit.glyph);
}
