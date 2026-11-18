# open-utf8-icons `ツ`

[![Built with Bun](https://img.shields.io/badge/Bun-1.4+-black?logo=bun)](https://bun.sh)
[![Framework](https://img.shields.io/badge/SvelteKit-Svelte%205-orange?logo=svelte)](https://svelte.dev)
[![Styling](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Deployed on Cloudflare](https://img.shields.io/badge/Cloudflare_Pages-Worker-F38020?logo=cloudflare)](https://utf8.a3k.me)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A fast, lightweight, ad-free, open-source web directory for discovering, previewing, and copying native UTF-8 and Unicode glyphs.

Hosted at: **[utf8.a3k.me](https://utf8.a3k.me)**

---

## ✦ Core Tenets

1. **Zero Icon Libraries / Zero SVG Icons**: We strictly dogfood our own domain. Every UI icon (search, copy, close, theme toggle, navigation, arrows) is a native UTF-8 Unicode character. No Lucide, Heroicons, FontAwesome, or custom SVG packs.
2. **Minimal Dependencies**: Pure browser APIs, Svelte primitives, and Bun built-ins.
3. **Offline-First & PWA**: Instant local search without network latency, installable on mobile and desktop.
4. **Visual Identity**: Japanese Katakana Letter Tu (`ツ` / `U+30C4`) serves as the logo and favicon.

---

## 🛠 Tech Stack

- **Runtime & Toolchain**: [Bun](https://bun.sh) (package manager, test runner, bundler)
- **Framework**: [SvelteKit](https://svelte.dev) with **Svelte 5 Runes** (`$state`, `$derived`, `$props`, `$effect`)
- **Deployment**: Cloudflare Pages / Workers via [`@sveltejs/adapter-cloudflare`](https://github.com/sveltejs/kit/tree/main/packages/adapter-cloudflare)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) with `@tailwindcss/vite`
- **Testing**: Built-in `bun test`

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.2+)

### Development

```bash
# Clone the repository
git clone https://github.com/amr3k/open-utf8-icons.git
cd open-utf8-icons

# Install dependencies
bun install

# Start local development server
bun run dev

# Run unit tests
bun test

# Run Svelte type-checking
bun run check

# Regenerate the Unicode dataset (see below)
bun run generate:icons

# Build for production (Cloudflare Pages)
bun run build

# Preview production build locally
bun run preview
```

---

## 🗃 Unicode Dataset

The app is powered by a self-contained, pre-generated dataset — [`src/lib/data/icons.json`](src/lib/data/icons.json) — containing **4,021 glyphs** across 22 curated categories, extracted from **Unicode 16.0.0**.

Every glyph ships with full developer metadata: character, official Unicode name, code point (`U+XXXX`), decimal value, HTML entities (decimal + hex), CSS escape, JS escape, Unicode category/block and curated search keywords. Country flags are included as regional-indicator emoji sequences (`🇺🇸`).

### Regenerating the dataset

```bash
bun run generate:icons                          # use the pinned Unicode version
bun run generate:icons --force                  # re-download the UCD source file
bun run generate:icons --unicode 17.0.0         # extract from a newer Unicode version
bun run generate:icons --ucd ./UnicodeData.txt  # use a local/offline UCD file
```

- **Source of truth**: the official UCD [`UnicodeData.txt`](https://www.unicode.org/Public/16.0.0/ucd/UnicodeData.txt) — downloaded once, then cached in `.cache/` (git-ignored), so repeat runs and CI work offline.
- **Curation**: the curated block list lives in `scripts/lib/blocks.ts`, hand-picked search synonyms in `scripts/lib/keywords.ts`, and flag regions in `scripts/lib/flags.ts`.
- **Output**: minified JSON (~1.1 MB raw / ~163 kB gzip). The generated file is committed, so production builds and CI never need network access; Cloudflare serves it compressed. If the payload ever grows too large for a single request, per-block chunked loading can be introduced without changing the pipeline.
- **Invariants**: `bun test` validates the committed dataset against the pure formatter helpers (`scripts/lib/formats.ts`), so representation drift fails CI.

---

## 📋 Implementation Roadmap

Tracked in epic issue [#1](https://github.com/amr3k/open-utf8-icons/issues/1):

- [x] **Phase 1: Project Scaffolding & Toolchain**
- [x] **Phase 2: Unicode Dataset Extraction Pipeline**
- [ ] **Phase 3: Core Directory & Search Interface**
- [ ] **Phase 4: Glyph Inspector & Developer Tooling**
- [ ] **Phase 5: PWA & Offline Support**
- [ ] **Phase 6: Branding, SEO & Social Assets**
- [ ] **Phase 7: Deployment & CI/CD**

---

## 📄 License

[MIT](LICENSE) &copy; 2026 Amr (@amr3k)
