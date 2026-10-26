# Valheim Companion

A personal, offline-capable Valheim companion: search, recipes, crafting graph, progression
guide, rankings, build planner and checklists. Static site, hosted free on GitHub Pages.

**Status:** planning complete, implementation starting. See `docs/ROADMAP.md`.

## Live site

`https://nobody174.github.io/valheim-site/` (after the first deploy)

## One-time GitHub setup

1. Repo must be **public** (GitHub Pages is free for public repos on a free account).
2. Repo **Settings > Pages > Build and deployment > Source: GitHub Actions**.
3. Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and deploys.

## Develop

```
npm install
npm run dev
npm run validate   # check /data
npm run build
```

## Project layout

See `docs/ARCHITECTURE.md`. Working agreement for Claude Code is in `CLAUDE.md`.

## Disclaimer

Fan-made, non-commercial, for personal use. Valheim is by Iron Gate Studio and Coffee Stain
Publishing. No game art is included in this repository.
