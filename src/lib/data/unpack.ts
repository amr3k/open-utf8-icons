/**
 * Expand the committed packed dataset (`icons.json`) into the `Glyph`
 * records the app renders and searches.
 *
 * This runs once, at module load, on the browser's main thread — so it does
 * exactly one pass over the rows and derives every copyable representation
 * from the code points instead of reading duplicates from the payload.
 */

import {
  charFromCodepoints,
  formatCodepoints,
  formatCssEscape,
  formatDecimals,
  formatHtmlEntity,
  formatHtmlHex,
  formatJsEscape,
} from "./derive.js";
import {
  PACKED_VERSION,
  type Glyph,
  type IconsDataset,
  type PackedDataset,
} from "./types.js";

const ROW_SEPARATOR = "\n";
const FIELD_SEPARATOR = "|";
const KEYWORD_SEPARATOR = ",";

/** Read a dictionary entry, failing loudly on a corrupt packed artifact. */
function dictionaryValue<T>(
  values: readonly T[],
  index: number,
  label: string,
): T {
  const value = values[index];
  if (value === undefined) {
    throw new Error(`packed dataset: invalid ${label} index ${index}`);
  }
  return value;
}

/**
 * Decode the packed wire format.
 *
 * Rows are `hex|name|category|script|block|keywords`; see `PackedDataset`
 * for the full contract. Throws when the artifact is truncated or malformed,
 * so a stale or corrupt build fails at load instead of rendering bad data.
 */
export function unpackDataset(packed: PackedDataset): IconsDataset {
  if (packed.version !== PACKED_VERSION) {
    throw new Error(
      `packed dataset: unsupported version ${packed.version} (expected ${PACKED_VERSION})`,
    );
  }

  const rows = packed.rows.split(ROW_SEPARATOR);
  const glyphs: Glyph[] = [];

  for (const row of rows) {
    if (row === "") continue;

    const fields = row.split(FIELD_SEPARATOR);
    const hex = fields[0];
    const name = fields[1];
    const categoryIndex = fields[2];
    const scriptIndex = fields[3];
    const blockIndex = fields[4];
    const keywordField = fields[5];
    if (
      hex === undefined ||
      name === undefined ||
      categoryIndex === undefined ||
      scriptIndex === undefined ||
      blockIndex === undefined ||
      keywordField === undefined
    ) {
      throw new Error(`packed dataset: malformed row ${JSON.stringify(row)}`);
    }

    const parts = hex.split(" ");
    const codepoints = parts.map((part) => Number.parseInt(part, 16));

    glyphs.push({
      char: charFromCodepoints(codepoints),
      name,
      codepoint: formatCodepoints(codepoints),
      dec:
        codepoints.length === 1 ? codepoints[0]! : formatDecimals(codepoints),
      hex,
      htmlEntity: formatHtmlEntity(codepoints),
      htmlHex: formatHtmlHex(codepoints),
      cssEscape: formatCssEscape(codepoints),
      jsEscape: formatJsEscape(codepoints),
      category: dictionaryValue(
        packed.categories,
        Number.parseInt(categoryIndex, 10),
        "category",
      ),
      script: dictionaryValue(
        packed.scripts,
        Number.parseInt(scriptIndex, 10),
        "script",
      ),
      block: dictionaryValue(
        packed.blocks,
        Number.parseInt(blockIndex, 10),
        "block",
      ),
      keywords:
        keywordField === "" ? [] : keywordField.split(KEYWORD_SEPARATOR),
    });
  }

  if (glyphs.length !== packed.count) {
    throw new Error(
      `packed dataset: decoded ${glyphs.length} glyphs but the artifact declares ${packed.count}`,
    );
  }

  return {
    version: packed.version,
    unicode: packed.unicode,
    generated: packed.generated,
    count: glyphs.length,
    glyphs,
  };
}
