import { describe, expect, test } from "bun:test";
import {
  getThemeColor,
  resolveTheme,
  THEME_COLORS,
  THEME_STORAGE_KEY,
} from "./theme-utils.js";

describe("theme utilities", () => {
  test("resolveTheme resolves explicit light and dark modes regardless of system preference", () => {
    expect(resolveTheme("light", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("dark", true)).toBe("dark");
  });

  test("resolveTheme resolves system mode according to systemPrefersDark", () => {
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("system", true)).toBe("dark");
  });

  test("storage keys stay stable across releases", () => {
    expect(THEME_STORAGE_KEY).toBe("theme");
  });

  test("getThemeColor matches the document surfaces", () => {
    expect(getThemeColor("light")).toBe("#ffffff");
    expect(getThemeColor("dark")).toBe("#09090b");
    expect(THEME_COLORS).toEqual({ light: "#ffffff", dark: "#09090b" });
  });

  test("the pre-hydration bootstrap knows both theme colors", async () => {
    const html = await Bun.file("src/app.html").text();
    expect(html).toContain(`content="${THEME_COLORS.light}"`);
    expect(html).toContain(`"${THEME_COLORS.dark}"`);
  });
});
