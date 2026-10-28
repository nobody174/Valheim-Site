# Roadmap

Each phase is one or more Claude Code sessions. Each ends at a **checkpoint** where the owner
reviews the live site before the next phase starts.

## Status

| Phase | Name | Status | Sessions | Notes |
|---|---|---|---|---|
| 0 | Foundation | done (live) | 1 | Scaffold, schemas, validation, CI/deploy, seed data (Meadows + Black Forest from local game files) |
| 1 | MVP | done (live) | 2-3 | Search, item pages, recipe explorer, checklist, favorites, profiles, backup, PWA |
| 2 | Core database | done: all seven zones (Swamp to Ashlands unverified until the owner reaches them) | 6-8 | All browse pages built. Review fixes done: hoard from recipes, dropped-recipe report, station levels and costs, sources, search, item page, descriptions. Details in `docs/DATA_SOURCES.md` |
| 3 | Advanced tools | done (owner checkpoint pending): rankings done (ordered by Rating, bombs and shields left out; DPS is an estimate pending an in-game check) | 3-4 | Phase 3 tools all built: build planner, upgrade calculator, compare, food optimizer, next-steps advisor and crafting graph. Owner still to verify the DPS estimate in game |
| 4 | Polish | done: v1.0 tagged and released on GitHub (2026-10-28), site linked from the repo; design pass 2 done (grouped sidebar, wood-and-parchment theme, cards with a Cards/List toggle) | 2 | Visual pass, mobile, a11y, performance, offline hardening |
| 5 | Future expansion | started: personal notes per item and reading your Valheim character file ("My character" page), the Skills, Console commands, Update log and Dungeons & places pages done; the rest is picked by the owner | open | Backlog, picked as wanted |

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

## State after review 3 (2026-10-28)

v1.0 is tagged, but **nothing is marked seen in game yet**; the Data trust page shows the numbers honestly. Review 3 (`docs/REVIEW-2026-10-28.md`) work done: all seven boss summon costs now come from the game files; the last sourceless items (Ancient Bark, Carrot Seeds) have guide-tagged sources; `lastReviewed` no longer moves on a rebuild; `npm run patchcheck`; Data trust page; touch targets, toast, search placeholder, graph default; beta dots in the menu. Not done on purpose: list virtualisation (the site is used on a desktop second monitor); play-test verification needs the owner in game.

After review 3: phone bottom tab bar (Home, Search, Items, Planner, More) replaces the top tabs on narrow screens; new Check in game page (a per-zone list to take into the game, saved in the profile, with a Copy my results button) to earn the first in-game verifications.
