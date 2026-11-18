/**
 * Public data contract for the generated Unicode dataset (`src/lib/data/icons.json`).
 *
 * The dataset is produced by `scripts/generate-icons.ts` (Phase 2 of the roadmap
 * tracked in issue #1). Keep this file in sync with the generator output shape.
 */

/** A single Unicode glyph or a multi-codepoint emoji sequence (country flags). */
export interface Glyph {
  /** The character itself, e.g. `★` (or a sequence like `🇺🇸`) */
  char: string
  /**
   * Official Unicode name in uppercase, e.g. `BLACK STAR`.
   * Flag sequences have no official single name and use `FLAG OF <REGION>`.
   */
  name: string
  /** Code point display label, e.g. `U+2605` (sequences are space-joined) */
  codepoint: string
  /** Decimal code point, e.g. `9733`. Sequences use a space-joined string. */
  dec: number | string
  /** Lowercase hex without padding, e.g. `2605` (sequences are space-joined) */
  hex: string
  /** Decimal HTML entity, e.g. `&#9733;` */
  htmlEntity: string
  /** Hexadecimal HTML entity, e.g. `&#x2605;` */
  htmlHex: string
  /** CSS escape sequence, e.g. `\2605` (sequences are space-joined) */
  cssEscape: string
  /** JavaScript escape, e.g. `\u2605` (astral code points use `\u{...}`) */
  jsEscape: string
  /** Unicode general category (short code), e.g. `So` — see {@link CATEGORY_LABELS} */
  category: string
  /** Curated browsing category / Unicode block name, e.g. `Miscellaneous Symbols` */
  block: string
  /** Lowercase search terms: name-derived words plus curated synonyms */
  keywords: string[]
}

/** Root shape of `icons.json`. */
export interface IconsDataset {
  /** Dataset schema version — bump when the shape changes incompatibly */
  version: number
  /** Unicode version of the source UCD data, e.g. `16.0.0` */
  unicode: string
  /** Generation date as `YYYY-MM-DD` */
  generated: string
  /** Number of glyphs — always equals `glyphs.length` */
  count: number
  glyphs: Glyph[]
}

/** Friendly labels for Unicode general category short codes. */
export const CATEGORY_LABELS: Record<string, string> = {
  Lu: "Uppercase Letter",
  Ll: "Lowercase Letter",
  Lt: "Titlecase Letter",
  Lm: "Modifier Letter",
  Lo: "Other Letter",
  Mn: "Nonspacing Mark",
  Mc: "Spacing Mark",
  Me: "Enclosing Mark",
  Nd: "Decimal Digit Number",
  Nl: "Letter Number",
  No: "Other Number",
  Pc: "Connector Punctuation",
  Pd: "Dash Punctuation",
  Ps: "Open Punctuation",
  Pe: "Close Punctuation",
  Pi: "Initial Punctuation",
  Pf: "Final Punctuation",
  Po: "Other Punctuation",
  Sm: "Math Symbol",
  Sc: "Currency Symbol",
  Sk: "Modifier Symbol",
  So: "Other Symbol",
  Zs: "Space Separator",
  Zl: "Line Separator",
  Zp: "Paragraph Separator",
  Cc: "Control",
  Cf: "Format",
  Cs: "Surrogate",
  Co: "Private Use",
  Cn: "Unassigned",
}
