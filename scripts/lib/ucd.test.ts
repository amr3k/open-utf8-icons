import { describe, expect, test } from "bun:test";
import { parseUnicodeData } from "./ucd.js";

const UCD_FIXTURE = `0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;;
2605;BLACK STAR;So;0;ON;;;;;N;;;;;
4E00;<CJK Ideograph, First>;Lo;0;L;;;;;N;;;;;
9FFF;<CJK Ideograph, Last>;Lo;0;L;;;;;N;;;;;
1F1FA;REGIONAL INDICATOR SYMBOL LETTER U;So;0;L;;;;;N;;;;;
1F600;GRINNING FACE;So;0;1;1F606;;;;N;Positive Emotions;;;;

`;

describe("parseUnicodeData", () => {
  test("parses assigned code points with name and category", () => {
    const entries = parseUnicodeData(UCD_FIXTURE);
    expect(entries.size).toBe(4);
    expect(entries.get(0x2605)).toEqual({
      codepoint: 0x2605,
      name: "BLACK STAR",
      category: "So",
    });
    expect(entries.get(0x41)?.name).toBe("LATIN CAPITAL LETTER A");
    expect(entries.get(0x1f600)?.name).toBe("GRINNING FACE");
  });

  test("skips ideographic range placeholders", () => {
    const entries = parseUnicodeData(UCD_FIXTURE);
    expect(entries.has(0x4e00)).toBe(false);
    expect(entries.has(0x9fff)).toBe(false);
  });

  test("skips malformed lines", () => {
    const entries = parseUnicodeData(
      ["", "garbage line", "ZZZZ;X;So;0", "2605;BLACK STAR;So"].join("\n"),
    );
    expect(entries.size).toBe(1);
    expect(entries.get(0x2605)?.name).toBe("BLACK STAR");
  });
});
