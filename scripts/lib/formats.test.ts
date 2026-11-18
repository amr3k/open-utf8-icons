import { describe, expect, test } from "bun:test";
import {
  charFromCodepoints,
  formatCodepoints,
  formatCssEscape,
  formatDecimals,
  formatHtmlEntity,
  formatHtmlHex,
  formatJsEscape,
  toHex,
} from "./formats.js";

describe("formats", () => {
  test("toHex is lowercase and unpadded", () => {
    expect(toHex(0x2605)).toBe("2605");
    expect(toHex(0x1f600)).toBe("1f600");
    expect(toHex(0x24)).toBe("24");
  });

  test("formatCodepoints produces uppercase, 4-digit padded display labels", () => {
    expect(formatCodepoints([0x2605])).toBe("U+2605");
    expect(formatCodepoints([0x24])).toBe("U+0024");
    expect(formatCodepoints([0xac])).toBe("U+00AC");
    expect(formatCodepoints([0x1f600])).toBe("U+1F600");
    expect(formatCodepoints([0x1f1fa, 0x1f1f8])).toBe("U+1F1FA U+1F1F8");
  });

  test("formatDecimals joins sequence code points with spaces", () => {
    expect(formatDecimals([0x2605])).toBe("9733");
    expect(formatDecimals([0x1f1fa, 0x1f1f8])).toBe("127482 127480");
  });

  test("formatHtmlEntity produces decimal HTML entities", () => {
    expect(formatHtmlEntity([0x2605])).toBe("&#9733;");
    expect(formatHtmlEntity([0x1f1fa, 0x1f1f8])).toBe("&#127482;&#127480;");
  });

  test("formatHtmlHex produces hexadecimal HTML entities", () => {
    expect(formatHtmlHex([0x2605])).toBe("&#x2605;");
    expect(formatHtmlHex([0x1f600])).toBe("&#x1f600;");
    expect(formatHtmlHex([0x1f1fa, 0x1f1f8])).toBe("&#x1f1fa;&#x1f1f8;");
  });

  test("formatCssEscape produces backslash-escaped lowercase hex", () => {
    expect(formatCssEscape([0x2605])).toBe("\\2605");
    expect(formatCssEscape([0x1f600])).toBe("\\1f600");
    expect(formatCssEscape([0x1f1fa, 0x1f1f8])).toBe("\\1f1fa \\1f1f8");
  });

  test("formatJsEscape pads BMP code points and braces astral ones", () => {
    expect(formatJsEscape([0x2605])).toBe("\\u2605");
    expect(formatJsEscape([0xe9])).toBe("\\u00e9");
    expect(formatJsEscape([0x1f600])).toBe("\\u{1f600}");
    expect(formatJsEscape([0x1f1fa, 0x1f1f8])).toBe("\\u{1f1fa}\\u{1f1f8}");
  });

  test("charFromCodepoints builds single characters and sequences", () => {
    expect(charFromCodepoints([0x2605])).toBe("★");
    expect(charFromCodepoints([0x1f1fa, 0x1f1f8])).toBe("🇺🇸");
  });
});
