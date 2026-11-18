import { describe, expect, test } from "bun:test";
import { formatCount } from "./format.js";

describe("formatCount", () => {
  test("adds thousands separators", () => {
    expect(formatCount(4021)).toBe("4,021");
    expect(formatCount(999)).toBe("999");
    expect(formatCount(0)).toBe("0");
    expect(formatCount(1000000)).toBe("1,000,000");
  });

  test("is stable across server and client", () => {
    // The locale is pinned to en-US so SSR and hydration agree everywhere.
    expect(formatCount(127487)).toBe("127,487");
  });
});
