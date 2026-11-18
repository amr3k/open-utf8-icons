/**
 * Quick-copy utilities for glyphs (Phase 3 of #1).
 *
 * A single format selection drives the 1-click copy action on every glyph
 * card; the toast confirms what landed on the clipboard. All formats are
 * precomputed in the dataset, so this module only picks a field and talks
 * to the Web Clipboard API (with a legacy fallback for non-secure contexts).
 *
 * The JavaScript escape is intentionally absent — Phase 3 specifies
 * character, HTML, CSS, and code point; the full developer formats
 * (including JS and URL encoding) arrive with the Phase 4 inspector.
 */

import type { Glyph } from "./data/types.js";

/** Formats available for the 1-click quick copy. */
export type CopyFormat = "char" | "html" | "css" | "codepoint";

/** UI metadata for a copy format. */
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

/** Resolve the clipboard text for a glyph in the given format. */
export function getCopyText(glyph: Glyph, format: CopyFormat): string {
  switch (format) {
    case "char":
      return glyph.char;
    case "html":
      return glyph.htmlEntity;
    case "css":
      return glyph.cssEscape;
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
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  textarea.remove();
  return copied;
}
