/**
 * Pure service-worker caching policy (Phase 5 of #1).
 *
 * `src/service-worker/index.ts` owns the Cache Storage calls; this module owns
 * the decisions so they can be unit tested in Bun without a Service Worker
 * runtime. Keeping the policy declarative also makes the cache behaviour easy
 * to audit: immutable build output never changes, navigations stay fresh,
 * everything else revalidates in the background.
 */

/** Prefix shared by every cache this app creates. */
export const CACHE_PREFIX = "utf8-icons";

export type FetchStrategy =
  /** Bypass the cache entirely (writes, cross-origin, the worker itself). */
  | "network-only"
  /** Serve a precached response or fetch and store it. */
  | "cache-first"
  /** Prefer fresh HTML; fall back to the cached shell offline. */
  | "network-first"
  /** Serve the cached copy and quietly refresh it in the background. */
  | "stale-while-revalidate";

/** Request facts needed to pick a caching strategy. */
export interface RequestPolicy {
  method: string;
  mode: string;
  sameOrigin: boolean;
  pathname: string;
  /** Whether the pathname was precached during install. */
  precached: boolean;
}

/**
 * Choose a strategy for a request:
 * - anything that isn't a same-origin GET bypasses the cache;
 * - the worker script and SvelteKit's version check are always fetched from
 *   the network so deployments are picked up;
 * - precached build output and static assets are immutable, so cache-first;
 * - navigations are network-first so a fresh deployment is seen immediately,
 *   with the cached app shell / offline page as the fallback;
 * - remaining same-origin assets revalidate in the background.
 */
export function requestStrategy(request: RequestPolicy): FetchStrategy {
  if (request.method !== "GET" || !request.sameOrigin) return "network-only";
  if (
    request.pathname === "/service-worker.js" ||
    request.pathname === "/_app/version.json"
  ) {
    return "network-only";
  }
  if (request.precached) return "cache-first";
  if (request.mode === "navigate") return "network-first";
  return "stale-while-revalidate";
}

/**
 * Build a deployment-scoped cache name. The build version is usually a
 * timestamp, but sanitizing keeps arbitrary `version.name` values safe.
 */
export function createCacheName(version: string): string {
  const safe = version
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .slice(0, 64);
  return `${CACHE_PREFIX}-${safe === "" ? "dev" : safe}`;
}

/** Whether a response is safe to store for offline use. */
export function isCacheableResponse(response: Response): boolean {
  // Partial content cannot be replayed from Cache Storage.
  if (!response.ok || response.status === 206) return false;
  const cacheControl = response.headers.get("cache-control");
  return (
    cacheControl === null || !cacheControl.toLowerCase().includes("no-store")
  );
}
