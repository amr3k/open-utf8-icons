/**
 * Public data contract for the generated Unicode dataset (`src/lib/data/icons.json`).
 *
 * The dataset is produced by `scripts/generate-icons.ts` (Phase 2 of the roadmap
 * tracked in issue #1) and committed in its packed wire format (see
 * {@link PackedDataset}). `unpackDataset` (in `unpack.ts`) expands it into the
 * {@link Glyph} records the UI consumes, deriving every developer-copyable
 * representation from the glyph's code points instead of shipping duplicates.
 */

/** A single Unicode glyph or a multi-codepoint emoji sequence (country flags). */
export interface Glyph {
  /** The character itself, e.g. `★` (or a sequence like `🇺🇸`) */
  char: string;
  /**
   * Official Unicode name in uppercase, e.g. `BLACK STAR`.
   * Flag sequences have no official single name and use `FLAG OF <REGION>`.
   */
  name: string;
  /** Code point display label, e.g. `U+2605` (sequences are space-joined) */
  codepoint: string;
  /** Decimal code point, e.g. `9733`. Sequences use a space-joined string. */
  dec: number | string;
  /** Lowercase hex without padding, e.g. `2605` (sequences are space-joined) */
  hex: string;
  /** Decimal HTML entity, e.g. `&#9733;` */
  htmlEntity: string;
  /** Hexadecimal HTML entity, e.g. `&#x2605;` */
  htmlHex: string;
  /** CSS escape sequence, e.g. `\2605` (sequences are space-joined) */
  cssEscape: string;
  /** JavaScript escape, e.g. `\u2605` (astral code points use `\u{...}`) */
  jsEscape: string;
  /** Unicode general category (short code), e.g. `So` — see {@link CATEGORY_LABELS} */
  category: string;
  /** Unicode script in display form, e.g. `Latin` or `Common` */
  script: string;
  /** Curated browsing category / Unicode block name, e.g. `Miscellaneous Symbols` */
  block: string;
  /** Lowercase search terms: name-derived words plus curated synonyms */
  keywords: string[];
}

/** Schema version of the packed wire format written to `icons.json`. */
export const PACKED_VERSION = 2;

/** Expanded dataset — what the generator builds and the app consumes. */
export interface IconsDataset {
  /** Dataset schema version — bump when the shape changes incompatibly */
  version: number;
  /** Unicode version of the source UCD data, e.g. `16.0.0` */
  unicode: string;
  /** Generation date as `YYYY-MM-DD` */
  generated: string;
  /** Number of glyphs — always equals `glyphs.length` */
  count: number;
  glyphs: Glyph[];
}

/**
 * Packed wire format of `icons.json` (schema version 2).
 *
 * The browser ships this instead of the expanded `Glyph` records: names and
 * keywords are stored once, block/category/script strings become dictionary
 * indexes, and every representation that can be derived from the code points
 * (`char`, `dec`, `hex`, `htmlEntity`, `htmlHex`, `cssEscape`, `jsEscape`,
 * `codepoint`) is computed at load by `unpackDataset`.
 *
 * The result is roughly one seventh of the expanded JSON, which keeps the
 * dataset chunk small enough to parse without blocking the main thread.
 */
export interface PackedDataset {
  /** Schema version of the packed format. */
  version: number;
  /** Unicode version of the source UCD data, e.g. `16.0.0` */
  unicode: string;
  /** Generation date as `YYYY-MM-DD` */
  generated: string;
  /** Number of rows — always equals the number of decoded glyphs. */
  count: number;
  /** Unicode block names, indexed by the block field of each row. */
  blocks: string[];
  /** Unicode general category short codes, indexed per row. */
  categories: string[];
  /** Unicode script names, indexed per row. */
  scripts: string[];
  /**
   * One newline-separated row per glyph:
   * `hex|name|category|script|block|keywords`
   *
   * - `hex`: space-joined lowercase code points, e.g. `2190` or `1f1fa 1f1f8`
   * - `name`: official Unicode name in uppercase
   * - `category` / `script` / `block`: indexes into the dictionaries above
   * - `keywords`: comma-separated lowercase search terms (may be empty)
   *
   * `|`, `,` and newlines never occur inside a name or keyword.
   */
  rows: string;
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
};
