/**
 * Unit tests for the dataset access layer (`src/lib/dataset.ts`).
 *
 * These guard the derived values the directory UI depends on (block stats,
 * search index) against regeneration drift in `icons.json`.
 */

import { describe, expect, test } from "bun:test";
import {
  blockStats,
  countBlocks,
  dataset,
  glyphByCodepoint,
  glyphByHash,
  glyphFromHash,
  glyphs,
  searchEntries,
  searchEntryByCodepoint,
} from "./dataset.js";

describe("dataset", () => {
  test("exposes the committed dataset metadata", () => {
    expect(dataset.version).toBe(1);
    expect(dataset.count).toBeGreaterThan(3000);
    expect(dataset.count).toBeLessThan(5000);
    expect(glyphs.length).toBe(dataset.count);
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

describe("glyphByHash", () => {
  test("resolves every glyph from its permalink fragment", () => {
    expect(glyphByHash.size).toBe(glyphs.length);
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

describe("searchEntryByCodepoint", () => {
  test("resolves search entries and keeps the same glyph objects", () => {
    expect(searchEntryByCodepoint.size).toBe(glyphs.length);
    const entry = searchEntryByCodepoint.get("U+2605");
    expect(entry?.glyph).toBe(glyphByCodepoint.get("U+2605"));
    expect(entry?.nameLower).toBe("black star");
  });
});

describe("blockStats", () => {
  test("matches countBlocks over the full dataset", () => {
    expect(blockStats).toEqual(countBlocks(glyphs));
  });

  test("counts sum to the total glyph count", () => {
    const total = blockStats.reduce((sum, stat) => sum + stat.count, 0);
    expect(total).toBe(dataset.count);
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

describe("searchEntries", () => {
  test("indexes every glyph in dataset order", () => {
    expect(searchEntries.length).toBe(glyphs.length);
    const first = searchEntries.at(0);
    expect(first?.index).toBe(0);
    expect(first?.glyph).toBe(glyphs[0]);
    const last = searchEntries.at(-1);
    expect(last?.index).toBe(glyphs.length - 1);
    expect(last?.glyph).toBe(glyphs.at(-1));
  });
});
