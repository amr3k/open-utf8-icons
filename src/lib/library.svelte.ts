/**
 * Runes-backed glyph library (Phase 4 of #1).
 *
 * Favorites and recent copies survive reloads through `localStorage`.
 * Persistence is best-effort: private-mode or quota errors degrade to
 * in-memory state instead of breaking the UI. The manager is initialized
 * from the root layout on mount, so server rendering always starts empty
 * and hydration stays consistent.
 */

import type { DeveloperFormat } from "./copy.js";
import {
  FAVORITES_STORAGE_KEY,
  RECENTS_STORAGE_KEY,
  parseFavorites,
  parseRecents,
  recordRecent,
  toggleFavorite as toggleFavoriteKey,
  type RecentCopy,
} from "./library.js";

class LibraryManager {
  /** Favorited glyph keys, newest first. */
  favorites = $state<string[]>([]);

  /** Recently copied glyphs, newest first (one entry per glyph). */
  recents = $state<RecentCopy[]>([]);

  #initialized = false;

  /** Restore persisted collections. Safe to call more than once. */
  init(): void {
    if (typeof window === "undefined" || this.#initialized) return;
    this.favorites = parseFavorites(this.#read(FAVORITES_STORAGE_KEY));
    this.recents = parseRecents(this.#read(RECENTS_STORAGE_KEY));
    this.#initialized = true;
  }

  isFavorite(key: string): boolean {
    return this.favorites.includes(key);
  }

  /** Add or remove a glyph key from favorites and persist the result. */
  toggleFavorite(key: string): void {
    this.favorites = toggleFavoriteKey(this.favorites, key);
    this.#write(FAVORITES_STORAGE_KEY, this.favorites);
  }

  /** Record a successful copy and persist the recent-copies list. */
  recordCopy(key: string, format: DeveloperFormat): void {
    this.recents = recordRecent(this.recents, key, format, Date.now());
    this.#write(RECENTS_STORAGE_KEY, this.recents);
  }

  /** Empty the recent-copies list (also removes its storage entry). */
  clearRecents(): void {
    this.recents = [];
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(RECENTS_STORAGE_KEY);
    } catch {
      // Storage unavailable — in-memory state is already cleared.
    }
  }

  #read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  #write(key: string, value: unknown): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Private mode or quota exceeded — keep the in-memory collection.
    }
  }
}

/** Singleton shared by the page, cards, and inspector. */
export const library = new LibraryManager();
