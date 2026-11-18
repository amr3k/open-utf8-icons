/**
 * Unit tests for the pure parts of the copy utilities (`src/lib/copy.ts`).
 *
 * `copyToClipboard` needs a real DOM and is exercised manually instead.
 */

import { describe, expect, test } from "bun:test";
import type { Glyph } from "./data/types.js";
import {
  COPY_FORMATS,
  DEVELOPER_FORMATS,
  getCopyText,
  isDeveloperFormat,
} from "./copy.js";

const star: Glyph = {
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
};

const flag: Glyph = {
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
  keywords: ["flag", "zimbabwe", "zw"],
};

describe("COPY_FORMATS", () => {
  test("covers every quick-copy format id exactly once", () => {
    const ids = COPY_FORMATS.map((option) => option.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.sort()).toEqual(["char", "codepoint", "css", "html"]);
  });

  test("every option has a label and hint", () => {
    for (const option of COPY_FORMATS) {
      expect(option.label.length).toBeGreaterThan(0);
      expect(option.hint.length).toBeGreaterThan(0);
    }
  });
});

describe("DEVELOPER_FORMATS", () => {
  test("covers every developer format id exactly once", () => {
    const ids = DEVELOPER_FORMATS.map((option) => option.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.sort()).toEqual([
      "char",
      "codepoint",
      "css",
      "html",
      "htmlHex",
      "js",
      "url",
    ]);
  });

  test("includes every quick-copy format", () => {
    const ids = new Set<string>(DEVELOPER_FORMATS.map((option) => option.id));
    for (const option of COPY_FORMATS) {
      expect(ids.has(option.id)).toBe(true);
    }
  });

  test("every option has a label and hint", () => {
    for (const option of DEVELOPER_FORMATS) {
      expect(option.label.length).toBeGreaterThan(0);
      expect(option.hint.length).toBeGreaterThan(0);
    }
  });
});

describe("getCopyText", () => {
  test("resolves every format for a single-codepoint glyph", () => {
    expect(getCopyText(star, "char")).toBe("★");
    expect(getCopyText(star, "html")).toBe("&#9733;");
    expect(getCopyText(star, "htmlHex")).toBe("&#x2605;");
    expect(getCopyText(star, "css")).toBe("\\2605");
    expect(getCopyText(star, "js")).toBe("\\u2605");
    expect(getCopyText(star, "url")).toBe("%E2%98%85");
    expect(getCopyText(star, "codepoint")).toBe("U+2605");
  });

  test("resolves every format for a multi-codepoint flag", () => {
    expect(getCopyText(flag, "char")).toBe("🇿🇼");
    expect(getCopyText(flag, "html")).toBe("&#127487;&#127484;");
    expect(getCopyText(flag, "htmlHex")).toBe("&#x1f1ff;&#x1f1fc;");
    expect(getCopyText(flag, "css")).toBe("\\1f1ff \\1f1fc");
    expect(getCopyText(flag, "js")).toBe("\\u{1f1ff}\\u{1f1fc}");
    expect(getCopyText(flag, "url")).toBe(
      "%F0%9F%87%BF%F0%9F%87%BC",
    );
    expect(getCopyText(flag, "codepoint")).toBe("U+1F1FF U+1F1FC");
  });
});

describe("isDeveloperFormat", () => {
  test("accepts known format ids", () => {
    for (const option of DEVELOPER_FORMATS) {
      expect(isDeveloperFormat(option.id)).toBe(true);
    }
  });

  test("rejects anything else", () => {
    expect(isDeveloperFormat("hex")).toBe(false);
    expect(isDeveloperFormat(42)).toBe(false);
    expect(isDeveloperFormat(null)).toBe(false);
    expect(isDeveloperFormat(undefined)).toBe(false);
  });
});
