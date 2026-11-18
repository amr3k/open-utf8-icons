/**
 * Curated Unicode block configuration for the dataset extraction pipeline.
 *
 * `name` doubles as the browsing category stored in each glyph's `block`
 * field and drives the order in which glyphs appear in `icons.json`.
 *
 * Most entries map 1:1 to an official Unicode block. Two entries merge a
 * handful of iconic code points from Latin-1 Supplement / Basic Latin into
 * the closest browsing category so that `$`, `£`, `©`, `±`, `×` etc. are
 * reachable without pulling in whole letter/punctuation blocks:
 *
 * - "Currency Symbols" also includes `$` (U+0024), `¢` (U+00A2), `£` (U+00A3),
 *   `¤` (U+00A4) and `¥` (U+00A5).
 * - "Letterlike Symbols" also includes `§` (U+00A7), `©` (U+00A9), `®` (U+00AE),
 *   `µ` (U+00B5) and `°` (U+00B0).
 * - "Mathematical Operators" also includes `¬` (U+00AC), `±` (U+00B1),
 *   `×` (U+00D7) and `÷` (U+00F7).
 *
 * Block ranges are frozen by the Unicode standard; only assignments inside
 * them change between Unicode versions, and unassigned code points are
 * filtered out at generation time.
 */

export interface BlockRange {
  /** First code point of the range (inclusive) */
  start: number
  /** Last code point of the range (inclusive) */
  end: number
}

export interface CuratedBlock {
  /** Browsing category label stored as the glyph `block` value */
  name: string
  /** Code point ranges to include (official Unicode block ranges) */
  ranges: BlockRange[]
  /** Extra individual code points merged into this category */
  codepoints?: number[]
}

/** Ordered curation — also the glyph ordering in the generated dataset. */
export const CURATED_BLOCKS: CuratedBlock[] = [
  { name: "Arrows", ranges: [{ start: 0x2190, end: 0x21ff }] },
  { name: "Supplemental Arrows-A", ranges: [{ start: 0x27f0, end: 0x27ff }] },
  { name: "Supplemental Arrows-B", ranges: [{ start: 0x2900, end: 0x297f }] },
  { name: "Supplemental Arrows-C", ranges: [{ start: 0x1f800, end: 0x1f8ff }] },
  { name: "Miscellaneous Symbols and Arrows", ranges: [{ start: 0x2b00, end: 0x2bff }] },
  {
    name: "Mathematical Operators",
    ranges: [{ start: 0x2200, end: 0x22ff }],
    codepoints: [0xac, 0xb1, 0xd7, 0xf7],
  },
  { name: "Supplemental Mathematical Operators", ranges: [{ start: 0x2a00, end: 0x2aff }] },
  {
    name: "Currency Symbols",
    ranges: [{ start: 0x20a0, end: 0x20cf }],
    codepoints: [0x24, 0xa2, 0xa3, 0xa4, 0xa5],
  },
  {
    name: "Letterlike Symbols",
    ranges: [{ start: 0x2100, end: 0x214f }],
    codepoints: [0xa7, 0xa9, 0xae, 0xb0, 0xb5],
  },
  { name: "Miscellaneous Technical", ranges: [{ start: 0x2300, end: 0x23ff }] },
  { name: "Box Drawing", ranges: [{ start: 0x2500, end: 0x257f }] },
  { name: "Block Elements", ranges: [{ start: 0x2580, end: 0x259f }] },
  { name: "Geometric Shapes", ranges: [{ start: 0x25a0, end: 0x25ff }] },
  { name: "Enclosed Alphanumerics", ranges: [{ start: 0x2460, end: 0x24ff }] },
  { name: "Miscellaneous Symbols", ranges: [{ start: 0x2600, end: 0x26ff }] },
  { name: "Dingbats", ranges: [{ start: 0x2700, end: 0x27bf }] },
  { name: "Emoticons", ranges: [{ start: 0x1f600, end: 0x1f64f }] },
  { name: "Miscellaneous Symbols and Pictographs", ranges: [{ start: 0x1f300, end: 0x1f5ff }] },
  { name: "Transport and Map Symbols", ranges: [{ start: 0x1f680, end: 0x1f6ff }] },
  { name: "Supplemental Symbols and Pictographs", ranges: [{ start: 0x1f900, end: 0x1f9ff }] },
  { name: "Symbols and Pictographs Extended-A", ranges: [{ start: 0x1fa70, end: 0x1faff }] },
]

/** Browsing category used for generated regional-indicator flag sequences. */
export const FLAGS_BLOCK = "Flags"

/**
 * Collect every candidate code point of a curated block, sorted ascending.
 * Unassigned ones are filtered later against the UCD data.
 */
export function collectBlockCodepoints(block: CuratedBlock): number[] {
  const out: number[] = []
  for (const range of block.ranges) {
    for (let cp = range.start; cp <= range.end; cp++) out.push(cp)
  }
  out.push(...(block.codepoints ?? []))
  out.sort((a, b) => a - b)
  return out
}
