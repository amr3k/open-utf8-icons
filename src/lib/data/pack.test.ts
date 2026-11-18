/**
 * Round-trip tests for the packed dataset wire format.
 *
 * `packDataset` runs in the extraction pipeline, `unpackDataset` in the
 * browser. Together they must reproduce every field the app uses — including
 * the representations derived from code points — while dropping keywords the
 * name already covers.
 */

import { describe, expect, test } from "bun:test";
import { packDataset } from "./pack.js";
import type { Glyph, IconsDataset } from "./types.js";
import { PACKED_VERSION } from "./types.js";
import { unpackDataset } from "./unpack.js";

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

function makeDataset(glyphs: Glyph[]): IconsDataset {
  return {
    version: 1,
    unicode: "16.0.0",
    generated: "2026-01-01",
    count: glyphs.length,
    glyphs,
  };
}

const star = makeGlyph();
const dollar = makeGlyph({
  char: "$",
  name: "DOLLAR SIGN",
  codepoint: "U+0024",
  dec: 36,
  hex: "24",
  htmlEntity: "&#36;",
  htmlHex: "&#x24;",
  cssEscape: "\\24",
  jsEscape: "\\u0024",
  category: "Sc",
  script: "Common",
  block: "Currency Symbols",
  keywords: ["money", "price"],
});
const zimbabwe = makeGlyph({
  char: "🇿🇼",
  name: "FLAG OF ZIMBABWE",
  codepoint: "U+1F1FF U+1F1FC",
  dec: "127487 127484",
  hex: "1f1ff 1f1fc",
  htmlEntity: "&#127487;&#127484;",
  htmlHex: "&#x1f1ff;&#x1f1fc;",
  cssEscape: "\\1f1ff \\1f1fc",
  jsEscape: "\\u{1f1ff}\\u{1f1fc}",
  category: "So",
  script: "Common",
  block: "Flags",
  keywords: ["flag", "zimbabwe", "zw", "cabo verde"],
});

describe("packDataset", () => {
  const packed = packDataset(makeDataset([star, dollar, zimbabwe]));

  test("writes the current schema version and dictionaries", () => {
    expect(packed.version).toBe(PACKED_VERSION);
    expect(packed.count).toBe(3);
    expect(packed.blocks).toEqual([
      "Miscellaneous Symbols",
      "Currency Symbols",
      "Flags",
    ]);
    expect(packed.categories).toEqual(["So", "Sc"]);
    expect(packed.scripts).toEqual(["Common"]);
  });

  test("keeps one newline-separated row per glyph without derived fields", () => {
    const rows = packed.rows.split("\n");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toBe("2605|BLACK STAR|0|0|0|favorite,bookmark");
    expect(rows[1]).toBe("24|DOLLAR SIGN|1|0|1|money,price");
    expect(rows[2]).toBe("1f1ff 1f1fc|FLAG OF ZIMBABWE|0|0|2|zw,cabo verde");
  });

  test("rejects values that would break the separators", () => {
    expect(() =>
      packDataset(makeDataset([makeGlyph({ name: "PIPE | NAME" })])),
    ).toThrow(/reserved separator/);
    expect(() =>
      packDataset(makeDataset([makeGlyph({ keywords: ["comma,word"] })])),
    ).toThrow(/reserved separator/);
  });
});

describe("unpackDataset", () => {
  const packed = packDataset(makeDataset([star, dollar, zimbabwe]));
  const decoded = unpackDataset(packed);

  test("restores dataset metadata", () => {
    expect(decoded.version).toBe(PACKED_VERSION);
    expect(decoded.unicode).toBe("16.0.0");
    expect(decoded.generated).toBe("2026-01-01");
    expect(decoded.count).toBe(3);
  });

  test("derives every representation from the code points", () => {
    const [starGlyph, dollarGlyph, flagGlyph] = decoded.glyphs;
    expect(starGlyph).toEqual({
      ...star,
      keywords: ["favorite", "bookmark"],
    });
    expect(dollarGlyph).toEqual({ ...dollar });
    expect(flagGlyph).toEqual({
      ...zimbabwe,
      keywords: ["zw", "cabo verde"],
    });
  });

  test("keeps multi-word keywords intact", () => {
    expect(decoded.glyphs[2]?.keywords).toContain("cabo verde");
  });

  test("rejects truncated artifacts", () => {
    expect(() => unpackDataset({ ...packed, count: packed.count + 1 })).toThrow(
      /decoded 3 glyphs/,
    );
  });

  test("rejects unknown schema versions", () => {
    expect(() => unpackDataset({ ...packed, version: 1 })).toThrow(
      /unsupported version/,
    );
  });

  test("rejects unknown dictionary indexes", () => {
    expect(() =>
      unpackDataset({ ...packed, blocks: ["Miscellaneous Symbols"] }),
    ).toThrow(/invalid block index/);
  });
});
