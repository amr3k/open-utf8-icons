/**
 * Pure code-point formatters shared by the extraction pipeline (`scripts/`)
 * and the runtime dataset decoder (`src/lib/data/unpack.ts`).
 *
 * Every developer-copyable representation in the dataset is a deterministic
 * function of a glyph's code points, so these helpers are the single source
 * of truth for both the committed artifact and the tests that validate it.
 */

/** Lowercase hex without padding: `0x2605` → `"2605"`. */
export function toHex(codepoint: number): string {
  return codepoint.toString(16);
}

/** Uppercase display label, zero-padded to 4 hex digits: `[0x2605]` → `"U+2605"`, `[0x24]` → `"U+0024"`, `[0x1f1fa, 0x1f1f8]` → `"U+1F1FA U+1F1F8"`. */
export function formatCodepoints(codepoints: readonly number[]): string {
  return codepoints
    .map((cp) => `U+${toHex(cp).toUpperCase().padStart(4, "0")}`)
    .join(" ");
}

/** Space-joined decimal values: `[0x1f1fa, 0x1f1f8]` → `"127482 127480"`. */
export function formatDecimals(codepoints: readonly number[]): string {
  return codepoints.map((cp) => cp.toString(10)).join(" ");
}

/** Decimal HTML entity: `[0x2605]` → `"&#9733;"`, sequences are concatenated. */
export function formatHtmlEntity(codepoints: readonly number[]): string {
  return codepoints.map((cp) => `&#${cp};`).join("");
}

/** Hexadecimal HTML entity: `[0x2605]` → `"&#x2605;"`, sequences are concatenated. */
export function formatHtmlHex(codepoints: readonly number[]): string {
  return codepoints.map((cp) => `&#x${toHex(cp)};`).join("");
}

/** CSS escape: `[0x2605]` → `"\2605"`, sequences are space-joined. */
export function formatCssEscape(codepoints: readonly number[]): string {
  return codepoints.map((cp) => `\\${toHex(cp)}`).join(" ");
}

/** JS escape: BMP → `"\u2605"`, astral → `"\u{1f600}"`, sequences are concatenated. */
export function formatJsEscape(codepoints: readonly number[]): string {
  return codepoints
    .map((cp) =>
      cp <= 0xffff ? `\\u${toHex(cp).padStart(4, "0")}` : `\\u{${toHex(cp)}}`,
    )
    .join("");
}

/** Character (or sequence) built from code points: `[0x2605]` → `"★"`. */
export function charFromCodepoints(codepoints: readonly number[]): string {
  return String.fromCodePoint(...codepoints);
}
