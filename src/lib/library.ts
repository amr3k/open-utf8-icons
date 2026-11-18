/**
 * Persisted glyph collections (Phase 4 of #1): favorites and recent copies.
 *
 * Pure helpers live here so the serialization/normalization rules are unit
 * tested without a DOM; `library.svelte.ts` wraps them in runes-backed state
 * and talks to `localStorage`. Stored keys are glyph code point labels
 * (`U+2605`), which are stable across dataset regeneration.
 */

import { isDeveloperFormat, type DeveloperFormat } from "./copy.js";

/** Which collection the directory grid is currently showing. */
export type LibraryView = "all" | "favorites" | "recent";

/** localStorage key for the favorites list. */
export const FAVORITES_STORAGE_KEY = "utf8:favorites";

/** localStorage key for the recent copies list. */
export const RECENTS_STORAGE_KEY = "utf8:recents";

/** Maximum number of recent copies kept (one entry per glyph). */
export const MAX_RECENTS = 24;

/** One recently copied glyph, newest first. */
export interface RecentCopy {
  /** Glyph code point label, e.g. `U+2605` */
  key: string;
  /** Format that was copied the last time */
  format: DeveloperFormat;
  /** Epoch milliseconds of the copy */
  at: number;
}

/** Toggle a glyph key in the favorites list, keeping newest first. */
export function toggleFavorite(
  favorites: readonly string[],
  key: string,
): string[] {
  return favorites.includes(key)
    ? favorites.filter((favorite) => favorite !== key)
    : [key, ...favorites];
}

/**
 * Record a copy: move the glyph to the front (one entry per glyph) and cap
 * the list at {@link MAX_RECENTS}.
 */
export function recordRecent(
  recents: readonly RecentCopy[],
  key: string,
  format: DeveloperFormat,
  at: number,
): RecentCopy[] {
  return [
    { key, format, at },
    ...recents.filter((recent) => recent.key !== key),
  ].slice(0, MAX_RECENTS);
}

/** Parse a favorites array, dropping malformed or duplicate entries. */
export function parseFavorites(raw: string | null): string[] {
  const value = parseJson(raw);
  if (!Array.isArray(value)) return [];

  const favorites: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string" || item === "" || seen.has(item)) continue;
    seen.add(item);
    favorites.push(item);
  }
  return favorites;
}

/** Parse recent copies, dropping malformed/duplicate rows and capping size. */
export function parseRecents(raw: string | null): RecentCopy[] {
  const value = parseJson(raw);
  if (!Array.isArray(value)) return [];

  const recents: RecentCopy[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (!isRecord(item)) continue;
    const key = item["key"];
    const format = item["format"];
    const at = item["at"];
    if (typeof key !== "string" || key === "" || seen.has(key)) continue;
    if (!isDeveloperFormat(format)) continue;
    if (typeof at !== "number" || !Number.isFinite(at)) continue;
    seen.add(key);
    recents.push({ key, format, at });
    if (recents.length === MAX_RECENTS) break;
  }
  return recents;
}

/** Narrow a parsed JSON value to a plain object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** `JSON.parse` that turns malformed storage into `null` instead of throwing. */
function parseJson(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
