/**
 * Site-wide SEO constants and absolute-URL helpers (Phase 6 of #1).
 *
 * `src/routes/+layout.svelte` renders the metadata from these values, while
 * `src/app.html` owns the static icon, manifest and theme-color shell.
 */

/** Production origin, without a trailing slash. */
export const SITE_URL = "https://utf8.a3k.me";

export const SITE_NAME = "open-utf8-icons";

export const SITE_TITLE =
  "open-utf8-icons — Discover & Copy UTF-8 Unicode Glyphs";

export const SITE_DESCRIPTION =
  "open-utf8-icons — High-performance, ad-free web directory for discovering, previewing, and copying native UTF-8 and Unicode glyphs.";

/** Social preview shipped as a static 1200×630 PNG. */
export interface OgImage {
  readonly path: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
}

export const OG_IMAGE: OgImage = {
  path: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "open-utf8-icons brand mark and a grid of Unicode glyphs above the URL utf8.a3k.me",
};

/** Resolve a root-relative path against the production origin. */
export function absoluteUrl(pathname: string): string {
  return `${SITE_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

/**
 * Canonical URL for a page pathname. Query strings and fragments never
 * identify a separate document, so they are dropped; duplicate leading
 * slashes are collapsed so the result always stays on the production origin.
 */
export function canonicalUrl(pathname: string): string {
  const path = pathname.split(/[?#]/, 1)[0] ?? "";
  return absoluteUrl(`/${path.replace(/^\/+/, "")}`);
}

/** Absolute Open Graph / Twitter card image URL. */
export const OG_IMAGE_URL = absoluteUrl(OG_IMAGE.path);
