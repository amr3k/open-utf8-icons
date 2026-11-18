import tailwindcss from "@tailwindcss/vite";
import adapter from "@sveltejs/adapter-cloudflare";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      // Root-relative asset URLs keep the prerendered /offline fallback usable
      // when the worker serves it for a nested navigation path.
      paths: { relative: false },
      // The whole stylesheet is below this size, so SvelteKit inlines it into
      // the document instead of a render-blocking <link>. That removes a
      // round trip from first paint on mobile networks; the extra HTML bytes
      // are far cheaper than a blocking request.
      inlineStyleThreshold: 64 * 1024,
      compilerOptions: {
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
      },
      adapter: adapter(),
    }),
  ],
});
