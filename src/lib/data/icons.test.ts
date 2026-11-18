/**
 * Invariant tests for the committed dataset (`src/lib/data/icons.json`).
 *
 * These re-validate the generated artifact from scratch: the packed wire
 * format, dictionary indexes, row decoding, counts, uniqueness, category and
 * block sanity, and — most importantly — that every derived developer
 * representation equals what the pure formatters in `scripts/lib/formats.ts`
 * produce for the glyph's code points.
 */

import { describe, expect, test } from "bun:test";
import { CURATED_BLOCKS, FLAGS_BLOCK } from "../../../scripts/lib/blocks.js";
import {
  formatCodepoints,
  formatCssEscape,
  formatDecimals,
  formatHtmlEntity,
  formatHtmlHex,
  formatJsEscape,
  toHex,
} from "../../../scripts/lib/formats.js";
import { MAX_KEYWORDS } from "../../../scripts/lib/keywords.js";
import packed from "./icons.json";
import type { Glyph } from "./types.js";
import { CATEGORY_LABELS, PACKED_VERSION } from "./types.js";
import { unpackDataset } from "./unpack.js";
import {
  EXCLUDED_RELIGIOUS_LOOKUP,
  ISLAMIC_CODEPOINTS,
} from "../../../scripts/lib/religion.js";

function parseCodepoints(label: string): number[] {
  return label.split(" ").map((part) => Number.parseInt(part.slice(2), 16));
}

/** Full structural + self-consistency validation of one decoded glyph. */
function glyphIssues(glyph: Glyph): string[] {
  const issues: string[] = [];
  const { char, name, codepoint, dec, hex, category, block, keywords } = glyph;

  const where = `${name} (${codepoint})`;
  const push = (issue: string) => issues.push(`${where}: ${issue}`);

  if (!/^U\+[0-9A-F]{4,6}( U\+[0-9A-F]{4,6})*$/.test(codepoint)) {
    push(`malformed codepoint label "${codepoint}"`);
    return issues;
  }

  const codepoints = parseCodepoints(codepoint);
  const charCps = Array.from(char).map((c) => c.codePointAt(0) ?? -1);
  if (codepoints.join(",") !== charCps.join(","))
    push("char does not match codepoint label");

  if (codepoints.length === 1) {
    if (dec !== codepoints[0]) {
      push(`dec must be ${codepoints[0]} (got ${JSON.stringify(dec)})`);
    }
  } else if (dec !== formatDecimals(codepoints)) {
    push(
      `dec must be a space-joined decimal sequence (got ${JSON.stringify(dec)})`,
    );
  }

  if (hex !== codepoints.map(toHex).join(" ")) push("hex mismatch");
  if (codepoint !== formatCodepoints(codepoints))
    push("codepoint label mismatch");
  if (glyph.htmlEntity !== formatHtmlEntity(codepoints))
    push("htmlEntity mismatch");
  if (glyph.htmlHex !== formatHtmlHex(codepoints)) push("htmlHex mismatch");
  if (glyph.cssEscape !== formatCssEscape(codepoints)) push("cssEscape mismatch");
  if (glyph.jsEscape !== formatJsEscape(codepoints)) push("jsEscape mismatch");

  if (typeof category !== "string" || CATEGORY_LABELS[category] === undefined) {
    push(`unknown category "${JSON.stringify(category)}"`);
  }
  if (typeof block !== "string" || block.length === 0) {
    push(`missing block (${JSON.stringify(block)})`);
  }
  if (name !== name.toUpperCase()) push("name is not uppercase");

  const nameWords = new Set(name.toLowerCase().split(" "));
  if (new Set(keywords).size !== keywords.length) push("duplicate keywords");
  if (keywords.length > MAX_KEYWORDS) {
    push(`has ${keywords.length} keywords (max ${MAX_KEYWORDS})`);
  }
  for (const keyword of keywords) {
    if (keyword !== keyword.toLowerCase()) {
      push(`non-lowercase keyword ${JSON.stringify(keyword)}`);
    }
    if (nameWords.has(keyword)) {
      push(`keyword ${JSON.stringify(keyword)} duplicates a name word`);
    }
    if (keyword.includes("|") || keyword.includes(",")) {
      push(`keyword ${JSON.stringify(keyword)} uses a reserved separator`);
    }
  }

  return issues;
}

describe("committed dataset (src/lib/data/icons.json)", () => {
  test("exists in the packed wire format", async () => {
    expect(packed.version).toBe(PACKED_VERSION);
    expect(typeof packed.unicode).toBe("string");
    expect(packed.unicode).toMatch(/^\d+\.\d+\.\d+$/);
    expect(packed.generated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof packed.count).toBe("number");
    expect(Array.isArray(packed.blocks)).toBe(true);
    expect(Array.isArray(packed.categories)).toBe(true);
    expect(Array.isArray(packed.scripts)).toBe(true);
    expect(typeof packed.rows).toBe("string");
  });

  test("decodes to the declared glyph count within the roadmap target", async () => {
    const dataset = unpackDataset(packed);
    expect(dataset.count).toBe(dataset.glyphs.length);
    expect(dataset.glyphs.length).toBeGreaterThanOrEqual(3000);
    expect(dataset.glyphs.length).toBeLessThanOrEqual(5000);
  });

  test("every glyph is structurally valid, unique and self-consistent", async () => {
    const dataset = unpackDataset(packed);
    const issues: string[] = [];
    const seenCodepoints = new Set<string>();
    for (const glyph of dataset.glyphs) {
      issues.push(...glyphIssues(glyph));
      if (seenCodepoints.has(glyph.codepoint))
        issues.push(`duplicate codepoint ${glyph.codepoint}`);
      seenCodepoints.add(glyph.codepoint);
    }
    // Report a readable sample on failure, then assert the full set is clean.
    expect(issues.slice(0, 25)).toEqual([]);
    expect(issues.length).toBe(0);
  });

  test("covers every curated block and the synthetic Flags block", async () => {
    const dataset = unpackDataset(packed);
    const expectedBlocks = new Set([
      ...CURATED_BLOCKS.map((block) => block.name),
      FLAGS_BLOCK,
    ]);
    const actualBlocks = new Set<string>();
    for (const glyph of dataset.glyphs) actualBlocks.add(glyph.block);

    for (const block of expectedBlocks) {
      expect(
        actualBlocks.has(block),
        `dataset is missing block "${block}"`,
      ).toBe(true);
    }
    for (const block of actualBlocks) {
      expect(
        expectedBlocks.has(block),
        `dataset has unexpected block "${block}"`,
      ).toBe(true);
    }
    const flags = dataset.glyphs.filter((glyph) => glyph.block === FLAGS_BLOCK);
    expect(flags.length).toBeGreaterThanOrEqual(240);
  });

  test("dictionary indexes are unique and complete", async () => {
    for (const [label, values] of [
      ["blocks", packed.blocks],
      ["categories", packed.categories],
      ["scripts", packed.scripts],
    ] as const) {
      expect(new Set(values).size, `${label} has duplicates`).toBe(
        values.length,
      );
      expect(values.length, `${label} is empty`).toBeGreaterThan(0);
    }
  });

  test("keeps Islamic glyphs and drops other religious signs", async () => {
    const dataset = unpackDataset(packed);
    const present = new Set(dataset.glyphs.map((glyph) => glyph.codepoint));

    for (const cp of ISLAMIC_CODEPOINTS) {
      const label = `U+${cp.toString(16).toUpperCase()}`;
      expect(present.has(label), `missing Islamic glyph ${label}`).toBe(true);
    }

    const leaked = dataset.glyphs.filter((glyph) =>
      glyph.codepoint
        .split(" ")
        .some((part) =>
          EXCLUDED_RELIGIOUS_LOOKUP.has(Number.parseInt(part.slice(2), 16)),
        ),
    );
    expect(leaked.map((glyph) => `${glyph.codepoint} ${glyph.name}`)).toEqual(
      [],
    );
  });

  test("spot checks: iconic glyphs are present with full metadata", async () => {
    const dataset = unpackDataset(packed);
    const find = (codepoint: string) =>
      dataset.glyphs.find((glyph) => glyph.codepoint === codepoint);

    const star = find("U+2605");
    expect(star).toBeDefined();
    if (star) {
      expect(star.char).toBe("★");
      expect(star.name).toBe("BLACK STAR");
      expect(star.dec).toBe(9733);
      expect(star.htmlEntity).toBe("&#9733;");
      expect(star.script).toBe("Common");
      expect(star.block).toBe("Miscellaneous Symbols");
      expect(star.keywords).toContain("favorite");
    }

    const dollar = find("U+0024");
    expect(dollar).toBeDefined();
    if (dollar) {
      expect(dollar.name).toBe("DOLLAR SIGN");
      expect(dollar.jsEscape).toBe("\\u0024");
      expect(dollar.block).toBe("Currency Symbols");
    }

    const us = find("U+1F1FA U+1F1F8");
    expect(us).toBeDefined();
    if (us) {
      expect(us.char).toBe("🇺🇸");
      expect(us.name).toBe("FLAG OF UNITED STATES");
      expect(us.jsEscape).toBe("\\u{1f1fa}\\u{1f1f8}");
      expect(us.keywords).toContain("america");
    }
  });
});
