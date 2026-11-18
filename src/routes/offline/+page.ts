/**
 * Offline fallback page (Phase 5 of #1).
 *
 * Prerendered so the service worker can precache a stable copy and serve it
 * for navigations that have no cached page while the network is unavailable.
 */
export const prerender = true;
