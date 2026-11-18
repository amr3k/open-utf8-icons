import { describe, expect, test } from "bun:test";
import { collectBlockCodepoints, CURATED_BLOCKS } from "./blocks.js";
import { EXCLUDED_CODEPOINTS, isExcludedGlyph } from "./curation.js";

describe("curated exclusions", () => {
  test("every entry is a unique, valid code point", () => {
    for (const cp of EXCLUDED_CODEPOINTS) {
      expect(Number.isInteger(cp), `invalid ${cp}`).toBe(true);
      expect(cp).toBeGreaterThanOrEqual(0);
      expect(cp).toBeLessThanOrEqual(0x10ffff);
    }
    expect(EXCLUDED_CODEPOINTS.size).toBeGreaterThan(0);
  });

  test("every entry is inside a curated block", () => {
    const curated = new Set<number>();
    for (const block of CURATED_BLOCKS) {
      for (const cp of collectBlockCodepoints(block)) curated.add(cp);
    }
    for (const cp of EXCLUDED_CODEPOINTS) {
      expect(curated.has(cp), `U+${cp.toString(16)} is not curated`).toBe(true);
    }
  });

  test("matches any excluded code point of a sequence", () => {
    expect(isExcludedGlyph([0x2626])).toBe(true);
    expect(isExcludedGlyph([0x269b, 0x2721])).toBe(true);
    expect(isExcludedGlyph([0x2605])).toBe(false);
    expect(isExcludedGlyph([0x262a])).toBe(false);
  });
});
