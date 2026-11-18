/**
 * Unit tests for persisted collections (`src/lib/library.ts`).
 *
 * The runes-backed manager needs a browser environment; these tests cover the
 * pure normalization/merge rules that keep `localStorage` trustworthy.
 */

import { describe, expect, test } from "bun:test";
import {
  MAX_RECENTS,
  parseFavorites,
  parseRecents,
  recordRecent,
  toggleFavorite,
  type RecentCopy,
} from "./library.js";

describe("toggleFavorite", () => {
  test("adds a new key to the front", () => {
    expect(toggleFavorite([], "U+2605")).toEqual(["U+2605"]);
    expect(toggleFavorite(["U+2729"], "U+2605")).toEqual(["U+2605", "U+2729"]);
  });

  test("removes an existing key without touching order", () => {
    expect(toggleFavorite(["U+2605", "U+2729", "U+2190"], "U+2729")).toEqual([
      "U+2605",
      "U+2190",
    ]);
  });

  test("does not mutate the input", () => {
    const favorites = ["U+2605"];
    toggleFavorite(favorites, "U+2729");
    expect(favorites).toEqual(["U+2605"]);
  });
});

describe("recordRecent", () => {
  const at = (value: number) => value;

  test("puts the newest copy first", () => {
    const recents = recordRecent([], "U+2605", "char", at(1));
    expect(recents).toEqual([{ key: "U+2605", format: "char", at: 1 }]);
  });

  test("moves a repeated glyph to the front and updates its format", () => {
    const existing: RecentCopy[] = [
      { key: "U+2729", format: "char", at: 2 },
      { key: "U+2605", format: "css", at: 1 },
    ];
    const recents = recordRecent(existing, "U+2605", "js", at(3));
    expect(recents).toEqual([
      { key: "U+2605", format: "js", at: 3 },
      { key: "U+2729", format: "char", at: 2 },
    ]);
  });

  test(`caps the list at ${MAX_RECENTS} entries`, () => {
    let recents: RecentCopy[] = [];
    for (let index = 0; index < MAX_RECENTS + 5; index++) {
      recents = recordRecent(
        recents,
        `U+${(0x2600 + index).toString(16)}`,
        "char",
        index,
      );
    }
    expect(recents.length).toBe(MAX_RECENTS);
    expect(recents[0]?.at).toBe(MAX_RECENTS + 4);
    expect(recents.at(-1)?.at).toBe(5);
  });
});

describe("parseFavorites", () => {
  test("returns an empty list for missing or malformed storage", () => {
    expect(parseFavorites(null)).toEqual([]);
    expect(parseFavorites("not json")).toEqual([]);
    expect(parseFavorites('{"key":"U+2605"}')).toEqual([]);
    expect(parseFavorites("null")).toEqual([]);
  });

  test("keeps strings and drops junk and duplicates", () => {
    expect(
      parseFavorites('["U+2605", 42, "", null, "U+2605", "U+2729"]'),
    ).toEqual(["U+2605", "U+2729"]);
  });
});

describe("parseRecents", () => {
  test("returns an empty list for missing or malformed storage", () => {
    expect(parseRecents(null)).toEqual([]);
    expect(parseRecents("nope")).toEqual([]);
    expect(parseRecents('"U+2605"')).toEqual([]);
  });

  test("keeps valid rows, drops invalid ones and duplicates", () => {
    const raw = JSON.stringify([
      { key: "U+2605", format: "char", at: 10 },
      { key: "U+2605", format: "css", at: 9 },
      { key: "U+2729", format: "hex", at: 8 },
      { key: "U+2190", format: "css", at: "yesterday" },
      { key: 7, format: "char", at: 7 },
      { key: "U+25A0", format: "htmlHex", at: 6 },
    ]);
    expect(parseRecents(raw)).toEqual([
      { key: "U+2605", format: "char", at: 10 },
      { key: "U+25A0", format: "htmlHex", at: 6 },
    ]);
  });

  test(`caps restored rows at ${MAX_RECENTS}`, () => {
    const raw = JSON.stringify(
      Array.from({ length: MAX_RECENTS + 3 }, (_, index) => ({
        key: `U+${(0x2600 + index).toString(16)}`,
        format: "char",
        at: index,
      })),
    );
    expect(parseRecents(raw).length).toBe(MAX_RECENTS);
  });
});
