# MovieFlex Pro UI refresh

This patch refreshes the MovieFlex UI while keeping the current Astro project structure and local API approach.

## Included

- `src/pages/projects/movieflex.astro` — centered hero hierarchy, persistent light/dark toggle, lightly animated layered feature cards, improved 3D movie cards, accessible focus styling, and animated Back to top control.
- `src/pages/api/movieflex.ts` — Astro API route for TMDB search/discovery, genres, regions, details, provider availability, and reviews.
- `src/layouts/MovieFlexLegalLayout.astro` — matching dark-mode toggle, centered legal-page titles, matching focus states, and Back to top control.
- `src/pages/privacy.astro`, `terms.astro`, `cookies.astro`, `privacy-settings.astro`, `copyright.astro`, `sources.astro` — existing policy/attribution pages using the shared layout.
- `public/movieflex-icon.svg` — custom lightweight SVG favicon.

## Install

1. Make a backup of your current `src/pages/projects/movieflex.astro` and other included pages.
2. Merge this bundle's `src` and `public` folders into the existing Astro project root. Allow folder merging, and replace only the files included in this bundle.
3. Keep your existing `astro.config.mjs`, `package.json`, and `.env` unchanged.
4. Ensure the root `.env` contains `TMDB_READ_ACCESS_TOKEN=...` with your actual TMDB Read Access Token. Never commit `.env` or expose the token using a `PUBLIC_` or `VITE_` variable.
5. Restart the dev server: `npm run dev`.
6. Open `http://localhost:4321/projects/movieflex/`.

## Theme and motion

The light/dark choice is saved in browser localStorage under `movieflex-theme`. The feature cards have low-amplitude independent motion and depth on hover/focus. `prefers-reduced-motion` disables the nonessential animations.

## Verification notes

Inline JavaScript blocks were checked with Node's syntax checker. A full Astro build was not run against your local project, so run `npm run build` after merging. The TMDB API requires a valid server-side token and network connectivity.

The legal content is a project-specific starter draft, not jurisdiction-specific legal advice. Review it for the actual operator, jurisdiction, retention practices, and deployment behavior before publishing.
