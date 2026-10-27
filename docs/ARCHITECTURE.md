# Architecture

## Goals

1. Instant lookup (search results under 100 ms, any page reachable in 2 clicks)
2. Data you can trust (sourced, versioned, validated)
3. Free hosting on GitHub Pages, works offline, installable
4. Easy to update when the game patches (edit JSON, run validate, push)

## Stack (decided, do not swap without asking)

| Concern | Choice | Why |
|---|---|---|
| Build / framework | Vite + React + TypeScript (strict) | Fast, static output, well known |
| Routing | `react-router` with **HashRouter** | GitHub Pages has no SPA fallback; hash routes avoid 404s |
| Search | MiniSearch | Small, fuzzy, prefix search, in-memory index built at load |
| Graph | `@xyflow/react` (React Flow) + `dagre` layout | Zoom/pan/click, good for tech-tree style graphs |
| Validation | Zod | One schema = TS types + runtime validation in the validate script |
| State | Zustand + a thin persistence layer | Small, no boilerplate |
| PWA | `vite-plugin-pwa` (Workbox) | Offline + installable |
| Tests | Vitest + Testing Library | Unit tests for data, formulas, graph |
| Styling | CSS variables + CSS Modules | No framework lock-in, full control of the look |
| Fonts | `@fontsource` packages, self-hosted | Must work offline, no Google Fonts requests |

Vite `base` must be `/Valheim-Site/` (the repo's canonical name as shown on GitHub; the casing in a clone URL can differ, so do not trust `git remote -v` for this).

## Folder layout

```
/data                      # all game data, JSON only
  meta.json                # gameVersion, lastReviewed
  biomes.json
  items.json               # every item: id, name, category, biome, weight, stack, tags, hoard
  recipes.json             # crafting, cooking, smelting, upgrades (edges of the graph)
  stations.json            # workbench, forge, cauldron... with levels and what they unlock
  weapons.json             # combat stats keyed by item id
  armor.json
  foods.json               # includes meads/potions or a sibling meads.json
  trophies.json
  creatures.json
  bosses.json
  pieces.json              # building pieces (Phase 2+)
/scripts
  validate-data.ts         # schema + referential integrity + duplicate ids
  build-search-index.ts    # optional: prebuild index for faster load
/src
  /app                     # shell, routes, layout, command palette
  /components              # presentational UI (cards, tables, badges, graph nodes)
  /data                    # typed loaders + derived graph (never import JSON elsewhere)
  /features                # search, items, recipes, graph, planner, rankings, checklist...
  /state                   # persistence layer, profiles, favorites, progress
  /styles                  # tokens.css, base.css, themes
/public                    # PWA icons and manifest assets (own artwork)
/docs
/.github/workflows/deploy.yml
```

## Data model

All relationships use ids. The UI never matches on display names.

**One graph, many views.** Items are nodes, recipes are edges. Material page, recipe explorer,
crafting graph, build planner, hoard logic and "used in" lists are all views over this graph,
built once in `src/data/graph.ts`. Do not build four separate lookups.

Illustrative shapes (schema examples only, **not authoritative data**):

```jsonc
// items.json
{
  "id": "Iron",
  "name": "Iron",
  "category": "material",          // material | weapon | armor | tool | food | mead | trophy | piece | misc
  "biome": "swamp",
  "weight": 2,
  "stackSize": 50,
  "tags": ["metal"],
  "hoard": "must_keep",            // must_keep | keep_some | safe_discard | decorative | sell
  "hoardNote": "Needed for most mid-game gear.",
  "recommendedQty": null,          // number, used when hoard = keep_some
  "sellValue": null,               // number, used when hoard = sell
  "obtainedFrom": [                // typed sources, all ids
    { "type": "gather", "node": "..." },
    { "type": "drop", "creature": "..." },
    { "type": "recipe", "recipe": "recipe.Iron" }
  ],
  "source": "docs/DATA_SOURCES.md#...",
  "verified": "unverified"         // unverified | cross-checked | in-game
}

// recipes.json
{
  "id": "recipe.SwordIron",
  "output": { "item": "SwordIron", "qty": 1 },
  "station": { "id": "forge", "minLevel": 2 },
  "inputs": [ { "item": "Iron", "qty": 20 } ],
  "upgrades": [ { "quality": 2, "inputs": [ { "item": "Iron", "qty": 10 } ] } ],
  "source": "...", "verified": "unverified"
}
```

Rules:

- Stable ids. Prefer the game's internal prefab name. Never rename an id once published; add
  `aliases` for old names instead.
- Hoard categories: the original brief listed four, but its examples also included
  "Safe to Sell". The model uses five: `must_keep`, `keep_some`, `safe_discard`, `decorative`,
  `sell`. The values in JSON are defaults; the user can override per item locally.
- Weapons, armor, foods, trophies are *stat extensions* keyed by an item id, not duplicates of
  the item. Item identity (name, weight, biome) lives only in `items.json`.
- Creature and boss files reference drops, trophies and summon items by id.

## Validation (`npm run validate`)

Fails the build on:

- schema violations (Zod)
- duplicate ids within or across files
- any dangling reference (recipe input/output, drop, station, trophy, summon item, biome)
- recipe output items that no file declares
- items with `hoard = keep_some` but no `recommendedQty`
- missing `source` or `verified`

Prints a summary: counts per file and counts per `verified` level. This summary is how the
owner sees how trustworthy the dataset currently is.

## Computed values (never stored)

**DPS estimate (Phase 3).**
`dps = sum(damage per type at chosen quality) * hits per attack chain / chain duration (s)`.
Defaults: skill level 0, quality 1, no enemy resistances. Optional "vs creature" mode applies
that creature's resistances from `creatures.json`. Needs attack timing data; until timings are
verified the page shows an "approximate" badge. Document the formula in the UI.

**Stamina efficiency.** damage per stamina point for the primary attack.

**Overall PvE rating.** Rank-normalized blend of DPS, stamina efficiency, reach and repair cost.
Weights are constants in `src/features/rankings/weights.ts`, shown in the UI and editable
locally. It is an opinion, so it is labelled as one.

**Build planner totals.** Recursive expansion of recipes through the graph, subtracting the
owner's inventory, grouped by station requirement.

## Persistence (localStorage)

Single versioned key per profile, e.g. `vcs:v1:profile:<profileId>`:

```
{ version, progress: { [itemId]: { collected, crafted, completed, farmed } },
  favorites: { materials[], recipes[], gear[] },
  hoardOverrides: { [itemId]: hoard }, inventory: { [itemId]: qty }, notes: {...} }
```

- Always wrap reads and writes in try/catch; the app must render with empty state.
- Migrations by `version`. Provide **Export / Import JSON** from Phase 1 (browser storage can
  be wiped).

## Assets

- **Item and station icons are the real in-game icons**, committed on purpose (owner's decision,
  2026-10-27) as 64 px WebP files in `src/assets/icons/<id>.webp`, named after the entry id.
  `tools/extract/extract_icons.py` exports them from the owner's install; re-run it after
  `extract_raw.py` whenever new entries are added. Game art is (c) Iron Gate and not licensed for
  reuse (see the README disclaimer). Nothing else from the game's art or audio is committed.
- Creatures and bosses have no icon of their own; they show their trophy's icon.
- Icons are loaded through `src/data/icons.ts` (a Vite glob, no manifest) and drawn by
  `<EntityIcon>`. An id with no exported icon falls back to the generated category glyph, so a
  missing file never breaks a page. Icons are precached with the app so pages work offline.

## Design tokens (starting point)

```
--bg-0: #111111;  --bg-1: #161616;  --bg-2: #1a1a1a;
--iron: #3a3d42;  --black-metal: #0c0d0e;
--bronze: #a97142; --silver: #b8bcc2; --gold: #c9a227; --amber: #d98e04;
--parchment: #d9c9a3 (use sparingly, low opacity panels)
```

Headings: a classical serif with a carved feel (for example Cinzel via `@fontsource`). Body:
a clean sans (Inter). Rune details are SVG/CSS dividers and corner trims, never on text that
must be read quickly. Motion: 150-250 ms ease transitions, respect `prefers-reduced-motion`.

## Deployment

`.github/workflows/deploy.yml` (Pages via Actions):

```yaml
name: Deploy
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run validate
      - run: npm run test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: "${{ steps.d.outputs.page_url }}" }
    steps:
      - id: d
        uses: actions/deploy-pages@v4
```

Check the current major versions of these actions when creating the file.
