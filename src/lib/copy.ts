/**
 * Quick-copy and developer-format utilities for glyphs (Phases 3 & 4 of #1).
 *
 * Phase 3 ships a single format selection that drives the 1-click copy
 * action on every glyph card. Phase 4 adds the full developer set — hex HTML
 * entities, JavaScript escapes and URL encoding — surfaced by the glyph
 * inspector. All formats are precomputed in the dataset (except URL encoding,
 * which is derived from the character), so this module only picks a field and
 * talks to the Web Clipboard API (with a legacy fallback).
 */

import type { Glyph } from "./data/types.js";

/** Formats available for the 1-click quick copy. */
export type CopyFormat = "char" | "html" | "css" | "codepoint";

/** Every copyable representation exposed by the glyph inspector. */
export type DeveloperFormat = CopyFormat | "htmlHex" | "js" | "url";

/** UI metadata for a quick-copy format. */
export interface CopyFormatOption {
  id: CopyFormat;
  /** Compact pill label shown in the UI. */
  label: string;
  /** Tooltip explaining what gets copied. */
  hint: string;
}

/** Ordered pill options shown next to the search bar. */
export const COPY_FORMATS: readonly CopyFormatOption[] = [
  { id: "char", label: "Char", hint: "Copy the character itself, e.g. ★" },
  {
    id: "html",
    label: "HTML",
    hint: "Copy the decimal HTML entity, e.g. &#9733;",
  },
  { id: "css", label: "CSS", hint: "Copy the CSS escape, e.g. \\2605" },
  {
    id: "codepoint",
    label: "U+",
    hint: "Copy the Unicode code point, e.g. U+2605",
  },
];

/** UI metadata for a developer format row in the inspector. */
export interface DeveloperFormatOption {
  id: DeveloperFormat;
  /** Full label shown in the inspector. */
  label: string;
  /** Tooltip explaining what gets copied. */
  hint: string;
}

/** Ordered rows shown in the inspector's copy panel. */
export const DEVELOPER_FORMATS: readonly DeveloperFormatOption[] = [
  {
    id: "char",
    label: "Character",
    hint: "Copy the character itself, e.g. ★",
  },
  {
    id: "html",
    label: "HTML entity (decimal)",
    hint: "Copy the decimal HTML entity, e.g. &#9733;",
  },
  {
    id: "htmlHex",
    label: "HTML entity (hex)",
    hint: "Copy the hexadecimal HTML entity, e.g. &#x2605;",
  },
  {
    id: "css",
    label: "CSS escape",
    hint: "Copy the CSS escape, e.g. \\2605",
  },
  {
    id: "js",
    label: "JavaScript escape",
    hint: "Copy the JavaScript escape, e.g. \\u2605",
  },
  {
    id: "url",
    label: "URL encoded",
    hint: "Copy the UTF-8 percent-encoded sequence, e.g. %E2%98%85",
  },
  {
    id: "codepoint",
    label: "Code point",
    hint: "Copy the Unicode code point, e.g. U+2605",
  },
];

const DEVELOPER_FORMAT_IDS: ReadonlySet<string> = new Set(
  DEVELOPER_FORMATS.map((format) => format.id),
);

/** Type guard used when restoring persisted recent copies from storage. */
export function isDeveloperFormat(value: unknown): value is DeveloperFormat {
  return typeof value === "string" && DEVELOPER_FORMAT_IDS.has(value);
}

/** Resolve the clipboard text for a glyph in the given format. */
export function getCopyText(glyph: Glyph, format: DeveloperFormat): string {
  switch (format) {
    case "char":
      return glyph.char;
    case "html":
      return glyph.htmlEntity;
    case "htmlHex":
      return glyph.htmlHex;
    case "css":
      return glyph.cssEscape;
    case "js":
      return glyph.jsEscape;
    case "url":
      return encodeURIComponent(glyph.char);
    case "codepoint":
      return glyph.codepoint;
  }
}

/**
 * Copy text to the clipboard.
 *
 * Prefers the async Web Clipboard API and falls back to the legacy
 * `execCommand("copy")` dance for older browsers and non-secure contexts
 * (e.g. plain HTTP previews). Returns whether the copy succeeded.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard !== undefined) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy path.
    }
  }

  if (typeof document === "undefined") return false;

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  let copied: boolean;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  textarea.remove();
  return copied;
}
