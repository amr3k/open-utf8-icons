import { describe, expect, test } from "bun:test"
import { buildGlyph } from "./glyph.js"
import { flagEntryName, flagKeywords, type FlagRegion } from "./flags.js"
import { flagCodepoints } from "./flags.js"

describe("buildGlyph", () => {
  test("builds a complete record for a BMP glyph (★)", () => {
    const star = buildGlyph({
      codepoints: [0x2605],
      name: "BLACK STAR",
      category: "So",
      block: "Miscellaneous Symbols",
    })
    expect(star).toEqual({
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
      block: "Miscellaneous Symbols",
      keywords: ["black", "star", "favorite", "favourite", "rating", "bookmark", "filled"],
    })
  })

  test("builds a complete record for an astral code point (😀)", () => {
    const grin = buildGlyph({
      codepoints: [0x1f600],
      name: "GRINNING FACE",
      category: "So",
      block: "Emoticons",
    })
    expect(grin.char).toBe("😀")
    expect(grin.codepoint).toBe("U+1F600")
    expect(grin.dec).toBe(0x1f600)
    expect(grin.hex).toBe("1f600")
    expect(grin.htmlEntity).toBe("&#128512;")
    expect(grin.htmlHex).toBe("&#x1f600;")
    expect(grin.cssEscape).toBe("\\1f600")
    expect(grin.jsEscape).toBe("\\u{1f600}")
    expect(grin.keywords).toContain("grin")
    expect(grin.keywords).toContain("smile")
  })

  test("builds a complete record for a flag sequence (🇺🇸)", () => {
    const region: FlagRegion = {
      code: "US",
      name: "United States",
      aliases: ["usa", "america"],
    }
    const us = buildGlyph({
      codepoints: flagCodepoints(region.code),
      name: flagEntryName(region),
      category: "So",
      block: "Flags",
      extraKeywords: flagKeywords(region),
    })
    expect(us.char).toBe("🇺🇸")
    expect(us.name).toBe("FLAG OF UNITED STATES")
    expect(us.codepoint).toBe("U+1F1FA U+1F1F8")
    expect(us.dec).toBe("127482 127480")
    expect(us.hex).toBe("1f1fa 1f1f8")
    expect(us.htmlEntity).toBe("&#127482;&#127480;")
    expect(us.htmlHex).toBe("&#x1f1fa;&#x1f1f8;")
    expect(us.cssEscape).toBe("\\1f1fa \\1f1f8")
    expect(us.jsEscape).toBe("\\u{1f1fa}\\u{1f1f8}")
    expect(us.keywords).toEqual(["flag", "united", "states", "us", "usa", "america"])
  })

  test("merges curated synonyms for single code points only", () => {
    const star = buildGlyph({
      codepoints: [0x2605],
      name: "BLACK STAR",
      category: "So",
      block: "Miscellaneous Symbols",
    })
    expect(star.keywords).toContain("favorite")
  })
})
