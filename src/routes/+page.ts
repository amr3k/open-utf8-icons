/**
 * The directory is fully static: no load functions, no request state, and the
 * dataset is bundled with the page. Prerendering it lets the edge serve a
 * finished document (with the stylesheet inlined) instead of invoking the
 * worker for every first visit.
 */
export const prerender = true;
