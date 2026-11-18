/**
 * Unit tests for service-worker caching policy (`src/lib/sw-policy.ts`).
 *
 * The worker itself needs a browser runtime; these tests pin the decisions
 * that keep the app offline-capable without serving stale build output.
 */

import { describe, expect, test } from "bun:test";
import {
  CACHE_PREFIX,
  createCacheName,
  isCacheableResponse,
  requestStrategy,
  type RequestPolicy,
} from "./sw-policy.js";

const base: RequestPolicy = {
  method: "GET",
  mode: "no-cors",
  sameOrigin: true,
  pathname: "/icons/icon-192.png",
  precached: false,
};

describe("requestStrategy", () => {
  test("bypasses the cache for non-GET and cross-origin requests", () => {
    expect(requestStrategy({ ...base, method: "POST" })).toBe("network-only");
    expect(requestStrategy({ ...base, sameOrigin: false })).toBe(
      "network-only",
    );
  });

  test("always fetches the service worker script from the network", () => {
    expect(requestStrategy({ ...base, pathname: "/service-worker.js" })).toBe(
      "network-only",
    );
  });

  test("never caches SvelteKit's deployment version check", () => {
    expect(requestStrategy({ ...base, pathname: "/_app/version.json" })).toBe(
      "network-only",
    );
  });

  test("serves precached build output and static assets cache-first", () => {
    expect(requestStrategy({ ...base, precached: true })).toBe("cache-first");
  });

  test("keeps navigations network-first so deployments appear immediately", () => {
    expect(requestStrategy({ ...base, mode: "navigate", pathname: "/" })).toBe(
      "network-first",
    );
  });

  test("revalidates other same-origin GETs in the background", () => {
    expect(requestStrategy(base)).toBe("stale-while-revalidate");
  });

  test("precaching wins over the navigation strategy", () => {
    expect(
      requestStrategy({ ...base, precached: true, mode: "navigate" }),
    ).toBe("cache-first");
  });
});

describe("createCacheName", () => {
  test("includes the prefix and build version", () => {
    expect(CACHE_PREFIX).toBe("utf8-icons");
    expect(createCacheName("1750000000000")).toBe("utf8-icons-1750000000000");
  });

  test("sanitizes arbitrary version names", () => {
    expect(createCacheName(" release / 2026-11-18 ")).toBe(
      "utf8-icons-release-2026-11-18",
    );
  });

  test("falls back for empty versions and caps very long ones", () => {
    expect(createCacheName("")).toBe("utf8-icons-dev");
    expect(createCacheName("   ")).toBe("utf8-icons-dev");
    expect(createCacheName("x".repeat(200))).toBe(
      `utf8-icons-${"x".repeat(64)}`,
    );
  });
});

describe("isCacheableResponse", () => {
  test("accepts successful responses", () => {
    expect(isCacheableResponse(new Response("ok"))).toBe(true);
    expect(
      isCacheableResponse(
        new Response("ok", {
          headers: { "cache-control": "public, max-age=60" },
        }),
      ),
    ).toBe(true);
  });

  test("rejects errors and partial content", () => {
    expect(isCacheableResponse(new Response("missing", { status: 404 }))).toBe(
      false,
    );
    expect(isCacheableResponse(new Response("partial", { status: 206 }))).toBe(
      false,
    );
  });

  test("honours no-store", () => {
    expect(
      isCacheableResponse(
        new Response("secret", {
          headers: { "cache-control": "private, no-store" },
        }),
      ),
    ).toBe(false);
  });
});
