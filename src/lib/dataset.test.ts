/**
 * Unit tests for the dataset access layer (`src/lib/dataset.ts`).
 *
 * These guard the derived values the directory UI depends on (block stats,
 * code point lookups) against regeneration drift in `icons.json`.
 */

import { describe, expect, test } from "bun:test";
import {
  blockStats,
  countBlocks,
  dataset,
  glyphByCodepoint,
  glyphFromHash,
  glyphs,
} from "./dataset.js";

describe("dataset", () => {
  test("exposes the unpacked glyphs and matching metadata", () => {
    expect(dataset.glyphs.length).toBe(glyphs.length);
    expect(dataset.glyphs[0]).toBe(glyphs[0]);
    expect(dataset.count).toBe(glyphs.length);
    expect(dataset.glyphs[0]?.char).toBe("←");
    expect(dataset.glyphs.at(-1)?.block).toBe("Flags");
  });
});

describe("glyphByCodepoint", () => {
  test("resolves every glyph from its code point label", () => {
    expect(glyphByCodepoint.size).toBe(glyphs.length);
    expect(glyphByCodepoint.get("U+2605")?.name).toBe("BLACK STAR");
    expect(glyphByCodepoint.get("U+1F1FA U+1F1F8")?.char).toBe("🇺🇸");
    expect(glyphByCodepoint.get("U+0000")).toBeUndefined();
  });
});

describe("glyphFromHash", () => {
  test("resolves every glyph from its permalink fragment", () => {
    expect(glyphFromHash("#U+2605")?.name).toBe("BLACK STAR");
    expect(glyphFromHash("#U+1F1FA-U+1F1F8")?.char).toBe("🇺🇸");
  });

  test("normalizes untrusted fragments before lookup", () => {
    expect(glyphFromHash("#u+2605")).toBe(glyphByCodepoint.get("U+2605"));
    expect(glyphFromHash("#U%2B2605")).toBe(glyphByCodepoint.get("U+2605"));
  });

  test("ignores unknown and malformed fragments", () => {
    expect(glyphFromHash("#U+0000")).toBeUndefined();
    expect(glyphFromHash("#U+2605<script>")).toBeUndefined();
    expect(glyphFromHash("#javascript:alert(1)")).toBeUndefined();
    expect(glyphFromHash("")).toBeUndefined();
  });
});

describe("blockStats", () => {
  test("matches countBlocks over the full dataset", () => {
    expect(blockStats).toEqual(countBlocks(glyphs));
  });

  test("contains every distinct block exactly once", () => {
    const blocks = blockStats.map((stat) => stat.block);
    expect(new Set(blocks).size).toBe(blocks.length);

    const distinct = new Set(glyphs.map((glyph) => glyph.block));
    expect(blocks.length).toBe(distinct.size);
    for (const block of distinct) {
      expect(blocks).toContain(block);
    }
  });

  test("orders blocks by first appearance in the dataset", () => {
    const firstSeen: string[] = [];
    for (const glyph of glyphs) {
      if (!firstSeen.includes(glyph.block)) firstSeen.push(glyph.block);
    }
    expect(blockStats.map((stat) => stat.block)).toEqual(firstSeen);
  });

  test("countBlocks scopes counts to an arbitrary subset", () => {
    const star = glyphByCodepoint.get("U+2605");
    const arrow = glyphByCodepoint.get("U+2190");
    expect(star).toBeDefined();
    expect(arrow).toBeDefined();
    if (star === undefined || arrow === undefined) return;

    expect(countBlocks([star, arrow])).toEqual([
      { block: "Miscellaneous Symbols", count: 1 },
      { block: "Arrows", count: 1 },
    ]);
    expect(countBlocks([])).toEqual([]);
  });
});
