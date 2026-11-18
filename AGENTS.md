# AGENTS.md — Contributor & Agent Guidelines

Guidelines and specifications for building and maintaining **`open-utf8-icons`** ([utf8.a3k.me](https://utf8.a3k.me)).

---

## 1. Project Overview & Philosophy

`open-utf8-icons` is a fast, lightweight, ad-free, open-source web directory for discovering, previewing, and copying native UTF-8 and Unicode glyphs.

### Core Tenets
1. **Zero Icon Libraries / Zero SVG Icons**: The application strictly dogfoods its own domain. Every UI icon (search, copy, close, theme toggle, navigation, arrows) must be a native UTF-8 Unicode character. Never import icon libraries (e.g., Lucide, Heroicons, FontAwesome) or custom SVG icon bundles.
2. **Strict Minimal Dependencies**: Avoid dependency sprawl and supply chain noise. Rely on native browser APIs, Svelte primitives, and Bun built-ins before adding third-party packages.
3. **Offline-First & PWA**: The application must function offline, support instant local search without network latency, and be installable on mobile and desktop as a Progressive Web App (PWA).
4. **Visual Identity**: The character `ツ` serves as the primary logo and favicon.

---

## 2. Tech Stack & Toolchain

| Role | Technology | Configuration Notes |
| :--- | :--- | :--- |
| **Runtime & Package Manager** | **Bun** | Use `bun` for package management, script running, formatting, and tests. |
| **Framework** | **SvelteKit** + **Svelte 5** | Use Svelte 5 Runes (`$state`, `$derived`, `$props`, `$effect`). |
| **Deployment Adapter** | **`@sveltejs/adapter-cloudflare`** | Configured for Cloudflare Pages/Workers targeting `utf8.a3k.me`. |
| **CSS & Design System** | **Tailwind CSS v4** | Pure utility-first styles via `@tailwindcss/vite`, supporting explicit Light and Dark modes. |
| **Icons** | **Native UTF-8 Glyphs** | Standard Unicode characters for all interface controls (e.g. `🔍`, `📋`, `✕`, `☀`, `☾`, `←`, `→`). |
| **Branding & Identity** | **`ツ`** | Katakana Letter Tu (`U+30C4`) for logo, favicon, and brand marks. |
| **Social / Sharing** | **Open Graph (OG)** | High-contrast social sharing image (`og-image.png`) highlighting `open-utf8-icons` and `utf8.a3k.me`. |

---

## 3. Toolchain Commands (Bun Only)

All operations must be run using `bun`:

```bash
bun install         # Install dependencies
bun run dev         # Start local development server
bun run build       # Build production bundle with Cloudflare adapter
bun run preview     # Preview production build locally
bun test            # Run unit and integration tests
bun run check       # Svelte type-checking (svelte-check)
```

---

## 4. Architecture & Key Features

### Data Layer
- **Self-contained Unicode Dataset**: Pre-generated static JSON containing curated symbols (~3,000–5,000 glyphs across standard Unicode blocks: Arrows, Dingbats, Box Drawing, Geometric Shapes, Math Operators, Currency, Emojis/Pictographs).
- **Per-Glyph Metadata**:
  - `char`: The character itself (e.g., `★`)
  - `name`: Official Unicode name (e.g., `BLACK STAR`)
  - `codepoint`: Hex notation (e.g., `U+2605`)
  - `dec`: Decimal code point (e.g., `9733`)
  - `hex`: Hexadecimal value (e.g., `2605`)
  - `htmlEntity`: `&#9733;` and `&#x2605;`
  - `cssEscape`: `\2605`
  - `jsEscape`: `\u2605`
  - `category` / `block`: Unicode block name
  - `keywords`: Array of search terms and synonyms

### Search Engine
- **In-Memory Client-side Search**: Instant filtering by character name, codepoint, decimal ID, or keyword. Zero external server latency.

### User Interface
- **Responsive Layout**: Mobile-first design optimized for touch and desktop keyboard navigation.
- **Copy Mechanism**: 1-click copy with toast confirmation and format options (Character, HTML Entity, CSS Escape, Unicode Codepoint).
- **Glyph Inspector / Detail View**:
  - High-resolution character display.
  - Cross-font comparison matrix (System UI, Sans, Serif, Monospace).
  - Copyable developer snippets for all formats.
- **Theme Support**: Seamless Light / Dark modes respecting system preferences with manual toggle.

---

## 5. Development Guidelines for Agents

1. **Verify Before Recommending Dependencies**: Always check whether a feature can be solved with native web APIs (e.g., Web Clipboard API, Cache API, Web Share API, native string searches) before introducing an npm dependency.
2. **Follow Svelte 5 Runes**: Do not use legacy Svelte 3/4 stores or `let:` slot patterns. Use Runes syntax (`$state`, `$derived`, snippets) exclusively.
3. **Keep Interface Accessible**: Ensure UTF-8 UI glyphs have appropriate `aria-label` or screen-reader text (`sr-only`) so visual-only characters remain accessible to assistive technologies.
4. **Task-Driven Changes**: Reference corresponding GitHub issues in commit messages and branch naming (`feat/<issue-id>-...` or `fix/<issue-id>-...`).
