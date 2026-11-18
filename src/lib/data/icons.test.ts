/**
 * Invariant tests for the committed dataset (`src/lib/data/icons.json`).
 *
 * These re-validate the generated artifact from scratch: shape, counts,
 * uniqueness, category/block sanity, and — most importantly — that every
 * stored developer representation equals what the pure formatters in
 * `scripts/lib/formats.ts` would produce for the glyph's code points.
 */

import { describe, expect, test } from "bun:test"
import { CURATED_BLOCKS, FLAGS_BLOCK } from "../../../scripts/lib/blocks.js"
import {
  formatCodepoints,
  formatCssEscape,
  formatDecimals,
  formatHtmlEntity,
  formatHtmlHex,
  formatJsEscape,
  toHex,
} from "../../../scripts/lib/formats.js"
import { MAX_KEYWORDS } from "../../../scripts/lib/keywords.js"
import { CATEGORY_LABELS } from "./types.js"

const DATASET_PATH = "src/lib/data/icons.json"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseCodepoints(label: string): number[] {
  return label.split(" ").map((part) => Number.parseInt(part.slice(2), 16))
}

/** Full structural + self-consistency validation of one glyph record. */
function glyphIssues(raw: Record<string, unknown>): string[] {
  const issues: string[] = []

  const char = raw["char"]
  const name = raw["name"]
  const codepoint = raw["codepoint"]
  const dec = raw["dec"]
  const hex = raw["hex"]
  const htmlEntity = raw["htmlEntity"]
  const htmlHex = raw["htmlHex"]
  const cssEscape = raw["cssEscape"]
  const jsEscape = raw["jsEscape"]
  const category = raw["category"]
  const block = raw["block"]
  const keywords = raw["keywords"]

  const strings: Record<string, unknown> = {
    char,
    name,
    codepoint,
    hex,
    htmlEntity,
    htmlHex,
    cssEscape,
    jsEscape,
    category,
    block,
  }
  for (const [field, value] of Object.entries(strings)) {
    if (typeof value !== "string" || value.length === 0) {
      issues.push(`field "${field}" must be a non-empty string (got ${JSON.stringify(value)})`)
    }
  }
  if (issues.length > 0) return issues

  const where = `${name} (${codepoint})`
  const push = (issue: string) => issues.push(`${where}: ${issue}`)

  if (typeof char !== "string" || typeof name !== "string" || typeof codepoint !== "string") {
    return issues // narrowed by the loop above; keeps TS happy below
  }

  if (!/^U\+[0-9A-F]{4,6}( U\+[0-9A-F]{4,6})*$/.test(codepoint)) {
    push(`malformed codepoint label "${codepoint}"`)
    return issues
  }

  const codepoints = parseCodepoints(codepoint)
  const charCps = Array.from(char).map((c) => c.codePointAt(0) ?? -1)
  if (codepoints.join(",") !== charCps.join(",")) push("char does not match codepoint label")

  if (codepoints.length === 1) {
    if (dec !== codepoints[0]) push(`dec must be ${codepoints[0]} (got ${JSON.stringify(dec)})`)
  } else if (dec !== formatDecimals(codepoints)) {
    push(`dec must be a space-joined decimal sequence (got ${JSON.stringify(dec)})`)
  }

  if (hex !== codepoints.map(toHex).join(" ")) push("hex mismatch")
  if (codepoint !== formatCodepoints(codepoints)) push("codepoint label mismatch")
  if (htmlEntity !== formatHtmlEntity(codepoints)) push("htmlEntity mismatch")
  if (htmlHex !== formatHtmlHex(codepoints)) push("htmlHex mismatch")
  if (cssEscape !== formatCssEscape(codepoints)) push("cssEscape mismatch")
  if (jsEscape !== formatJsEscape(codepoints)) push("jsEscape mismatch")

  if (typeof category !== "string" || CATEGORY_LABELS[category] === undefined) {
    push(`unknown category "${JSON.stringify(category)}"`)
  }
  if (name !== name.toUpperCase()) push("name is not uppercase")

  if (!Array.isArray(keywords)) {
    push("keywords is not an array")
  } else {
    if (keywords.length === 0 || keywords.length > MAX_KEYWORDS) {
      push(`has ${keywords.length} keywords (expected 1–${MAX_KEYWORDS})`)
    }
    if (new Set(keywords).size !== keywords.length) push("duplicate keywords")
    for (const keyword of keywords) {
      if (typeof keyword !== "string" || keyword !== keyword.toLowerCase()) {
        push(`non-lowercase keyword ${JSON.stringify(keyword)}`)
      }
    }
  }

  return issues
}

async function loadDataset(): Promise<{ root: Record<string, unknown>; glyphs: unknown[] }> {
  const text = await Bun.file(DATASET_PATH).text()
  const root: unknown = JSON.parse(text)
  if (!isRecord(root)) throw new Error("dataset root is not an object")
  const glyphs = root["glyphs"]
  if (!Array.isArray(glyphs)) throw new Error("dataset has no glyphs array")
  return { root, glyphs }
}

describe("committed dataset (src/lib/data/icons.json)", () => {
  test("exists and has the documented root shape", async () => {
    const { root, glyphs } = await loadDataset()
    expect(root["version"]).toBe(1)
    expect(typeof root["unicode"]).toBe("string")
    expect(root["unicode"]).toMatch(/^\d+\.\d+\.\d+$/)
    expect(root["generated"]).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(typeof root["count"]).toBe("number")
    expect(root["count"]).toBe(glyphs.length)
  })

  test("stays within the roadmap glyph target (~3,000–5,000)", async () => {
    const { glyphs } = await loadDataset()
    expect(glyphs.length).toBeGreaterThanOrEqual(3000)
    expect(glyphs.length).toBeLessThanOrEqual(5000)
  })

  test("every glyph is structurally valid, unique and self-consistent", async () => {
    const { glyphs } = await loadDataset()
    const issues: string[] = []
    const seenCodepoints = new Set<string>()
    for (const raw of glyphs) {
      if (!isRecord(raw)) {
        issues.push(`glyph entry is not an object: ${JSON.stringify(raw)}`)
        continue
      }
      const recordIssues = glyphIssues(raw)
      issues.push(...recordIssues)
      const codepoint = raw["codepoint"]
      if (typeof codepoint === "string") {
        if (seenCodepoints.has(codepoint)) issues.push(`duplicate codepoint ${codepoint}`)
        seenCodepoints.add(codepoint)
      }
    }
    // Report a readable sample on failure, then assert the full set is clean.
    expect(issues.slice(0, 25)).toEqual([])
    expect(issues.length).toBe(0)
  })

  test("covers every curated block and the synthetic Flags block", async () => {
    const { glyphs } = await loadDataset()
    const expectedBlocks = new Set([...CURATED_BLOCKS.map((block) => block.name), FLAGS_BLOCK])
    const actualBlocks = new Set<string>()
    for (const raw of glyphs) {
      if (isRecord(raw) && typeof raw["block"] === "string") {
        actualBlocks.add(raw["block"])
      }
    }
    for (const block of expectedBlocks) {
      expect(actualBlocks.has(block), `dataset is missing block "${block}"`).toBe(true)
    }
    for (const block of actualBlocks) {
      expect(expectedBlocks.has(block), `dataset has unexpected block "${block}"`).toBe(true)
    }
    const flags = glyphs.filter((raw) => isRecord(raw) && raw["block"] === FLAGS_BLOCK)
    expect(flags.length).toBeGreaterThanOrEqual(240)
  })

  test("spot checks: iconic glyphs are present with full metadata", async () => {
    const { glyphs } = await loadDataset()
    const find = (codepoint: string) =>
      glyphs.find((raw) => isRecord(raw) && raw["codepoint"] === codepoint)

    const star = find("U+2605")
    expect(isRecord(star)).toBe(true)
    if (isRecord(star)) {
      expect(star["char"]).toBe("★")
      expect(star["name"]).toBe("BLACK STAR")
      expect(star["dec"]).toBe(9733)
      expect(star["htmlEntity"]).toBe("&#9733;")
      expect(star["block"]).toBe("Miscellaneous Symbols")
      expect(star["keywords"]).toContain("favorite")
    }

    const dollar = find("U+0024")
    expect(isRecord(dollar)).toBe(true)
    if (isRecord(dollar)) {
      expect(dollar["name"]).toBe("DOLLAR SIGN")
      expect(dollar["jsEscape"]).toBe("\\u0024")
      expect(dollar["block"]).toBe("Currency Symbols")
    }

    const us = find("U+1F1FA U+1F1F8")
    expect(isRecord(us)).toBe(true)
    if (isRecord(us)) {
      expect(us["char"]).toBe("🇺🇸")
      expect(us["name"]).toBe("FLAG OF UNITED STATES")
      expect(us["jsEscape"]).toBe("\\u{1f1fa}\\u{1f1f8}")
      expect(us["keywords"]).toContain("america")
    }
  })
})
