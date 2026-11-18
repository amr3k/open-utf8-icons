/**
 * Unit tests for the pure client-side search engine (`src/lib/search.ts`).
 *
 * The fixtures below are a tiny hand-written subset of the dataset shape —
 * enough to exercise every matching tier: exact character, exact/prefix
 * code point, name/word/keyword prefix + substring, and fuzzy subsequences.
 */

import { describe, expect, test } from "bun:test";
import type { Glyph } from "./data/types.js";
import {
  buildSearchEntries,
  fuzzyScore,
  normalizeQuery,
  parseCodepointQuery,
  scoreEntry,
  searchGlyphs,
} from "./search.js";

/** Build a complete `Glyph` fixture with sensible defaults. */
function makeGlyph(overrides: Partial<Glyph> = {}): Glyph {
  return {
    char: "★",
    name: "BLACK STAR",
    codepoint: "U+2605",
    dec: 9733,
    hex: "2605",
    htmlEntity: "&#9733;",
    htmlHex: "&#x2605;",
    cssEscape: "\\2605",
    jsEscape: "\\u2605",
    category: "So",
    script: "Common",
    block: "Miscellaneous Symbols",
    keywords: ["favorite", "star", "bookmark"],
    ...overrides,
  };
}

const blackStar = makeGlyph({
  char: "★",
  name: "BLACK STAR",
  codepoint: "U+2605",
  dec: 9733,
  hex: "2605",
  keywords: ["favorite", "star", "bookmark"],
});

const whiteStar = makeGlyph({
  char: "☆",
  name: "WHITE STAR",
  codepoint: "U+2729",
  dec: 10025,
  hex: "2729",
  keywords: ["outline", "star"],
});

const shootingStar = makeGlyph({
  char: "🌠",
  name: "SHOOTING STAR",
  codepoint: "U+1F320",
  dec: 127776,
  hex: "1f320",
  keywords: ["comet", "falling", "star"],
});

const asterisk = makeGlyph({
  char: "✳",
  name: "EIGHT SPOKED ASTERISK",
  codepoint: "U+2733",
  dec: 10035,
  hex: "2733",
  keywords: ["asterisk", "star", "snowflake"],
});

const leftArrow = makeGlyph({
  char: "←",
  name: "LEFTWARDS ARROW",
  codepoint: "U+2190",
  dec: 8592,
  hex: "2190",
  keywords: ["leftwards", "left", "arrow", "back"],
});

const dollar = makeGlyph({
  char: "$",
  name: "DOLLAR SIGN",
  codepoint: "U+0024",
  dec: 36,
  hex: "0024",
  htmlEntity: "&#36;",
  htmlHex: "&#x24;",
  cssEscape: "\\24",
  jsEscape: "\\u24",
  keywords: ["dollar", "currency", "money"],
});

const zimbabweFlag = makeGlyph({
  char: "🇿🇼",
  name: "FLAG OF ZIMBABWE",
  codepoint: "U+1F1FF U+1F1FC",
  dec: "127487 127484",
  hex: "1f1ff 1f1fc",
  htmlEntity: "&#127487;&#127484;",
  htmlHex: "&#x1f1ff;&#x1f1fc;",
  cssEscape: "\\1f1ff \\1f1fc",
  jsEscape: "\\u{1f1ff}\\u{1f1fc}",
  block: "Flags",
  keywords: ["flag", "zimbabwe", "zw"],
});

const capeVerdeFlag = makeGlyph({
  char: "🇨🇻",
  name: "FLAG OF CAPE VERDE",
  codepoint: "U+1F1E8 U+1F1FB",
  dec: "127464 127483",
  hex: "1f1e8 1f1fb",
  htmlEntity: "&#127464;&#127483;",
  htmlHex: "&#x1f1e8;&#x1f1fb;",
  cssEscape: "\\1f1e8 \\1f1fb",
  jsEscape: "\\u{1f1e8}\\u{1f1fb}",
  block: "Flags",
  keywords: ["flag", "cape", "verde", "cv", "cabo verde"],
});

/** Long-name distractor: fuzzy matching must not bury short canonical names. */
const strokeArrow = makeGlyph({
  char: "⇊",
  name: "DOWNWARDS ARROW WITH DOUBLE STROKE",
  codepoint: "U+21CA",
  dec: 8650,
  hex: "21ca",
  keywords: ["down", "arrow", "double", "stroke"],
});

const fixtures = [
  blackStar,
  whiteStar,
  shootingStar,
  asterisk,
  leftArrow,
  dollar,
  zimbabweFlag,
  capeVerdeFlag,
  strokeArrow,
];

const entries = buildSearchEntries(fixtures);

describe("normalizeQuery", () => {
  test("trims, lowercases, and collapses whitespace", () => {
    expect(normalizeQuery("  BLACK   star ")).toBe("black star");
    expect(normalizeQuery("\tU+2605\n")).toBe("u+2605");
  });
});

describe("parseCodepointQuery", () => {
  test("parses u+ and 0x prefixed hex", () => {
    expect(parseCodepointQuery("u+2605")).toEqual({ hex: "2605", dec: null });
    expect(parseCodepointQuery("0x1f600")).toEqual({ hex: "1f600", dec: null });
    expect(parseCodepointQuery("u+24")).toEqual({ hex: "24", dec: null });
  });

  test("strips leading zeros", () => {
    expect(parseCodepointQuery("0024")).toEqual({ hex: "24", dec: "24" });
    expect(parseCodepointQuery("u+0024")).toEqual({ hex: "24", dec: null });
  });

  test("pure digits are both decimal and hex candidates", () => {
    expect(parseCodepointQuery("9733")).toEqual({ hex: "9733", dec: "9733" });
    expect(parseCodepointQuery("24")).toEqual({ hex: "24", dec: "24" });
  });

  test("bare hex requires at least two characters", () => {
    expect(parseCodepointQuery("1f1ff")).toEqual({ hex: "1f1ff", dec: null });
    expect(parseCodepointQuery("a")).toBeNull();
    expect(parseCodepointQuery("zz")).toBeNull();
    expect(parseCodepointQuery("star")).toBeNull();
  });
});

describe("fuzzyScore", () => {
  test("scores exact contiguous subsequence the highest", () => {
    const tight = fuzzyScore("black star", "star");
    const loose = fuzzyScore("black star", "blst");
    expect(tight).not.toBeNull();
    expect(loose).not.toBeNull();
    expect(tight!).toBeGreaterThan(loose!);
  });

  test("prefers short canonical names over long ones", () => {
    const canonical = fuzzyScore("black star", "star");
    const buried = fuzzyScore("leftwards arrow with double stroke", "lads");
    expect(canonical).not.toBeNull();
    expect(buried).not.toBeNull();
    expect(canonical!).toBeGreaterThan(buried!);
  });

  test("rewards matches at word starts", () => {
    // Same needle: word-start alignment must overcome the shorter haystack's
    // length advantage ("abacus" is 6 chars, "black star" is 10).
    const wordStarts = fuzzyScore("black star", "bs");
    const midWord = fuzzyScore("abacus", "bs");
    expect(wordStarts).not.toBeNull();
    expect(midWord).not.toBeNull();
    expect(wordStarts!).toBeGreaterThan(midWord!);
  });

  test("rejects non-subsequences; empty needle scores 0", () => {
    expect(fuzzyScore("black star", "xyz")).toBeNull();
    expect(fuzzyScore("black", "blackstar")).toBeNull();
    expect(fuzzyScore("black star", "")).toBe(0);
  });

  test("a real match never scores below 1", () => {
    expect(fuzzyScore("black star", "bs")).toBeGreaterThanOrEqual(1);
    expect(fuzzyScore("black star", "ckr")).toBeGreaterThanOrEqual(1);
  });
});

describe("buildSearchEntries", () => {
  test("precomputes lowercase words and split codepoint parts", () => {
    const star = entries.find((entry) => entry.glyph === blackStar)!;
    expect(star.nameLower).toBe("black star");
    expect(star.nameWords).toEqual(["black", "star"]);

    const flag = entries.find((entry) => entry.glyph === zimbabweFlag)!;
    expect(flag.hexParts).toEqual(["1f1ff", "1f1fc"]);
    expect(flag.decParts).toEqual(["127487", "127484"]);
  });

  test("normalizes padded hex parts", () => {
    const dollarEntry = entries.find((entry) => entry.glyph === dollar)!;
    expect(dollarEntry.hexParts).toEqual(["24"]);
    expect(dollarEntry.decParts).toEqual(["36"]);
  });

  test("indexes match dataset order", () => {
    expect(entries.map((entry) => entry.index)).toEqual(
      fixtures.map((_, index) => index),
    );
  });
});

describe("scoreEntry", () => {
  const codepointOf = (query: string) => parseCodepointQuery(query);

  test("ranks exact character match highest", () => {
    const star = entries.find((entry) => entry.glyph === blackStar)!;
    expect(scoreEntry(star, "★", codepointOf("★"))).toBe(1000);
  });

  test("scores exact decimal and hex code point matches", () => {
    const star = entries.find((entry) => entry.glyph === blackStar)!;
    expect(scoreEntry(star, "u+2605", codepointOf("u+2605"))).toBe(600);
    expect(scoreEntry(star, "9733", codepointOf("9733"))).toBe(620);
  });

  test("scores exact name, word, and keyword tiers in that order", () => {
    const star = entries.find((entry) => entry.glyph === blackStar)!;
    const shooting = entries.find((entry) => entry.glyph === shootingStar)!;
    const asteriskEntry = entries.find((entry) => entry.glyph === asterisk)!;

    expect(scoreEntry(star, "black star", codepointOf("black star"))).toBe(550);
    expect(scoreEntry(star, "star", codepointOf("star"))).toBe(500);
    expect(scoreEntry(shooting, "star", codepointOf("star"))).toBe(500);
    expect(scoreEntry(asteriskEntry, "star", codepointOf("star"))).toBe(350);
    expect(scoreEntry(star, "fav", codepointOf("fav"))).toBe(300);
  });

  test("scores name and word prefixes below exact tiers", () => {
    const star = entries.find((entry) => entry.glyph === blackStar)!;
    expect(scoreEntry(star, "bl", codepointOf("bl"))).toBe(450);
    expect(scoreEntry(star, "sta", codepointOf("sta"))).toBe(400);
  });

  test("scores substring and codepoint prefixes", () => {
    const star = entries.find((entry) => entry.glyph === blackStar)!;
    expect(scoreEntry(star, "lack", codepointOf("lack"))).toBe(250);
    expect(scoreEntry(star, "tar", codepointOf("tar"))).toBe(250);
    expect(scoreEntry(star, "97", codepointOf("97"))).toBe(130);
    expect(scoreEntry(star, "26", codepointOf("26"))).toBe(120);
  });

  test("falls back to fuzzy subsequence matching", () => {
    const star = entries.find((entry) => entry.glyph === blackStar)!;
    const fuzzy = scoreEntry(star, "blstar", codepointOf("blstar"));
    expect(fuzzy).not.toBeNull();
    expect(fuzzy!).toBeGreaterThan(0);
    expect(fuzzy!).toBeLessThanOrEqual(115);
  });

  test("falls back to fuzzy keyword matching for typos", () => {
    const star = entries.find((entry) => entry.glyph === blackStar)!;
    const fuzzy = scoreEntry(star, "favrite", codepointOf("favrite"));
    expect(fuzzy).not.toBeNull();
    expect(fuzzy!).toBeGreaterThan(0);
    // Fuzzy keyword matches stay below substring-level keyword matches.
    expect(fuzzy!).toBeLessThan(150);
  });

  test("scores multi-codepoint flags by each part", () => {
    const flag = entries.find((entry) => entry.glyph === zimbabweFlag)!;
    expect(scoreEntry(flag, "u+1f1ff", codepointOf("u+1f1ff"))).toBe(600);
    expect(scoreEntry(flag, "127487", codepointOf("127487"))).toBe(620);
    expect(scoreEntry(flag, "zw", codepointOf("zw"))).toBe(350);
  });

  test("returns null when nothing matches", () => {
    const star = entries.find((entry) => entry.glyph === blackStar)!;
    expect(scoreEntry(star, "qqq", codepointOf("qqq"))).toBeNull();
    // Single characters never do codepoint matching (too noisy).
    expect(scoreEntry(star, "5", codepointOf("5"))).toBeNull();
  });
});

describe("searchGlyphs", () => {
  test("empty query returns every glyph in dataset order", () => {
    expect(searchGlyphs(fixtures, "")).toEqual(fixtures);
    expect(searchGlyphs(fixtures, "   ")).toEqual(fixtures);
  });

  test("respects an explicit limit", () => {
    expect(searchGlyphs(fixtures, "", 3)).toHaveLength(3);
    expect(searchGlyphs(fixtures, "star", 2)).toHaveLength(2);
  });

  test("ranks name prefix above word prefix above keyword prefix", () => {
    const results = searchGlyphs(fixtures, "star");
    expect(results.map((glyph) => glyph.name)).toEqual([
      "BLACK STAR",
      "WHITE STAR",
      "SHOOTING STAR",
      "EIGHT SPOKED ASTERISK",
    ]);
  });

  test("equal scores prefer shorter names, then dataset order", () => {
    const results = searchGlyphs(fixtures, "star");
    // BLACK STAR, WHITE STAR, and SHOOTING STAR all match the complete word
    // "star" with the same score. SHOOTING STAR has the longest name, so the
    // two 10-char names win; between them dataset order decides.
    expect(results.indexOf(whiteStar)).toBeLessThan(
      results.indexOf(shootingStar),
    );
    expect(results.indexOf(blackStar)).toBeLessThan(results.indexOf(whiteStar));
  });

  test("finds glyphs by exact character", () => {
    expect(searchGlyphs(fixtures, "★")[0]).toBe(blackStar);
    expect(searchGlyphs(fixtures, "$")[0]).toBe(dollar);
  });

  test("finds glyphs by code point in every notation", () => {
    expect(searchGlyphs(fixtures, "u+2605")).toEqual([blackStar]);
    expect(searchGlyphs(fixtures, "2605")).toEqual([blackStar]);
    expect(searchGlyphs(fixtures, "9733")).toEqual([blackStar]);
    expect(searchGlyphs(fixtures, "u+0024")).toEqual([dollar]);
  });

  test("finds multi-codepoint flags by code point and keyword", () => {
    expect(searchGlyphs(fixtures, "u+1f1ff")).toEqual([zimbabweFlag]);
    expect(searchGlyphs(fixtures, "1f1fc")).toEqual([zimbabweFlag]);
    expect(searchGlyphs(fixtures, "127484")).toEqual([zimbabweFlag]);
    expect(searchGlyphs(fixtures, "zw")).toEqual([zimbabweFlag]);
    expect(searchGlyphs(fixtures, "zimbabwe")).toEqual([zimbabweFlag]);
  });

  test("matches fuzzy subsequences across name words", () => {
    const results = searchGlyphs(fixtures, "blstr");
    expect(results[0]).toBe(blackStar);
    // Short canonical names beat incidental subsequences inside long names.
    expect(results.indexOf(blackStar)).toBeLessThan(
      results.indexOf(strokeArrow),
    );
  });

  test("matches fuzzy keyword typos", () => {
    expect(searchGlyphs(fixtures, "favrite")[0]).toBe(blackStar);
  });

  test("matches multi-word keywords exactly", () => {
    expect(searchGlyphs(fixtures, "cabo verde")).toEqual([capeVerdeFlag]);
  });

  test("padded and unpadded hex queries are equivalent", () => {
    expect(searchGlyphs(fixtures, "0024")).toEqual([dollar]);
    expect(searchGlyphs(fixtures, "24")).toContain(dollar);
  });

  test("returns an empty array for queries that match nothing", () => {
    expect(searchGlyphs(fixtures, "qqqq")).toEqual([]);
  });
});
