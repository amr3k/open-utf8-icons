/**
 * Invariants for the Phase 6 branding and SEO assets.
 *
 * Social cards and favicons fail silently: a renamed file or a relative
 * `og:image` still ships, it just stops previewing. These tests validate the
 * committed assets and the metadata that references them.
 */

import { describe, expect, test } from "bun:test";
import {
  absoluteUrl,
  canonicalUrl,
  OG_IMAGE,
  OG_IMAGE_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "./seo.js";

const APP_TEMPLATE_PATH = "src/app.html";
const LAYOUT_PATH = "src/routes/+layout.svelte";
const HOME_PATH = "src/routes/+page.svelte";
const README_PATH = "README.md";
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const ICO_SIGNATURE = [0, 0, 1, 0];

interface PngSize {
  width: number;
  height: number;
}

/** Read the IHDR width/height from a PNG without an image dependency. */
function readPngSize(bytes: Uint8Array): PngSize | null {
  if (bytes.length < 24) return null;
  if (!PNG_SIGNATURE.every((byte, index) => bytes[index] === byte)) {
    return null;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

async function readBytes(path: string): Promise<Uint8Array> {
  return new Uint8Array(await Bun.file(path).arrayBuffer());
}

describe("site metadata", () => {
  test("describes the site with concise, absolute values", () => {
    expect(SITE_URL).toBe("https://utf8.a3k.me");
    expect(SITE_NAME).toBe("open-utf8-icons");
    expect(SITE_TITLE.length).toBeLessThanOrEqual(60);
    expect(SITE_DESCRIPTION.length).toBeGreaterThanOrEqual(80);
    expect(SITE_DESCRIPTION.length).toBeLessThanOrEqual(160);
    expect(OG_IMAGE.path).toBe("/og-image.png");
    expect(OG_IMAGE.width).toBe(1200);
    expect(OG_IMAGE.height).toBe(630);
    expect(OG_IMAGE_URL).toBe("https://utf8.a3k.me/og-image.png");
  });

  test("builds absolute URLs against the production origin", () => {
    expect(absoluteUrl("/")).toBe("https://utf8.a3k.me/");
    expect(absoluteUrl("og-image.png")).toBe(
      "https://utf8.a3k.me/og-image.png",
    );
  });

  test("canonical URLs drop queries, fragments, and duplicate slashes", () => {
    expect(canonicalUrl("/")).toBe("https://utf8.a3k.me/");
    expect(canonicalUrl("")).toBe("https://utf8.a3k.me/");
    expect(canonicalUrl("/offline")).toBe("https://utf8.a3k.me/offline");
    expect(canonicalUrl("offline")).toBe("https://utf8.a3k.me/offline");
    expect(canonicalUrl("/?q=%E2%98%85")).toBe("https://utf8.a3k.me/");
    expect(canonicalUrl("/#top")).toBe("https://utf8.a3k.me/");
    expect(canonicalUrl("//offline")).toBe("https://utf8.a3k.me/offline");
  });
});

describe("document metadata", () => {
  test("the layout ships Open Graph tags backed by seo.ts", async () => {
    const layout = await Bun.file(LAYOUT_PATH).text();
    for (const property of [
      "og:type",
      "og:site_name",
      "og:title",
      "og:description",
      "og:url",
      "og:image",
      "og:image:type",
      "og:image:width",
      "og:image:height",
      "og:image:alt",
      "og:locale",
    ]) {
      expect(layout).toContain(`property="${property}"`);
    }
    expect(layout).toContain("content={SITE_NAME}");
    expect(layout).toContain("content={SITE_TITLE}");
    expect(layout).toContain("content={SITE_DESCRIPTION}");
    expect(layout).toContain("content={OG_IMAGE_URL}");
    expect(layout).toContain("content={String(OG_IMAGE.width)}");
    expect(layout).toContain("content={String(OG_IMAGE.height)}");
    expect(layout).toContain('property="og:image:type" content="image/png"');
    expect(layout).toContain('property="og:locale" content="en_US"');
  });

  test("the layout ships Twitter summary_large_image tags", async () => {
    const layout = await Bun.file(LAYOUT_PATH).text();
    expect(layout).toContain(
      'name="twitter:card" content="summary_large_image"',
    );
    expect(layout).toContain('name="twitter:title"');
    expect(layout).toContain('name="twitter:description"');
    expect(layout).toContain('name="twitter:image"');
    expect(layout).toContain('name="twitter:image:alt"');
  });

  test("app.html sets a dynamic-capable theme color and icon set", async () => {
    const html = await Bun.file(APP_TEMPLATE_PATH).text();
    expect(html).toContain('name="theme-color" content="#ffffff"');
    expect(html).toContain("themeColor.setAttribute");
    expect(html).toContain('rel="icon"');
    expect(html).toContain("favicon.svg");
    expect(html).toContain("favicon.ico");
    expect(html).toContain("favicon-32.png");
    expect(html).toContain("favicon-16.png");
    expect(html).toContain('rel="apple-touch-icon"');
    expect(html).toContain('rel="manifest"');
  });

  test("only routes own the document title", async () => {
    const template = await Bun.file(APP_TEMPLATE_PATH).text();
    const layout = await Bun.file(LAYOUT_PATH).text();
    const home = await Bun.file(HOME_PATH).text();
    expect(template).not.toContain("<title>");
    expect(layout).toContain('rel="canonical"');
    expect(layout).toContain('property="og:url"');
    expect(layout).toContain("canonicalUrl(page.url.pathname)");
    expect(home).toContain("<title>");
    expect(home).toContain("SITE_TITLE");
  });

  test("the offline page stays out of the index", async () => {
    const offline = await Bun.file("src/routes/offline/+page.svelte").text();
    expect(offline).toContain('<meta name="robots" content="noindex" />');
    expect(offline).toContain("<title>Offline — open-utf8-icons</title>");
  });
});

describe("brand assets", () => {
  test("the Open Graph card is a 1200×630 PNG", async () => {
    const bytes = await readBytes("static/og-image.png");
    expect([...bytes.slice(0, PNG_SIGNATURE.length)]).toEqual(PNG_SIGNATURE);
    expect(readPngSize(bytes)).toEqual({
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
    });
  });

  test("the favicon set exists and is valid", async () => {
    const svg = await Bun.file("static/favicon.svg").text();
    expect(svg).toContain("ツ");
    expect(svg).toContain('viewBox="0 0 64 64"');

    const faviconPngs: { path: string; size: number }[] = [
      { path: "static/favicon-16.png", size: 16 },
      { path: "static/favicon-32.png", size: 32 },
    ];
    for (const { path, size } of faviconPngs) {
      const bytes = await readBytes(path);
      expect(readPngSize(bytes)).toEqual({ width: size, height: size });
    }

    const ico = await readBytes("static/favicon.ico");
    expect([...ico.slice(0, ICO_SIGNATURE.length)]).toEqual(ICO_SIGNATURE);
    const count = new DataView(
      ico.buffer,
      ico.byteOffset,
      ico.byteLength,
    ).getUint16(4, true);
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("robots.txt advertises the sitemap and the sitemap is canonical", async () => {
    const robots = await Bun.file("static/robots.txt").text();
    expect(robots).toContain(`Sitemap: ${absoluteUrl("/sitemap.xml")}`);

    const sitemap = await Bun.file("static/sitemap.xml").text();
    expect(sitemap).toContain(`<loc>${absoluteUrl("/")}</loc>`);
    expect(sitemap).not.toContain("/offline");
  });
});

describe("README", () => {
  test("documents branding, SEO, contributions, and Phase 6 completion", async () => {
    const readme = await Bun.file(README_PATH).text();
    expect(readme).toContain("Branding, SEO & Social Assets");
    expect(readme).toContain("Contributing");
    expect(readme).toContain("[x] **Phase 6: Branding, SEO & Social Assets**");
    expect(readme).toContain("https://utf8.a3k.me");
  });
});
