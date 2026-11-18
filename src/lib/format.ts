/**
 * Format an integer with thousands separators for UI display,
 * e.g. `4021` → `"4,021"`. Locale is pinned so counts render identically
 * on server and client (no hydration mismatches).
 */
export function formatCount(count: number): string {
  return count.toLocaleString("en-US");
}
