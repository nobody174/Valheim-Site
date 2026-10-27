# Valheim Companion

A personal, offline-capable Valheim companion: search, recipes, crafting graph, progression
guide, rankings, build planner and checklists. Static site, hosted free on GitHub Pages.

**Status:** Phase 1 (MVP) in review: lookup, checklist, profiles, progression guide, offline app. See `docs/ROADMAP.md`.

## Live site

`https://nobody174.github.io/Valheim-Site/` 

## Deploy

GitHub Pages, Source: GitHub Actions. Pushing to `main` runs `.github/workflows/deploy.yml`
(lint, validate, test, build, deploy). Pull requests run the same checks without deploying.

## Using it

Press **Ctrl+K** or **/** on any page to search. Every item, creature, boss and station name is a link
to its page. `/items` lists all items, filterable by name, category, hoard and biome (filters live in the URL).
`/recipes` lists every recipe grouped by station, searchable by output or ingredient.

Progress (checklist, favorites, hoard overrides) is saved in this browser per profile. Use
**Profile & data** to add profiles and to download or restore a JSON backup; browsers can lose
site data, so back up now and then. The site works offline after the first visit and can be
installed as an app from the browser menu.

## Develop

```
npm install
npm run dev
npm run validate   # check /data
npm run test
npm run build
```

## Data

Game data is in `/data/*.json`, extracted from a local game install with `tools/extract/`
and validated against Zod schemas. See `docs/DATA_SOURCES.md`.

## Project layout

See `docs/ARCHITECTURE.md`. Working agreement for Claude Code is in `CLAUDE.md`.

## Disclaimer

Fan-made, non-commercial, for personal use. Valheim is by Iron Gate Studio and Coffee Stain
Publishing. No game art is included in this repository.
