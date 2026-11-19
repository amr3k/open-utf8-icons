# Open UTF-8 icons `ツ`

[![Built with Bun](https://img.shields.io/badge/Bun-1.4+-black?logo=bun)](https://bun.sh)
[![Framework](https://img.shields.io/badge/SvelteKit-Svelte%205-orange?logo=svelte)](https://svelte.dev)
[![Styling](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Deployed on Cloudflare](https://img.shields.io/badge/Cloudflare_Pages-Worker-F38020?logo=cloudflare)](https://utf8.a3k.me)
[![License: Unlicense](https://img.shields.io/badge/License-Unlicense-blue.svg)](LICENSE)

A fast, ad-free, open-source directory for discovering, previewing, and copying native UTF-8 / Unicode glyphs.

- Live: [utf8.a3k.me](https://utf8.a3k.me)
- Story: [The story of open-utf8-icons](https://www.a3k.me/blog/the-story-of-open-utf8-icons)

Every UI control is a native Unicode glyph — the app dogfoods its own dataset, so there are no icon libraries or SVGs (`ツ` is the logo and favicon). Search and browsing work fully offline as an installable PWA.

## Development

Requires [Bun](https://bun.sh).

```bash
bun install
bun run dev        # local dev server
bun test           # unit tests
bun run check      # type-check
bun run build      # production build (Cloudflare Pages)
```

The glyph dataset is [`src/lib/data/icons.json`](src/lib/data/icons.json) (packed, schema v2, 3,965 glyphs). Regenerate it with `bun run generate:icons`.

## Contributing

See [`AGENTS.md`](AGENTS.md) for the working contract. Use Bun only, keep every UI control a native UTF-8 glyph, and branch as `feat/<issue-id>-<slug>` or `fix/<issue-id>-<slug>`.

## License

[The Unlicense](LICENSE) — public domain.
