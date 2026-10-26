# Phase 0 - Foundation

**Goal:** a deployed, empty-but-real site with the data schema and validation in place, so
every later phase is safe to build.

## Scope

In: scaffold, tokens + app shell, schemas, validate script, seed data, CI/deploy, docs.
Out: search, item pages, graph, persistence, PWA (Phase 1+).

## Tasks

1. **Inspect the repo** (`git status`, existing files). Keep anything already there that is
   useful (README, license). Confirm repo name casing for the Vite `base`.
2. **Scaffold** Vite + React + TS (strict), ESLint, Prettier, Vitest. Add the scripts listed in
   CLAUDE.md. HashRouter.
3. **Design tokens and app shell:** `tokens.css`, base styles, header with a search input
   placeholder, left navigation (Search, Items, Recipes, Progression, Trophies, Bosses,
   Creatures, Food, Rankings, Planner, Checklist). Routes render a "coming in Phase N" panel.
   Self-hosted fonts via `@fontsource`.
4. **Zod schemas** for every file in ARCHITECTURE.md; infer TS types from them.
5. **`scripts/validate-data.ts`** with all checks listed under "Validation" in
   ARCHITECTURE.md, plus unit tests that prove it fails on: duplicate id, dangling reference,
   missing `source`/`verified`, `keep_some` without `recommendedQty`.
6. **Data source decision:** present the options from `docs/DATA_SOURCES.md` to the owner and
   wait for the answer. Check the license/terms of the chosen source and record them in the
   source register.
7. **Seed data:** Meadows + Black Forest only. Items, recipes, stations (workbench, forge,
   cauldron as they apply), weapons, armor, foods, trophies, creatures, boss. Only data from the
   approved source. Everything `unverified` or `cross-checked` as appropriate.
8. **`src/data/graph.ts`:** build the item/recipe graph from the loaded data; expose
   `recipesFor(itemId)`, `usedIn(itemId)`, `obtainedFrom(itemId)` with unit tests.
9. **Deploy:** `.github/workflows/deploy.yml` (see ARCHITECTURE.md). Tell the owner the one-time
   manual step (Settings > Pages > Source: GitHub Actions) and confirm the first deploy works.
10. **README** updated, ROADMAP status updated.

## Acceptance criteria

- [ ] `npm run build`, `npm run test`, `npm run validate` pass locally and in CI
- [ ] Site is live on GitHub Pages and navigation works with hash routes after a hard refresh
- [ ] No game data inside any component; only `src/data/` imports JSON
- [ ] Validation fails loudly on each broken-data case listed in task 5 (tests prove it)
- [ ] Seed dataset covers Meadows + Black Forest with `source` and `verified` on every entry
- [ ] `docs/DATA_SOURCES.md` source register filled in, with license/terms noted
- [ ] No game art in the repo

## Checkpoint (stop here)

Show the owner: live URL, `npm run validate` summary output, the data source decision and
license notes, and a list of anything you are unsure about. Do not start Phase 1.
