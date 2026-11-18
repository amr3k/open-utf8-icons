/**
 * Unit tests for shareable glyph permalinks (`src/lib/permalink.ts`).
 *
 * Fragments come straight from the address bar, so these tests pin down the
 * strict, inert normalization that keeps crafted URLs from matching anything
 * but a real dataset glyph.
 */

import { describe, expect, test } from "bun:test";
import type { Glyph } from "./data/types.js";
import { glyphHash, parseGlyphHash } from "./permalink.js";

/** Minimal glyph fixture — only `codepoint` is used by the permalink code. */
function makeGlyph(codepoint: string): Glyph {
  return {
    char: "★",
    name: "BLACK STAR",
    codepoint,
    dec: 9733,
    hex: "2605",
    htmlEntity: "&#9733;",
    htmlHex: "&#x2605;",
    cssEscape: "\\2605",
    jsEscape: "\\u2605",
    category: "So",
    script: "Common",
    block: "Miscellaneous Symbols",
    keywords: ["star"],
  };
}

describe("glyphHash", () => {
  test("serializes a single code point", () => {
    expect(glyphHash(makeGlyph("U+2605"))).toBe("#U+2605");
  });

  test("joins multi-codepoint sequences with a dash", () => {
    expect(glyphHash(makeGlyph("U+1F1FA U+1F1F8"))).toBe("#U+1F1FA-U+1F1F8");
  });

  test("normalizes case and surrounding whitespace", () => {
    expect(glyphHash(makeGlyph(" u+2605 "))).toBe("#U+2605");
  });
});

describe("parseGlyphHash", () => {
  test("accepts canonical fragments", () => {
    expect(parseGlyphHash("#U+2605")).toBe("#U+2605");
    expect(parseGlyphHash("#U+1F1FA-U+1F1F8")).toBe("#U+1F1FA-U+1F1F8");
  });

  test("normalizes case, whitespace, and percent-encoding", () => {
    expect(parseGlyphHash("#u+2605")).toBe("#U+2605");
    expect(parseGlyphHash("#U%2B2605")).toBe("#U+2605");
    expect(parseGlyphHash("#U+1F1FA%20U+1F1F8")).toBe("#U+1F1FA-U+1F1F8");
    expect(parseGlyphHash("#U+1F1FA U+1F1F8")).toBe("#U+1F1FA-U+1F1F8");
    expect(parseGlyphHash("  #U+2605  ")).toBe("#U+2605");
    expect(parseGlyphHash("U+2605")).toBe("#U+2605");
  });

  test("rejects empty, malformed, and oversized fragments", () => {
    expect(parseGlyphHash("")).toBeNull();
    expect(parseGlyphHash("#")).toBeNull();
    expect(parseGlyphHash("#U+")).toBeNull();
    expect(parseGlyphHash("#U+ZZZZ")).toBeNull();
    expect(parseGlyphHash("#U+2605-")).toBeNull();
    expect(parseGlyphHash("#U+2605--U+2606")).toBeNull();
    expect(parseGlyphHash(`#U+${"2".repeat(400)}`)).toBeNull();
    expect(parseGlyphHash("#U+2605%")).toBeNull();
  });

  test("rejects markup and script payloads", () => {
    expect(parseGlyphHash("#<script>alert(1)</script>")).toBeNull();
    expect(parseGlyphHash("#U+2605%3Cscript%3E")).toBeNull();
    expect(parseGlyphHash("#javascript:alert(1)")).toBeNull();
    expect(parseGlyphHash("#U+2605%0Aalert(1)")).toBeNull();
  });
});
