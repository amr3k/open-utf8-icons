import { describe, expect, test } from "bun:test";
import {
  THEME_COLORS,
  getThemeColor,
  resolveTheme,
  getNextThemeMode,
  getThemeIcon,
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

  test("getNextThemeMode cycles correctly through system -> light -> dark -> system", () => {
    expect(getNextThemeMode("system")).toBe("light");
    expect(getNextThemeMode("light")).toBe("dark");
    expect(getNextThemeMode("dark")).toBe("system");
    // @ts-expect-error test fallback default
    expect(getNextThemeMode("unknown")).toBe("system");
  });

  test("getThemeIcon returns proper native UTF-8 icons without external dependencies", () => {
    expect(getThemeIcon("light")).toBe("☀");
    expect(getThemeIcon("dark")).toBe("☾");
    expect(getThemeIcon("system")).toBe("◑");
  });

  test("getThemeColor matches the browser chrome for each resolved theme", () => {
    expect(getThemeColor("light")).toBe("#ffffff");
    expect(getThemeColor("dark")).toBe("#09090b");
    expect(THEME_COLORS).toEqual({ light: "#ffffff", dark: "#09090b" });
  });
});
