# Roadmap

Each phase is one or more Claude Code sessions. Each ends at a **checkpoint** where the owner
reviews the live site before the next phase starts.

## Status

| Phase | Name | Status | Sessions | Notes |
|---|---|---|---|---|
| 0 | Foundation | done (live) | 1 | Scaffold, schemas, validation, CI/deploy, seed data (Meadows + Black Forest from local game files) |
| 1 | MVP | done (live) | 2-3 | Search, item pages, recipe explorer, checklist, favorites, profiles, backup, PWA |
| 2 | Core database | done: all seven zones (Swamp to Ashlands unverified until the owner reaches them) | 6-8 | All browse pages built. Review fixes done: hoard from recipes, dropped-recipe report, station levels and costs, sources, search, item page, descriptions. Details in `docs/DATA_SOURCES.md` |
| 3 | Advanced tools | in progress: rankings done (ordered by Rating, bombs and shields left out; DPS is an estimate pending an in-game check) | 3-4 | Build planner, upgrade calculator, compare, food optimizer and next-steps advisor done. Pending: crafting graph |
| 4 | Polish | not started | 2 | Visual pass, mobile, a11y, performance, offline hardening |
| 5 | Future expansion | not started | open | Backlog, picked as wanted |

## Why this order

- **Phase 0 comes first** because the data schema and validation script decide whether the
  site can be trusted. Everything else depends on them.
- **MVP uses a small seed dataset** (Meadows + Black Forest) so search, item pages and
  persistence can be judged on real screens without waiting for the full database.
- **Full data before the big graph.** The crafting graph only looks impressive and proves
  itself once recipes cover all biomes, so it lands in Phase 3. Phase 1 has a simple
  inputs/outputs recipe view, which already answers "what do I make with this".
- **One biome per data session** keeps each review small and errors catchable.

## Phase summaries

| Phase | Delivers | Original brief features |
|---|---|---|
| 0 | Repo scaffold, design tokens + app shell, Zod schemas, validate script, deploy workflow, README, seed data | 17, 18 |
| 1 | Global search (+ Ctrl+K), item/material page, simple recipe view, hoard badges, checklist, favorites, profiles, export/import, partial progression guide, PWA | 1, 2, 3 (basic), 5, 14, 15, 16, 7 (partial) |
| 2 | Complete datasets Meadows to Ashlands, trophy/boss/creature/food databases, full progression guide | 2, 6, 7, 11, 12, 13 |
| 3 | Interactive crafting graph, full dependency tree, build planner + shopping list, DPS and armor rankings, food optimizer, upgrade calculator, compare | 3, 4, 8, 9, 10 |
| 4 | Premium theme pass, animations, rune details, responsive/mobile, accessibility, Lighthouse, offline test | Visual design section |
| 5 | Backlog from `docs/FEATURES.md` (suggestions ranked below top 12) | Extras |

## Cross-cutting rules for every phase

- Branch per phase, PR into `main`, owner merges.
- Acceptance criteria in the phase file are the definition of done.
- Data work: `verified` flags honest, `DATA_SOURCES.md` updated, `npm run validate` green.
- Stop at the checkpoint. Do not start the next phase.

## Risks and how the plan handles them

| Risk | Handling |
|---|---|
| Wrong game data | Source register, `verified` flags, reference validation, per-biome review |
| Scope too large for one run | Phases with checkpoints, one phase step per session |
| Pages is public | Accepted. Progress lives only in the owner's browser. No secrets in the repo |
| Game patch changes data | `meta.json` version, data-only update workflow, update log (Phase 5) |
| Game art copyright | Owner chose to commit the real item icons (64 px) in `src/assets/icons/`; not licensed for reuse, README says so; nothing else from the game's art is committed |
| Graph performance with full data | Show a focused neighbourhood by default (depth 2), expand on demand |
