import { describe, expect, test } from "bun:test"
import { collectBlockCodepoints, CURATED_BLOCKS } from "./blocks.js"

describe("curated blocks", () => {
  test("all block names are unique", () => {
    const names = CURATED_BLOCKS.map((block) => block.name)
    expect(new Set(names).size).toBe(names.length)
  })

  test("ranges are valid", () => {
    for (const block of CURATED_BLOCKS) {
      for (const range of block.ranges) {
        expect(range.start, `${block.name} has an invalid range`).toBeLessThanOrEqual(range.end)
      }
    }
  })

  test("no code point is claimed by two blocks", () => {
    const owners = new Map<number, string>()
    const claim = (cp: number, owner: string) => {
      const previous = owners.get(cp)
      expect(
        previous,
        `U+${cp.toString(16)} is claimed by both ${previous} and ${owner}`,
      ).toBeUndefined()
      owners.set(cp, owner)
    }
    for (const block of CURATED_BLOCKS) {
      for (const range of block.ranges) {
        for (let cp = range.start; cp <= range.end; cp++) claim(cp, block.name)
      }
      for (const cp of block.codepoints ?? []) claim(cp, block.name)
    }
  })

  test("collectBlockCodepoints returns sorted, deduplicated code points", () => {
    const currency = CURATED_BLOCKS.find((block) => block.name === "Currency Symbols")
    if (!currency) throw new Error("Currency Symbols block is missing")
    const cps = collectBlockCodepoints(currency)
    expect(cps[0]).toBe(0x24) // $ first, then ¢ £ ¤ ¥, then the block range
    expect(cps).toContain(0xa5)
    expect(cps.indexOf(0x24)).toBeLessThan(cps.indexOf(0x20a0))
    expect(new Set(cps).size).toBe(cps.length)
  })

  test("curated surface stays within the roadmap target of ~3,000–5,000 glyphs", () => {
    const total = CURATED_BLOCKS.reduce(
      (sum, block) => sum + collectBlockCodepoints(block).length,
      0,
    )
    // Upper bound of all candidate code points (unassigned ones are filtered at
    // generation time, so the real glyph count is strictly lower than this).
    expect(total).toBeLessThan(6000)
    expect(total).toBeGreaterThan(2500)
  })
})
