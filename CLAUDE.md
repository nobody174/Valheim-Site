# Valheim Companion (valheim-site)

A personal, free, static companion website for Valheim. One player (the owner) uses it
while playing, usually on a second monitor or a phone. **Lookup speed and data trust matter
more than anything else.** Hosted on GitHub Pages. No backend, no paid services.

## Read first, every session

1. `docs/ARCHITECTURE.md` - stack, folder layout, data model, formulas, deploy
2. `docs/ROADMAP.md` - phases and the current status table
3. The current phase file in `docs/phases/`
4. `docs/DATA_SOURCES.md` - where data comes from and what is verified

## Working agreement

- **One phase step per session.** Do only what the phase file asks for. When you reach the
  checkpoint, stop and write a short summary (what was built, what is unverified, what is next).
- **Plan first.** At the start of each session, propose a short plan and wait for approval
  before writing code.
- **Update `docs/ROADMAP.md`** status table at the end of every session.
- Work on a branch per phase (`phase-0-foundation`, `phase-1-mvp`, ...). Small commits.
  Open a PR into `main`; the owner merges after review.
- Ask when a decision is the owner's to make (data source, visual direction). Do not guess.

## Data rules (most important)

- **Never invent game data.** If a value is not in a documented source, leave it out or set
  `verified: "unverified"` and add a `note`. A wrong recipe is worse than a missing one.
- All game data lives in `/data/*.json`. **No game data in components, ever.**
- Every entry has a stable string `id` (the game's internal prefab name where known, for
  example `Iron`, `SwordIron`), plus `source` and `verified`
  (`"unverified" | "cross-checked" | "in-game"`).
- `npm run validate` must pass before any commit that touches `/data`. It checks schemas (Zod),
  duplicate ids, and **every id reference** (recipe inputs, drops, stations, trophies, bosses).
  A dangling reference fails the build.
- Computed values (DPS, ratings, rankings, totals) are derived in code from raw stats with
  documented formulas. Never store a computed value in JSON.
- `data/meta.json` holds `gameVersion` and `lastReviewed`. Update it when data is reviewed.

## Code conventions

- TypeScript strict mode. No `any`. No unused exports.
- **All code, comments, commit messages and docs in English.**
- Plain CSS with design tokens (CSS variables) plus CSS Modules. No UI framework.
- Components are presentational. Data access goes through `src/data/` (typed loaders and the
  derived graph), never by importing JSON inside a component.
- Persistence goes through `src/state/` only (versioned localStorage, see ARCHITECTURE.md).
- Every page must work offline and be usable at 1280px desktop and 390px mobile.
- No Valheim game icons or art in the repo (see "Assets" in ARCHITECTURE.md).

## Commands

```
npm run dev        # local dev server
npm run validate   # schema + reference checks for /data
npm run test       # unit tests (Vitest)
npm run build      # validate + typecheck + production build
npm run preview    # serve the production build
```

## Definition of done (every session)

- `npm run build` and `npm run test` pass
- Acceptance criteria in the phase file are checked off, with notes on anything not met
- ROADMAP status table updated
- Any new data has `source` and `verified` set, and `docs/DATA_SOURCES.md` is up to date
