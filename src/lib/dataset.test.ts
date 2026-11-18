/**
 * Unit tests for the dataset access layer (`src/lib/dataset.ts`).
 *
 * These guard the derived values the directory UI depends on (block stats,
 * search index) against regeneration drift in `icons.json`.
 */

import { describe, expect, test } from "bun:test";
import { blockStats, dataset, glyphs, searchEntries } from "./dataset.js";

describe("dataset", () => {
  test("exposes the committed dataset metadata", () => {
    expect(dataset.version).toBe(1);
    expect(dataset.count).toBeGreaterThan(3000);
    expect(dataset.count).toBeLessThan(5000);
    expect(glyphs.length).toBe(dataset.count);
  });
});

describe("blockStats", () => {
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
