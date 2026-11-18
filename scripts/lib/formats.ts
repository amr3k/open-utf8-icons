/**
 * Pure formatting helpers that turn Unicode code points into the
 * developer-copyable representations stored per glyph (HTML entities,
 * CSS escapes, JS escapes, code point labels).
 *
 * The implementations live in `src/lib/data/derive.ts` so the extraction
 * pipeline and the runtime dataset decoder share one source of truth; this
 * module keeps the pipeline's historical import path stable.
 */

export {
  charFromCodepoints,
  formatCodepoints,
  formatCssEscape,
  formatDecimals,
  formatHtmlEntity,
  formatHtmlHex,
  formatJsEscape,
  toHex,
} from "../../src/lib/data/derive.js";
