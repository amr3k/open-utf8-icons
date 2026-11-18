#!/usr/bin/env bun
/**
 * open-utf8-icons — Unicode dataset extraction pipeline (Phase 2 of #1).
 *
 * Downloads/parses the official Unicode UCD data, curates iconic blocks,
 * enriches every glyph with developer metadata + search keywords, and
 * writes the minified dataset consumed by the web app.
 *
 * Usage:
 *   bun run generate:icons                 # use the pinned Unicode version
 *   bun run generate:icons --force          # re-download the UCD file
 *   bun run generate:icons --unicode 17.0.0 # use a different Unicode version
 *   bun run generate:icons --ucd ./UnicodeData.txt   # use a local UCD file
 *   bun run generate:icons --out src/lib/data/icons.json
 *
 * Output: src/lib/data/icons.json (minified, committed to the repo so the
 * app and CI never need network access).
 */

import { mkdirSync } from "node:fs";
import path from "node:path";
import {
  PACKED_VERSION,
  type Glyph,
  type IconsDataset,
} from "../src/lib/data/types.js";
import { packDataset } from "../src/lib/data/pack.js";
import {
  collectBlockCodepoints,
  CURATED_BLOCKS,
  FLAGS_BLOCK,
} from "./lib/blocks.js";
import {
  flagCodepoints,
  flagEntryName,
  flagKeywords,
  FLAG_REGIONS,
} from "./lib/flags.js";
import { formatCodepoints } from "./lib/formats.js";
import { buildGlyph } from "./lib/glyph.js";
import { ALL_CURATED_KEYWORDS } from "./lib/keywords.js";
import {
  loadUcdFile,
  loadUnicodeData,
  parseUnicodeData,
  type UcdOrigin,
} from "./lib/ucd.js";
import {
  parseScriptsData,
  scriptForCodePoint,
  type ScriptRange,
} from "./lib/unicode-scripts.js";

/** Dataset schema version — bump when the output shape changes incompatibly. */
const SCHEMA_VERSION = PACKED_VERSION;

/** Default Unicode version to extract from. Bump to refresh the dataset. */
const DEFAULT_UNICODE_VERSION = "16.0.0";

/** Roadmap target for the curated glyph count (issue #1, Phase 2). */
const TARGET_RANGE: [number, number] = [3000, 5000];

/** Local cache directory for downloaded UCD files (git-ignored). */
const CACHE_DIR = ".cache";

const DEFAULT_OUT_PATH = "src/lib/data/icons.json";

interface CliOptions {
  unicodeVersion: string;
  outPath: string;
  localUcdPath?: string;
  localScriptsPath?: string;
  force: boolean;
}

function printUsage(): void {
  console.log(`Usage: bun run scripts/generate-icons.ts [options]

Options:
  --unicode <version>  Unicode version to extract (default: ${DEFAULT_UNICODE_VERSION})
  --out <path>         Output JSON path (default: ${DEFAULT_OUT_PATH})
  --ucd <path>         Use a local UnicodeData.txt instead of downloading
  --scripts <path>     Use a local Scripts.txt instead of downloading
  --force              Re-download the UCD files even if cached
  -h, --help           Show this help`);
}

function parseArgs(argv: string[]): CliOptions | null {
  const opts: CliOptions = {
    unicodeVersion: DEFAULT_UNICODE_VERSION,
    outPath: DEFAULT_OUT_PATH,
    force: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = (): string => {
      const next = argv[i + 1];
      if (next === undefined) {
        console.error(`Missing value for ${arg}`);
        return "";
      }
      i++;
      return next;
    };
    switch (arg) {
      case "--force":
        opts.force = true;
        break;
      case "--ucd":
        opts.localUcdPath = value();
        break;
      case "--scripts":
        opts.localScriptsPath = value();
        break;
      case "--out":
        opts.outPath = value();
        break;
      case "--unicode":
        opts.unicodeVersion = value();
        break;
      case "-h":
      case "--help":
        printUsage();
        return null;
      default:
        console.error(`Unknown option: ${arg}`);
        printUsage();
        return null;
    }
  }
  return opts;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Plain lexicographic sort — deterministic across machines and locales. */
function compareByName(a: { name: string }, b: { name: string }): number {
  if (a.name < b.name) return -1;
  if (a.name > b.name) return 1;
  return 0;
}

interface ExtractionResult {
  glyphs: Glyph[];
  blockCounts: Map<string, number>;
  unusedCuratedKeys: string[];
}

function extractGlyphs(
  entries: Map<number, { name: string; category: string }>,
  scriptRanges: readonly ScriptRange[],
): ExtractionResult {
  const glyphs: Glyph[] = [];
  const blockCounts = new Map<string, number>();
  const usedKeys = new Set<string>();
  const unusedCuratedKeys = new Set(Object.keys(ALL_CURATED_KEYWORDS));

  for (const block of CURATED_BLOCKS) {
    let included = 0;
    for (const cp of collectBlockCodepoints(block)) {
      const entry = entries.get(cp);
      if (!entry) continue; // unassigned in this Unicode version — skip
      const key = formatCodepoints([cp]);
      if (usedKeys.has(key)) continue; // safety: never emit a code point twice
      usedKeys.add(key);
      unusedCuratedKeys.delete(key);
      glyphs.push(
        buildGlyph({
          codepoints: [cp],
          name: entry.name,
          category: entry.category,
          script: scriptForCodePoint(scriptRanges, cp),
          block: block.name,
        }),
      );
      included++;
    }
    blockCounts.set(block.name, included);
  }

  const sortedRegions = [...FLAG_REGIONS].sort(compareByName);
  for (const region of sortedRegions) {
    const codepoints = flagCodepoints(region.code);
    glyphs.push(
      buildGlyph({
        codepoints,
        name: flagEntryName(region),
        category: "So",
        script: scriptForCodePoint(scriptRanges, codepoints[0] ?? 0),
        block: FLAGS_BLOCK,
        extraKeywords: flagKeywords(region),
      }),
    );
  }
  blockCounts.set(FLAGS_BLOCK, sortedRegions.length);

  return { glyphs, blockCounts, unusedCuratedKeys: [...unusedCuratedKeys] };
}

function printReport(
  result: ExtractionResult,
  unicodeVersion: string,
  origin: UcdOrigin,
  json: string,
  expandedBytes: number,
  outPath: string,
): void {
  const rawBytes = Buffer.byteLength(json, "utf8");
  const gzipBytes = Bun.gzipSync(json).length;
  const saving = Math.round((1 - rawBytes / expandedBytes) * 100);
  console.log(`✓ Wrote ${result.glyphs.length} glyphs → ${outPath}`);
  console.log(`  Source: Unicode ${unicodeVersion} UCD (${origin})`);
  console.log(
    `  Payload: ${formatBytes(rawBytes)} raw / ${formatBytes(gzipBytes)} gzip (packed, ` +
      `${saving}% smaller than the ${formatBytes(expandedBytes)} expanded form)`,
  );
  for (const [block, count] of result.blockCounts) {
    console.log(`    ${block.padEnd(42)} ${String(count).padStart(4)}`);
  }
  const [min, max] = TARGET_RANGE;
  if (result.glyphs.length < min || result.glyphs.length > max) {
    console.warn(
      `⚠ Glyph count ${result.glyphs.length} is outside the roadmap target of ~${min}–${max}. ` +
        `Adjust the curated blocks in scripts/lib/blocks.ts.`,
    );
  }
  if (result.unusedCuratedKeys.length > 0) {
    console.warn(
      `⚠ Curated keywords matched no glyph (${result.unusedCuratedKeys.join(", ")}) — ` +
        `check the code points in scripts/lib/keywords.ts.`,
    );
  }
}

async function main(): Promise<void> {
  const opts = parseArgs(Bun.argv.slice(2));
  if (!opts) {
    process.exitCode = 1;
    return;
  }

  const ucdBaseUrl = `https://www.unicode.org/Public/${opts.unicodeVersion}/ucd`;
  const source = await loadUnicodeData({
    url: `${ucdBaseUrl}/UnicodeData.txt`,
    cachePath: path.join(CACHE_DIR, `UnicodeData-${opts.unicodeVersion}.txt`),
    localPath: opts.localUcdPath,
    force: opts.force,
  });
  const scriptsSource = await loadUcdFile({
    url: `${ucdBaseUrl}/Scripts.txt`,
    cachePath: path.join(CACHE_DIR, `Scripts-${opts.unicodeVersion}.txt`),
    localPath: opts.localScriptsPath,
    force: opts.force,
    label: "Scripts.txt",
  });

  console.log("ツ open-utf8-icons — dataset extraction");
  console.log(`  Unicode version: ${opts.unicodeVersion}`);
  console.log(`  UCD source: ${source.origin}`);

  const entries = parseUnicodeData(source.text);
  console.log(`  Parsed ${entries.size} assigned code points`);

  const scriptRanges = parseScriptsData(scriptsSource.text);
  console.log(
    `  Scripts source: ${scriptsSource.origin} (${scriptRanges.length} ranges)`,
  );

  const result = extractGlyphs(entries, scriptRanges);
  const dataset: IconsDataset = {
    version: SCHEMA_VERSION,
    unicode: opts.unicodeVersion,
    generated: new Date().toISOString().slice(0, 10),
    count: result.glyphs.length,
    glyphs: result.glyphs,
  };
  const expandedBytes = Buffer.byteLength(JSON.stringify(dataset));
  const packed = packDataset(dataset);
  const json = JSON.stringify(packed);

  mkdirSync(path.dirname(opts.outPath), { recursive: true });
  await Bun.write(opts.outPath, json);
  printReport(
    result,
    opts.unicodeVersion,
    source.origin,
    json,
    expandedBytes,
    opts.outPath,
  );
}

if (import.meta.main) {
  await main();
}
