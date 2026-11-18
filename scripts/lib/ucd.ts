/**
 * UnicodeData.txt parsing and loading for the dataset extraction pipeline.
 *
 * The UCD file (https://www.unicode.org/reports/tr44/#UnicodeData.txt) lists
 * every assigned code point with its official name and general category.
 * It is downloaded once per Unicode version and cached on disk so repeat
 * runs and CI regeneration work offline.
 */

import { mkdirSync } from "node:fs";
import path from "node:path";

export interface UcdEntry {
  codepoint: number;
  /** Official Unicode character name (uppercase), e.g. "BLACK STAR" */
  name: string;
  /** General category short code, e.g. "So", "Sc", "No" */
  category: string;
}

export type UcdOrigin = "download" | "cache" | "file";

export interface UcdSource {
  text: string;
  origin: UcdOrigin;
}

/**
 * Parse the semicolon-separated UnicodeData.txt format into a code point map.
 * Unassigned range placeholders (`<CJK Ideograph, First>` etc.) are skipped —
 * none of the curated blocks use ideographic ranges.
 */
export function parseUnicodeData(text: string): Map<number, UcdEntry> {
  const entries = new Map<number, UcdEntry>();
  for (const line of text.split("\n")) {
    if (line.length === 0) continue;
    const fields = line.split(";");
    const codepoint = Number.parseInt(fields[0] ?? "", 16);
    const name = fields[1] ?? "";
    const category = fields[2] ?? "";
    if (
      Number.isNaN(codepoint) ||
      name.startsWith("<") ||
      category.length !== 2
    )
      continue;
    entries.set(codepoint, { codepoint, name, category });
  }
  return entries;
}

export interface LoadUcdOptions {
  /** Canonical download URL of UnicodeData.txt */
  url: string;
  /** Local cache path (created on first download) */
  cachePath: string;
  /** Optional local file to read instead of the URL/cache */
  localPath?: string;
  /** Re-download even if the cache exists */
  force?: boolean;
}

/** Load the UCD file from a local file, cache, or download. */
export async function loadUnicodeData(
  opts: LoadUcdOptions,
): Promise<UcdSource> {
  if (opts.localPath) {
    const file = Bun.file(opts.localPath);
    if (!(await file.exists())) {
      throw new Error(`UCD file not found at ${opts.localPath}`);
    }
    return { text: await file.text(), origin: "file" };
  }

  const cache = Bun.file(opts.cachePath);
  if (!opts.force && (await cache.exists())) {
    return { text: await cache.text(), origin: "cache" };
  }

  const response = await fetch(opts.url);
  if (!response.ok) {
    throw new Error(
      `Failed to download ${opts.url} (HTTP ${response.status}). ` +
        `Download it manually and pass --ucd <path>.`,
    );
  }
  const text = await response.text();
  if (!text.includes(";")) {
    throw new Error(
      `Downloaded file from ${opts.url} does not look like UnicodeData.txt`,
    );
  }
  mkdirSync(path.dirname(opts.cachePath), { recursive: true });
  await Bun.write(opts.cachePath, text);
  return { text, origin: "download" };
}
