/**
 * Glyph record construction: turns a name + code points + category/block
 * into the full `Glyph` shape stored in `icons.json`, complete with every
 * developer-copyable representation and search keywords.
 */

import type { Glyph } from "../../src/lib/data/types.js"
import {
  charFromCodepoints,
  formatCodepoints,
  formatCssEscape,
  formatDecimals,
  formatHtmlEntity,
  formatHtmlHex,
  formatJsEscape,
  toHex,
} from "./formats.js"
import { ALL_CURATED_KEYWORDS, buildKeywords } from "./keywords.js"

export interface GlyphSource {
  /** One code point for regular glyphs, two for flag sequences */
  codepoints: number[]
  /** Official Unicode name (or `FLAG OF <REGION>` for flags) */
  name: string
  /** Unicode general category short code, e.g. "So" */
  category: string
  /** Curated browsing category / Unicode block name */
  block: string
  /** Extra curated keywords (e.g. flag region aliases) */
  extraKeywords?: string[]
}

/** Build a complete dataset glyph from a UCD entry or flag sequence. */
export function buildGlyph(source: GlyphSource): Glyph {
  const { codepoints } = source
  const curated =
    codepoints.length === 1 ? ALL_CURATED_KEYWORDS[formatCodepoints(codepoints)] : undefined
  return {
    char: charFromCodepoints(codepoints),
    name: source.name,
    codepoint: formatCodepoints(codepoints),
    dec: codepoints.length === 1 ? codepoints[0] : formatDecimals(codepoints),
    hex: codepoints.map(toHex).join(" "),
    htmlEntity: formatHtmlEntity(codepoints),
    htmlHex: formatHtmlHex(codepoints),
    cssEscape: formatCssEscape(codepoints),
    jsEscape: formatJsEscape(codepoints),
    category: source.category,
    block: source.block,
    keywords: buildKeywords(source.name, [...(curated ?? []), ...(source.extraKeywords ?? [])]),
  }
}
