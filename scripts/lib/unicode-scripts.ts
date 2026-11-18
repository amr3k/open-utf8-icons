/**
 * Unicode Script property lookup for the dataset extraction pipeline.
 *
 * `UnicodeData.txt` carries the general category but not the script, so the
 * generator reads the official [Scripts.txt](https://www.unicode.org/reports/tr44/#Scripts.txt)
 * alongside it and attaches the script name to every glyph. The file is a
 * list of inclusive ranges, e.g.:
 *
 * ```text
 * 0041..005A    ; Latin # Lu  [26] LATIN CAPITAL LETTER A..LATIN CAPITAL LETTER Z
 * ```
 *
 * Script names are normalized for display (`Old_Italic` → `Old Italic`).
 * Code points the file does not list default to `Unknown`, matching the
 * `@missing` declaration in the UCD.
 */

export interface ScriptRange {
  /** First code point of the range (inclusive) */
  start: number;
  /** Last code point of the range (inclusive) */
  end: number;
  /** Script name in display form, e.g. "Latin" or "Old Italic" */
  script: string;
}

/** Value assigned to code points with no explicit script entry. */
export const UNKNOWN_SCRIPT = "Unknown";

/** Normalize a UCD script value for display: `Old_Italic` → `Old Italic`. */
export function normalizeScriptName(raw: string): string {
  return raw.trim().replaceAll("_", " ");
}

/**
 * Parse `Scripts.txt` into a range table sorted by code point.
 *
 * Comment-only lines, blank lines and `# @missing:` directives are skipped;
 * malformed data lines are ignored. Overlapping ranges are not expected from
 * the UCD, but when present the later line wins during lookup.
 */
export function parseScriptsData(text: string): ScriptRange[] {
  const ranges: ScriptRange[] = [];

  for (const line of text.split("\n")) {
    const content = line.split("#", 1)[0]?.trim();
    if (content === undefined || content === "") continue;

    const fields = content.split(";");
    if (fields.length < 2) continue;

    const [rangeField, scriptField] = fields;
    const script = normalizeScriptName(scriptField ?? "");
    if (script === "") continue;

    const [startField, endField = startField] = (rangeField ?? "").split("..");
    const start = Number.parseInt(startField ?? "", 16);
    const end = Number.parseInt(endField ?? "", 16);
    if (Number.isNaN(start) || Number.isNaN(end) || start > end) continue;

    ranges.push({ start, end, script });
  }

  return ranges.sort((a, b) => a.start - b.start || a.end - b.end);
}

/**
 * Resolve the script of a code point with a binary search over the range
 * table. Returns {@link UNKNOWN_SCRIPT} when the code point is not covered.
 */
export function scriptForCodePoint(
  ranges: readonly ScriptRange[],
  codepoint: number,
): string {
  let low = 0;
  let high = ranges.length - 1;

  while (low <= high) {
    const mid = (low + high) >>> 1;
    const range = ranges[mid];
    if (range === undefined) break;

    if (codepoint < range.start) {
      high = mid - 1;
    } else if (codepoint > range.end) {
      low = mid + 1;
    } else {
      return range.script;
    }
  }

  return UNKNOWN_SCRIPT;
}
