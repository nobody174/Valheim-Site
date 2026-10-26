# Prompts for Claude Code

Use one prompt per session, in order. Start each session in **plan mode**, approve the plan,
then let it build. After the checkpoint, review the live site, merge the PR, and only then
start the next session.

Tip: the owner scopes in chat (Claude) and implements in Claude Code. If a decision comes up
that is not covered in these docs, bring it back to chat before deciding.

---

## Session 0 - Foundation

```
Read CLAUDE.md, docs/ARCHITECTURE.md, docs/ROADMAP.md, docs/phases/phase-0-foundation.md
and docs/DATA_SOURCES.md. Do Phase 0 only.

First propose a plan and wait for my approval. Do not invent game data. When you reach the
Phase 0 checkpoint, stop and summarize: what is built, what is unverified, what you need from me.
```

## Session 1 - MVP part 1 (search, items, recipes)

```
Read CLAUDE.md, docs/ARCHITECTURE.md, docs/ROADMAP.md and docs/phases/phase-1-mvp.md.
Do the "Part A" tasks of Phase 1 only (search, item page, basic recipe view, hoard badges).
Propose a plan first and wait for approval. Stop at the Part A checkpoint.
```

## Session 2 - MVP part 2 (persistence, PWA)

```
Read CLAUDE.md and docs/phases/phase-1-mvp.md. Do the "Part B" tasks (checklist, favorites,
profiles, export/import, partial progression guide, PWA). Plan first, then build. Stop at the
Phase 1 checkpoint and update docs/ROADMAP.md.
```

## Sessions 3 to 9 - Core database, one biome per session

Run once per biome in this order: Meadows, Black Forest, Swamp, Mountains, Plains, Mistlands,
Ashlands. Replace BIOME each time.

```
Read CLAUDE.md, docs/phases/phase-2-core-database.md and docs/DATA_SOURCES.md.
Do the data pass for BIOME only: items, recipes, stations, weapons, armor, foods, meads,
trophies, creatures, boss, and the progression guide entry.
Use only the approved data source. Mark every entry's verified level honestly. Run
npm run validate. End with a table of what is unverified or approximate and ask me to
spot-check the five entries most likely to be wrong.
```

## Session 10 - Browse pages (can be combined with the last biome)

```
Read CLAUDE.md and docs/phases/phase-2-core-database.md, section "Browse pages". Build the
trophy, boss, creature and food pages and the full progression guide from the data in /data.
No new game data in this session unless validate finds a gap.
```

## Sessions 11 to 14 - Advanced tools

```
Read CLAUDE.md and docs/phases/phase-3-advanced-tools.md. Do step N only
(N = 1 crafting graph, 2 build planner, 3 rankings, 4 optimizer/upgrade/compare).
Plan first. Stop at the checkpoint for that step.
```

## Sessions 15 to 16 - Polish

```
Read CLAUDE.md and docs/phases/phase-4-polish.md. Do the visual pass first (step 1), then the
mobile/a11y/performance pass (step 2) in a separate session. Show before/after screenshots
using the dev server where you can.
```

## Phase 5 - Pick from the backlog

```
Read CLAUDE.md and docs/FEATURES.md section B. Implement ONLY: <feature names I choose>.
Plan first. Do not touch other features.
```
