import { describe, expect, test } from "bun:test"
import {
  ALL_CURATED_KEYWORDS,
  buildKeywords,
  keywordsFromName,
  MAX_KEYWORDS,
} from "./keywords.js"

describe("keyword derivation", () => {
  test("lowercases name words and drops stopwords", () => {
    expect(keywordsFromName("FACE WITH TEARS OF JOY")).toEqual(["face", "tears", "joy"])
    expect(keywordsFromName("DOLLAR SIGN")).toEqual(["dollar"])
  })

  test("keeps non-ASCII letters intact", () => {
    expect(keywordsFromName("FLAG OF CÔTE D'IVOIRE")).toEqual(["flag", "côte", "ivoire"])
  })

  test("strips the 'wards' directional suffix into a stem", () => {
    expect(keywordsFromName("LEFTWARDS ARROW")).toEqual(["leftwards", "left", "arrow"])
    expect(keywordsFromName("UPWARDS ARROW")).toEqual(["upwards", "up", "arrow"])
    // "towards" stems into the stopword "to" and is dropped
    expect(keywordsFromName("NORTHWARDS PAIR")).toContain("north")
  })

  test("deduplicates repeated words", () => {
    expect(keywordsFromName("HEAVY HEAVY ASTERISK")).toEqual(["heavy", "asterisk"])
  })

  test("buildKeywords merges curated synonyms after name words", () => {
    expect(buildKeywords("BLACK STAR", ["favorite", "rating"])).toEqual([
      "black",
      "star",
      "favorite",
      "rating",
    ])
  })

  test("buildKeywords deduplicates case-insensitively", () => {
    expect(buildKeywords("BLACK STAR", ["Star", "FAVORITE"])).toEqual([
      "black",
      "star",
      "favorite",
    ])
  })

  test("buildKeywords caps the result at MAX_KEYWORDS", () => {
    const longName = "ONE TWO THREE FOUR FIVE SIX SEVEN EIGHT NINE TEN ELEVEN"
    const keywords = buildKeywords(longName, ["curated"])
    expect(keywords.length).toBe(MAX_KEYWORDS)
  })

  test("curated keyword map only contains lowercase terms and valid keys", () => {
    for (const [key, words] of Object.entries(ALL_CURATED_KEYWORDS)) {
      expect(key).toMatch(/^U\+[0-9A-F]{4,6}$/)
      expect(words.length).toBeGreaterThan(0)
      for (const word of words) {
        expect(word, `${key} has uppercase keyword`).toBe(word.toLowerCase())
        expect(word.length, `${key} has an empty keyword`).toBeGreaterThan(0)
      }
    }
  })

  test("curated map covers iconic headliners", () => {
    expect(ALL_CURATED_KEYWORDS["U+2605"]).toContain("favorite")
    expect(ALL_CURATED_KEYWORDS["U+2713"]).toContain("tick")
    expect(ALL_CURATED_KEYWORDS["U+1F525"]).toContain("fire")
    expect(ALL_CURATED_KEYWORDS["U+0024"]).toContain("dollar")
    expect(ALL_CURATED_KEYWORDS["U+2462"]).toEqual(["3"])
    expect(ALL_CURATED_KEYWORDS["U+24B6"]).toEqual(["a"])
  })
})
