import { describe, expect, test } from "bun:test";
import {
  FLAG_REGIONS,
  flagCodepoints,
  flagEntryName,
  flagKeywords,
  type FlagRegion,
} from "./flags.js";
import { charFromCodepoints, formatCodepoints } from "./formats.js";

describe("flag sequences", () => {
  test("flagCodepoints maps region letters onto regional indicators", () => {
    expect(flagCodepoints("US")).toEqual([0x1f1fa, 0x1f1f8]);
    expect(flagCodepoints("JP")).toEqual([0x1f1ef, 0x1f1f5]);
    expect(formatCodepoints(flagCodepoints("US"))).toBe("U+1F1FA U+1F1F8");
  });

  test("flagCodepoints rejects invalid region codes", () => {
    expect(() => flagCodepoints("us")).toThrow();
    expect(() => flagCodepoints("USA")).toThrow();
    expect(() => flagCodepoints("1A")).toThrow();
  });

  test("flag sequences compose to real flag characters", () => {
    expect(charFromCodepoints(flagCodepoints("US"))).toBe("🇺🇸");
    expect(charFromCodepoints(flagCodepoints("DE"))).toBe("🇩🇪");
    expect(charFromCodepoints(flagCodepoints("JP"))).toBe("🇯🇵");
  });

  test("flagEntryName reads like an official name", () => {
    expect(flagEntryName({ code: "US", name: "United States" })).toBe(
      "FLAG OF UNITED STATES",
    );
  });

  test("flagKeywords contain the flag word, name, code and aliases", () => {
    const region: FlagRegion = {
      code: "US",
      name: "United States",
      aliases: ["usa", "america"],
    };
    expect(flagKeywords(region)).toEqual([
      "flag",
      "united",
      "states",
      "us",
      "usa",
      "america",
    ]);
  });

  test("every curated region has a valid, unique code and a name", () => {
    const codes = new Set<string>();
    for (const region of FLAG_REGIONS) {
      expect(region.code).toMatch(/^[A-Z]{2}$/);
      expect(
        codes.has(region.code),
        `duplicate flag region code ${region.code}`,
      ).toBe(false);
      codes.add(region.code);
      expect(region.name.length).toBeGreaterThan(2);
      for (const alias of region.aliases ?? []) {
        expect(alias).toBe(alias.toLowerCase());
      }
    }
  });

  test("the curated flag set covers the world (240+ regions incl. EU/XK/UN)", () => {
    expect(FLAG_REGIONS.length).toBeGreaterThanOrEqual(240);
    const codes = new Set(FLAG_REGIONS.map((region) => region.code));
    for (const expected of [
      "US",
      "GB",
      "DE",
      "JP",
      "BR",
      "IN",
      "ZA",
      "EU",
      "XK",
      "UN",
    ]) {
      expect(codes.has(expected), `missing flag region ${expected}`).toBe(true);
    }
  });
});
