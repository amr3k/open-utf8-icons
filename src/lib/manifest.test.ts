/**
 * Invariants for the PWA manifest and its committed icon set (Phase 5 of #1).
 *
 * Installability breaks silently when a manifest field or icon is renamed, so
 * these tests validate the shipped static files themselves.
 */

import { describe, expect, test } from "bun:test";

const MANIFEST_PATH = "static/manifest.webmanifest";
const APP_TEMPLATE_PATH = "src/app.html";
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function loadManifest(): Promise<Record<string, unknown>> {
  const text = await Bun.file(MANIFEST_PATH).text();
  const root: unknown = JSON.parse(text);
  if (!isRecord(root)) throw new Error("manifest root is not an object");
  return root;
}

function readIcons(
  manifest: Record<string, unknown>,
): Record<string, unknown>[] {
  const icons = manifest["icons"];
  if (!Array.isArray(icons)) throw new Error("manifest has no icons array");
  return icons.filter(isRecord);
}

describe("PWA manifest", () => {
  test("defines the install experience", async () => {
    const manifest = await loadManifest();
    expect(manifest["id"]).toBe("/");
    expect(manifest["name"]).toBe("open-utf8-icons");
    expect(manifest["short_name"]).toBe("utf8 icons");
    expect(manifest["start_url"]).toBe("/?source=pwa");
    expect(manifest["scope"]).toBe("/");
    expect(manifest["display"]).toBe("standalone");
    expect(manifest["lang"]).toBe("en");
    expect(manifest["dir"]).toBe("ltr");
    expect(manifest["theme_color"]).toMatch(/^#[0-9a-f]{6}$/i);
    expect(manifest["background_color"]).toMatch(/^#[0-9a-f]{6}$/i);
  });

  test("declares 192px and 512px any and maskable icons", async () => {
    const icons = readIcons(await loadManifest());
    const hasIcon = (sizes: string, purpose: string) =>
      icons.some(
        (icon) =>
          icon["sizes"] === sizes &&
          icon["purpose"] === purpose &&
          icon["type"] === "image/png" &&
          typeof icon["src"] === "string",
      );

    expect(hasIcon("192x192", "any")).toBe(true);
    expect(hasIcon("512x512", "any")).toBe(true);
    expect(hasIcon("192x192", "maskable")).toBe(true);
    expect(hasIcon("512x512", "maskable")).toBe(true);
  });

  test("every declared icon exists and is a valid PNG", async () => {
    const icons = readIcons(await loadManifest());
    expect(icons.length).toBeGreaterThan(0);

    for (const icon of icons) {
      const src = icon["src"];
      expect(typeof src).toBe("string");
      if (typeof src !== "string") continue;
      expect(src.startsWith("/")).toBe(true);

      const path = `static${src}`;
      expect(await Bun.file(path).exists()).toBe(true);
      const bytes = new Uint8Array(await Bun.file(path).arrayBuffer());
      expect([...bytes.slice(0, PNG_SIGNATURE.length)]).toEqual(PNG_SIGNATURE);
    }
  });
});

describe("app.html PWA wiring", () => {
  test("links the manifest, Apple touch icon, and theme color", async () => {
    const html = await Bun.file(APP_TEMPLATE_PATH).text();
    expect(html).toContain('rel="manifest"');
    expect(html).toContain("manifest.webmanifest");
    expect(html).toContain('rel="apple-touch-icon"');
    expect(html).toContain("icons/apple-touch-icon.png");
    expect(html).toContain('name="theme-color"');
  });

  test("Apple touch icon exists and is a valid PNG", async () => {
    const path = "static/icons/apple-touch-icon.png";
    expect(await Bun.file(path).exists()).toBe(true);
    const bytes = new Uint8Array(await Bun.file(path).arrayBuffer());
    expect([...bytes.slice(0, PNG_SIGNATURE.length)]).toEqual(PNG_SIGNATURE);
  });
});
