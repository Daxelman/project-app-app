# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This is a Create React App (react-scripts 5) project written in TypeScript.

- `npm start` — run the dev server at http://localhost:3000
- `npm test` — run Jest in interactive watch mode. For a single non-interactive run (needed in CI/agent contexts): `CI=true npm test -- --watchAll=false`
- `npm test -- --testPathPattern=Home` — run tests matching a name/path (e.g. a single test file)
- `npm run build` — production build to `build/`
- `npm run deploy` — publish `build/` to the `gh-pages` branch (runs `predeploy`/`npm run build` first)

There is no separate lint script; linting comes from `react-app`/`react-app/jest` ESLint configs baked into `react-scripts` and surfaces as warnings in `npm start`/build output.

Deploys happen automatically: `.github/workflows/main.yml` runs `npm run deploy` (gh-pages) on every push to `main`. There's no CI test/build gate before that deploy.

## Architecture

This is "Mana Optimizer" — a client-side-only tool (no backend) that takes a pasted Magic: The Gathering decklist, validates the card names against Scryfall data, and (eventually) suggests a mana base.

- **Routing**: `src/index.tsx` mounts `<App>` inside a `BrowserRouter` with `basename="/project-app-app"` (must match the GitHub Pages sub-path in `package.json`'s `homepage`). `Welcome/App/App.tsx` defines the routes: `Layout` (`Welcome/Layout`) is the layout route wrapping an `<Outlet>`, with `Home` (`Welcome/Home`) as the index route and `About` (`Components/About`) at `/about`. Note the inconsistent placement — most page components live under `src/Welcome/`, but `About` lives under `src/Components/`.
- **Card data / cardLookup (`src/services/cardLookup.ts`)**: there is no card API backend. Instead, the whole Scryfall "oracle-cards" bulk data file (~70MB) is downloaded client-side on first use and cached in IndexedDB via `localforage`, re-downloaded when the cache is older than one week (`TTL_MS`). Cards are indexed into a `Record<lowercased-name, ScryfallCard>` map (`types/scryfall.ts` defines the trimmed-down fields that get cached). `lookupCards(names, onProgress)` is the only entry point the UI uses, and reports progress strings for the "downloading/indexing" states.
- **Home (`src/Welcome/Home/Home.tsx`)**: parses a textarea decklist (`"<qty>x? <name>"` per line, `//` = comment) and calls `lookupCards` to split entries into `found`/`notFound`, rendering both lists.
- **Optimizer (`src/services/optimizer.ts`)**: the actual mana-base optimization logic. This is presently an early scaffold, not wired into the `Home` UI — `optimizeMana` is unimplemented (returns an empty object, has TODOs for factoring in color pips and a land-count formula) and its helpers use loose `any` typing that doesn't match `ScryfallCard`'s field names (e.g. reads `card.colorIdentity` / `card.data.cmc` instead of the cached `color_identity`/`cmc` fields). Expect to rewrite this against the real `ScryfallCard` shape and the `CardEntry`/found-card shape produced by `Home.tsx` when building this out.
