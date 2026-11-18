import { describe, expect, test } from "bun:test";
import {
  normalizeScriptName,
  parseScriptsData,
  scriptForCodePoint,
  UNKNOWN_SCRIPT,
} from "./unicode-scripts.js";

const SCRIPTS_FIXTURE = `# Scripts-16.0.0.txt
# @missing: 0000..10FFFF; Unknown

0000..001F    ; Common # Cc  [32] <control-0000>..<control-001F>
0020          ; Common # Zs       SPACE
0041..005A    ; Latin # Lu  [26] LATIN CAPITAL LETTER A..LATIN CAPITAL LETTER Z
0370..03FF    ; Greek # Lo      GREEK CAPITAL LETTER HETA..
1F1E6..1F1FF  ; Common # So  [26] REGIONAL INDICATOR SYMBOL LETTER A..
10530..1056F  ; Caucasian_Albanian # Lo  [64] CAUCASIAN ALBANIAN LETTER ALT..
garbage line
ZZZZ..ZZZZ    ; Broken # invalid code points
`;

describe("normalizeScriptName", () => {
  test("replaces underscores with spaces and trims", () => {
    expect(normalizeScriptName("Caucasian_Albanian")).toBe(
      "Caucasian Albanian",
    );
    expect(normalizeScriptName("  Common  ")).toBe("Common");
  });
});

describe("parseScriptsData", () => {
  test("parses ranges and normalizes script names", () => {
    const ranges = parseScriptsData(SCRIPTS_FIXTURE);
    expect(ranges).toEqual([
      { start: 0x0000, end: 0x001f, script: "Common" },
      { start: 0x0020, end: 0x0020, script: "Common" },
      { start: 0x0041, end: 0x005a, script: "Latin" },
      { start: 0x0370, end: 0x03ff, script: "Greek" },
      { start: 0x10530, end: 0x1056f, script: "Caucasian Albanian" },
      { start: 0x1f1e6, end: 0x1f1ff, script: "Common" },
    ]);
  });

  test("ignores comments, blank lines and malformed ranges", () => {
    const ranges = parseScriptsData(SCRIPTS_FIXTURE);
    expect(ranges.length).toBe(6);
    expect(ranges.some((range) => Number.isNaN(range.start))).toBe(false);
  });
});

describe("scriptForCodePoint", () => {
  const ranges = parseScriptsData(SCRIPTS_FIXTURE);

  test("resolves code points inside a range", () => {
    expect(scriptForCodePoint(ranges, 0x41)).toBe("Latin");
    expect(scriptForCodePoint(ranges, 0x03b1)).toBe("Greek");
    expect(scriptForCodePoint(ranges, 0x1f1fa)).toBe("Common");
  });

  test("resolves range boundaries", () => {
    expect(scriptForCodePoint(ranges, 0x005a)).toBe("Latin");
    expect(scriptForCodePoint(ranges, 0x0370)).toBe("Greek");
  });

  test("falls back to Unknown outside every range", () => {
    expect(scriptForCodePoint(ranges, 0x005b)).toBe(UNKNOWN_SCRIPT);
    expect(scriptForCodePoint(ranges, 0x2605)).toBe(UNKNOWN_SCRIPT);
    expect(scriptForCodePoint([], 0x2605)).toBe(UNKNOWN_SCRIPT);
  });
});
