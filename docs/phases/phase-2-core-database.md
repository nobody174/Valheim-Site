# Phase 2 - Core database

**Goal:** the complete, trustworthy dataset from Meadows to Ashlands, and every browse page
built on top of it.

## Before starting

- The data source is decided and its terms are recorded in `docs/DATA_SOURCES.md`.
- Look up the current game version, record it in `data/meta.json`, and confirm which biomes
  and content exist today.

## Data passes (one biome per session)

Order: Meadows, Black Forest, Swamp, Mountains, Plains, Mistlands, Ashlands. (Meadows and Black
Forest already have seed data from Phase 0: complete and cross-check them rather than redo them.)

For each biome, add or complete:

- items (materials, tools, gear, building materials, food ingredients, trophies)
- recipes including upgrade costs and station levels
- stations and what they unlock
- weapons (raw stats per quality level), armor (values, movement penalty, set bonus)
- foods and meads/potions (health, stamina, Eitr, duration, ingredients)
- trophies (drop source, drop chance if known, uses, recommended quantity, hoard default)
- creatures (health, damage, drops, weaknesses/resistances, strategy notes)
- the boss (summon items, location hints, recommended gear/food, prep checklist, power reward)
- the biome's progression guide entry (materials, keep list, boss prep, gear, food, dangers)
- default `hoard` for each new item, with a one-line `hoardNote` for anything `must_keep`

Rules for each pass:

- Only data from the approved source. Missing numbers stay missing (`null` + `note`).
- Run `npm run validate`; fix dangling references before finishing.
- End the session with a table of unverified/approximate fields and ask the owner to
  spot-check the five entries most likely to be wrong.

## Browse pages (one session after the data)

Build from the data only; no new game data.

1. **Trophy database:** table + detail, drop source, chance, uses, boss summoning uses,
   recommended quantity, "safe to discard" flag derived from hoard.
2. **Boss database:** summon materials, biome, recommended gear/food/mead, prep checklist
   (tickable, persisted per profile), power reward.
3. **Creature database:** health, damage, biome, drops, weaknesses, strategy, trophy link.
4. **Food and mead database:** sortable table (health, stamina, Eitr, duration), filter by
   biome/tier, "best per tier" highlight.
5. **Station pages:** levels, what each level unlocks, the chain of requirements.
6. **Progression guide:** all seven biomes, plus the "expedition kit" per biome.
7. **Items list:** filter by category, biome, hoard, tag; sortable.

## Acceptance criteria

- [ ] All seven biomes covered, or the gaps explicitly listed in DATA_SOURCES.md "Known gaps"
- [ ] `npm run validate` green; summary shows counts and `verified` breakdown
- [ ] No page shows a made-up value; missing values render as "unknown", not blank or zero
- [ ] Every trophy, boss and creature page links correctly to items and back
- [ ] Owner has spot-checked at least five entries per biome and flagged any errors fixed
- [ ] Performance: search still under 100 ms with the full dataset

## Checkpoint (stop here)

Owner reviews data quality first, pages second. Update ROADMAP. Do not start Phase 3.
