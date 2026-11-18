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
  method: Request["method"];
  mode: RequestMode;
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
 * - navigations are network-first, even for the precached root, so a fresh
 *   deployment is seen immediately; the cached shell and `/offline` are the
 *   offline fallbacks;
 * - precached build output and static assets are immutable, so cache-first;
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
  if (request.mode === "navigate") return "network-first";
  if (request.precached) return "cache-first";
  return "stale-while-revalidate";
}

/** Build the deployment-scoped cache name. */
export function createCacheName(version: string): string {
  return `${CACHE_PREFIX}-${version}`;
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
