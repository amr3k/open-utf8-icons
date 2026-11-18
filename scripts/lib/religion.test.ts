import { describe, expect, test } from "bun:test";
import { collectBlockCodepoints, CURATED_BLOCKS } from "./blocks.js";
import {
  EXCLUDED_RELIGIOUS_CODEPOINTS,
  EXCLUDED_RELIGIOUS_LOOKUP,
  ISLAMIC_CODEPOINTS,
  isExcludedReligiousGlyph,
} from "./religion.js";

describe("religious glyph curation", () => {
  test("every group lists unique, valid single code points", () => {
    const seen = new Set<number>();
    for (const [tradition, codepoints] of Object.entries(
      EXCLUDED_RELIGIOUS_CODEPOINTS,
    )) {
      expect(codepoints.length, `${tradition} is empty`).toBeGreaterThan(0);
      for (const cp of codepoints) {
        expect(Number.isInteger(cp), `${tradition}: invalid ${cp}`).toBe(true);
        expect(cp).toBeGreaterThanOrEqual(0);
        expect(cp).toBeLessThanOrEqual(0x10ffff);
        expect(seen.has(cp), `duplicate U+${cp.toString(16)}`).toBe(false);
        seen.add(cp);
      }
    }
    expect(EXCLUDED_RELIGIOUS_LOOKUP.size).toBe(seen.size);
  });

  test("every exclusion is inside a curated block", () => {
    const curated = new Set<number>();
    for (const block of CURATED_BLOCKS) {
      for (const cp of collectBlockCodepoints(block)) curated.add(cp);
    }
    for (const [tradition, codepoints] of Object.entries(
      EXCLUDED_RELIGIOUS_CODEPOINTS,
    )) {
      for (const cp of codepoints) {
        expect(
          curated.has(cp),
          `${tradition}: U+${cp.toString(16)} is not curated`,
        ).toBe(true);
      }
    }
  });

  test("Islamic glyphs are never excluded", () => {
    expect(ISLAMIC_CODEPOINTS.size).toBeGreaterThan(0);
    for (const cp of ISLAMIC_CODEPOINTS) {
      expect(EXCLUDED_RELIGIOUS_LOOKUP.has(cp)).toBe(false);
      expect(isExcludedReligiousGlyph([cp])).toBe(false);
    }
  });

  test("matches any excluded code point of a sequence", () => {
    expect(isExcludedReligiousGlyph([0x2626])).toBe(true);
    expect(isExcludedReligiousGlyph([0x262a])).toBe(false);
    expect(isExcludedReligiousGlyph([0x269b, 0x2721])).toBe(true);
    expect(isExcludedReligiousGlyph([0x2605])).toBe(false);
  });
});
