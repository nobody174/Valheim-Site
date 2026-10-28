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
  stations.json            # workbench, forge, cauldron... build cost, extensions, later-zone extensions
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
    { "type": "recipe", "recipe": "recipe.Iron" },
    { "type": "trader", "note": "Haldor, about 350 coins" },   // hand-written, unverified
    { "type": "found", "note": "In chests in Burial Chambers" }, // hand-written, unverified
    { "type": "other", "note": "free text" }
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
- items that are needed as a recipe input, upgrade cost, station or building cost, or boss summon item but have `hoard` = `safe_discard` or `decorative`
- missing `source` or `verified`

**Hoard defaults.** `build_data.py` sets them from the recipes: an item that summons a boss is `must_keep`; a tool you craft (stack size 1) is `must_keep`; anything else used as an ingredient is `keep_some` with `recommendedQty` = its largest single need (one craft, upgrade step, build or summon). Items nothing uses stay `safe_discard` (`decorative` for trophies). The hand-written `keepSome` and `mustKeep` lists in `tools/extract/biomes/` still win. Derived entries carry a `hoardNote` saying why.

Prints a summary: counts per file and counts per `verified` level. This summary is how the
owner sees how trustworthy the dataset currently is.

## Computed values (never stored)

**Damage per hit.** The weapon's damage per type at the chosen upgrade level (`damage +
damagePerLevel * (level - 1)`), keeping only types that hurt creatures (chop and pickaxe are
tool-only). "vs creature" scales each type by the creature's resistance label: very weak x2, weak
x1.5, resistant x0.5, very resistant x0.25, immune and ignore x0. (`src/data/weaponStats.ts`)

**Station levels.** Read from the game code (`CraftingStation.GetLevel`, `Recipe.GetRequiredStationLevel`):
a station is level 1 plus the number of *different* extensions built within range (extensions do not stack),
so level N needs any N - 1 of the station's extensions. A craft needs the recipe's minimum level (at least 1);
each upgrade quality needs one level more than the last (`minLevel + quality - 1`). Computed by
`src/data/stationLevels.ts`, never stored. Extensions whose materials come from zones not in the data yet
are kept in `laterExtensions` (name and the missing item names only) and move to `extensions` on a rebuild
once those zones exist. A recipe with no station (Club, Stone Axe, Hammer, Torch) needs none, also to upgrade.

**Weapon skill.** Optional. Each hit rolls uniformly between `lerp(0.4, 1, skill/100) - 0.15` and `+ 0.15`
(clamped to 0..1) of the listed damage; the table shows the mean and the min-max, like the in-game
"(15-27)". Read from `Skills.GetRandomSkillRange` in the game's `assembly_valheim.dll`; one level is
applied to all weapon types. (`skillRange` in `src/data/weaponStats.ts`)

**Damage per combo.** Per hit times the combo multiplier: every swing counts the attack's
`damageMultiplier`, and the last swing of a multi-swing combo uses `lastChainMultiplier` instead
(bronze sword: 1 + 1 + 2 = 4 hits). (`src/data/attackModel.ts`)

**Stamina efficiency.** Damage per combo divided by stamina per combo (`staminaPerHit * swings`).

**DPS estimate (approximate, timing unverified).** `dps = damage per combo / seconds per combo`.
A swing lasts until the next may start: inside a combo that is the clip's Chain event, for the last
swing (or a single attack) the clip's exit point (`exitTime`, at most the clip end). Seconds are
real time: playback starts at the state's speed and each Speed event sets the playback factor from
its clip time on. Skill level 0, nothing but continuous attacking. Bows get no estimate. The raw
numbers come from the player animator (`extract_attack_timing.py`); the model has not been checked
in game, so the page labels DPS as an estimate.

**Overall rating.** A 0 to 100 opinion: each weapon's percentile among the listed weapons for DPS,
stamina efficiency and reach (weakest 0, strongest 1, ties share the average), blended with
weights. Weights default in `src/features/rankings/weights.ts` (5, 3, 2), are editable on the
page and kept in the URL. It only compares what is listed, so it changes with the filters. Weapons
missing a weighted measure get no rating.

**Armor views.** Armor at level = `armor + armorPerLevel * (level - 1)`. Tank: highest armor.
Exploration: no speed penalty, then highest armor. Light: lowest weight, then highest armor. Set
bonus: pieces of a set with a bonus first. Craft and upgrade cost count recipe items.

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
- The service worker updates itself (`registerType: 'autoUpdate'`), and `build.assetsInlineLimit: 0` keeps icons as separate cached files instead of base64 inside the JS (entry chunk 2,082 kB to 789 kB, 1,148 to 175 kB gzip, 2026-10-28).
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
