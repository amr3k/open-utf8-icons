/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/**
 * Offline-first service worker (Phase 5 of #1).
 *
 * Install precaches the application shell, every static asset (manifest,
 * icons, favicon) and the code-split dataset bundle, then keeps a versioned
 * cache per deployment. Navigations are network-first with the cached shell
 * and `/offline` fallback; immutable build output is cache-first; the rest
 * revalidates in the background. Strategy decisions live in
 * `src/lib/sw-policy.ts` where they are unit tested.
 *
 * The Unicode dataset is imported by `dataset.ts`, so it is part of the
 * immutable JS bundle and is cached with the shell — offline search needs no
 * extra request.
 */

import { dev, version } from "$app/env";
import { assets, immutable, prerendered } from "$app/manifest";
import { asset, resolve } from "$app/paths";
import { self } from "$app/service-worker";

import {
  CACHE_PREFIX,
  createCacheName,
  isCacheableResponse,
  requestStrategy,
  type FetchStrategy,
} from "../lib/sw-policy.js";

const CACHE_NAME = createCacheName(version);
const ROOT_PATH = resolve("/");
const OFFLINE_PATH = resolve("/offline");

/** Build output paths are base-relative; this app is deployed at the root. */
function buildPath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

/** Everything fetched once during install, deduplicated and prefixed. */
const PRECACHE_URLS: string[] = [
  ...new Set<string>([
    ...immutable.map((entry) => buildPath(entry.path)),
    ...assets.map((entry) => asset(entry.path)),
    ...prerendered.map((entry) => resolve(entry.path)),
    ROOT_PATH,
    OFFLINE_PATH,
  ]),
];
const PRECACHED_URLS: ReadonlySet<string> = new Set(PRECACHE_URLS);

self.addEventListener("install", (event) => {
  if (dev) return;

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_URLS);
    })(),
  );
});

self.addEventListener("activate", (event) => {
  if (dev) return;

  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith(`${CACHE_PREFIX}-`) && key !== CACHE_NAME) {
          await caches.delete(key);
        }
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  if (dev) return;

  const { request } = event;
  const url = new URL(request.url);
  const strategy = requestStrategy({
    method: request.method,
    mode: request.mode,
    sameOrigin: url.origin === self.location.origin,
    pathname: url.pathname,
    precached: PRECACHED_URLS.has(url.pathname),
  });

  if (strategy === "network-only") return;
  event.respondWith(respond(event, request, strategy));
});

/** Strategies that read or write Cache Storage. */
type CachedStrategy = Exclude<FetchStrategy, "network-only">;

type CacheResponder = (
  event: FetchEvent,
  request: Request,
  cache: Cache,
) => Promise<Response>;

/** One handler per cached strategy, looked up once per request. */
const RESPONDERS: Record<CachedStrategy, CacheResponder> = {
  "cache-first": async (_event, request, cache) => {
    const cached = await cache.match(request, { ignoreSearch: true });
    return cached ?? fetchAndCache(cache, request);
  },

  "network-first": async (_event, request, cache) => {
    try {
      return await fetchAndCache(cache, request);
    } catch (error) {
      const fallback =
        (await cache.match(request, { ignoreSearch: true })) ??
        (await cache.match(OFFLINE_PATH)) ??
        (await cache.match(ROOT_PATH));
      if (fallback) return fallback;
      throw error;
    }
  },

  // Stale-while-revalidate: answer from cache immediately, refresh quietly.
  "stale-while-revalidate": async (event, request, cache) => {
    const cached = await cache.match(request, { ignoreSearch: true });
    const revalidation = fetchAndCache(cache, request);
    if (cached) {
      event.waitUntil(revalidation.catch(() => undefined));
      return cached;
    }
    return revalidation;
  },
};

/** Apply one caching strategy to a request. */
async function respond(
  event: FetchEvent,
  request: Request,
  strategy: CachedStrategy,
): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  return RESPONDERS[strategy](event, request, cache);
}

/** Fetch a request and keep a copy when the response allows it. */
async function fetchAndCache(
  cache: Cache,
  request: Request,
): Promise<Response> {
  const response = await fetch(request);
  if (isCacheableResponse(response)) {
    void cache.put(request, response.clone()).catch(() => undefined);
  }
  return response;
}
