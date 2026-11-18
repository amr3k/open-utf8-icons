/**
 * Pure formatting helpers that turn Unicode code points into the
 * developer-copyable representations stored per glyph (HTML entities,
 * CSS escapes, JS escapes, code point labels).
 */

/** Lowercase hex without padding: `0x2605` → `"2605"`. */
export function toHex(codepoint: number): string {
  return codepoint.toString(16);
}

/** Uppercase display label, zero-padded to 4 hex digits: `[0x2605]` → `"U+2605"`, `[0x24]` → `"U+0024"`, `[0x1f1fa, 0x1f1f8]` → `"U+1F1FA U+1F1F8"`. */
export function formatCodepoints(codepoints: number[]): string {
  return codepoints
    .map((cp) => `U+${toHex(cp).toUpperCase().padStart(4, "0")}`)
    .join(" ");
}

/** Space-joined decimal values: `[0x1f1fa, 0x1f1f8]` → `"127482 127480"`. */
export function formatDecimals(codepoints: number[]): string {
  return codepoints.map((cp) => cp.toString(10)).join(" ");
}

/** Decimal HTML entity: `[0x2605]` → `"&#9733;"`, sequences are concatenated. */
export function formatHtmlEntity(codepoints: number[]): string {
  return codepoints.map((cp) => `&#${cp};`).join("");
}

/** Hexadecimal HTML entity: `[0x2605]` → `"&#x2605;"`, sequences are concatenated. */
export function formatHtmlHex(codepoints: number[]): string {
  return codepoints.map((cp) => `&#x${toHex(cp)};`).join("");
}

/** CSS escape: `[0x2605]` → `"\2605"`, sequences are space-joined. */
export function formatCssEscape(codepoints: number[]): string {
  return codepoints.map((cp) => `\\${toHex(cp)}`).join(" ");
}

/** JS escape: BMP → `"\u2605"`, astral → `"\u{1f600}"`, sequences are concatenated. */
export function formatJsEscape(codepoints: number[]): string {
  return codepoints
    .map((cp) =>
      cp <= 0xffff ? `\\u${toHex(cp).padStart(4, "0")}` : `\\u{${toHex(cp)}}`,
    )
    .join("");
}

/** Character (or sequence) built from code points: `[0x2605]` → `"★"`. */
export function charFromCodepoints(codepoints: number[]): string {
  return String.fromCodePoint(...codepoints);
}
