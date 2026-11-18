/**
 * Pack the expanded dataset into the committed wire format.
 *
 * `icons.json` used to ship one object literal per glyph with thirteen keys,
 * most of which the browser can derive from the code points. Packing keeps a
 * single copy of every name and keyword, moves block/category/script names
 * into dictionaries, and drops the derived representations — the app rebuilds
 * them at load with `unpackDataset`.
 *
 * Layout (see `PackedDataset`):
 *
 *     hex|name|category|script|block|keywords
 *
 * with `\n` between rows. Names and keywords never contain `|`, `,` or
 * newlines, so the format needs no quoting or escaping.
 */

import {
  PACKED_VERSION,
  type Glyph,
  type IconsDataset,
  type PackedDataset,
} from "./types.js";

const ROW_SEPARATOR = "\n";
const FIELD_SEPARATOR = "|";
const KEYWORD_SEPARATOR = ",";

/** Throw when a value would break the separator-based row format. */
function assertPackable(kind: string, value: string): void {
  if (
    value.includes(ROW_SEPARATOR) ||
    value.includes(FIELD_SEPARATOR) ||
    value.includes(KEYWORD_SEPARATOR)
  ) {
    throw new Error(
      `packed dataset: ${kind} contains a reserved separator: ${JSON.stringify(value)}`,
    );
  }
}

/**
 * Keywords already covered by the glyph name are dropped: the search engine
 * matches name words at a higher score tier than keywords, so storing both
 * only bloats the payload.
 */
function keywordsFor(glyph: Glyph): string[] {
  const nameWords = new Set(glyph.name.toLowerCase().split(" "));
  const keywords: string[] = [];
  const seen = new Set<string>();
  for (const keyword of glyph.keywords) {
    if (nameWords.has(keyword) || seen.has(keyword)) continue;
    seen.add(keyword);
    keywords.push(keyword);
  }
  return keywords;
}

/** Dictionary indexes shared by every row of a packed dataset. */
interface Dictionaries {
  blocks: Map<string, number>;
  categories: Map<string, number>;
  scripts: Map<string, number>;
}

/** Dictionary built from a per-glyph string field. */
function dictionaryOf(
  glyphs: readonly Glyph[],
  field: (glyph: Glyph) => string,
): Map<string, number> {
  const index = new Map<string, number>();
  for (const glyph of glyphs) {
    const value = field(glyph);
    assertPackable("dictionary entry", value);
    if (!index.has(value)) index.set(value, index.size);
  }
  return index;
}

/** Serialize one glyph, asserting it fits the separator-based layout. */
function packRow(glyph: Glyph, dictionaries: Dictionaries): string {
  assertPackable("name", glyph.name);
  const keywords = keywordsFor(glyph);
  for (const keyword of keywords) assertPackable("keyword", keyword);
  return [
    glyph.hex,
    glyph.name,
    String(dictionaries.categories.get(glyph.category)),
    String(dictionaries.scripts.get(glyph.script)),
    String(dictionaries.blocks.get(glyph.block)),
    keywords.join(KEYWORD_SEPARATOR),
  ].join(FIELD_SEPARATOR);
}

/** Build the packed payload for a fully expanded dataset. */
export function packDataset(dataset: IconsDataset): PackedDataset {
  const dictionaries: Dictionaries = {
    blocks: dictionaryOf(dataset.glyphs, (glyph) => glyph.block),
    categories: dictionaryOf(dataset.glyphs, (glyph) => glyph.category),
    scripts: dictionaryOf(dataset.glyphs, (glyph) => glyph.script),
  };

  return {
    version: PACKED_VERSION,
    unicode: dataset.unicode,
    generated: dataset.generated,
    count: dataset.glyphs.length,
    blocks: [...dictionaries.blocks.keys()],
    categories: [...dictionaries.categories.keys()],
    scripts: [...dictionaries.scripts.keys()],
    rows: dataset.glyphs.map((glyph) => packRow(glyph, dictionaries)).join(
      ROW_SEPARATOR,
    ),
  };
}
