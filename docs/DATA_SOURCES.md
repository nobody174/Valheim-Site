# Data sources

The site is only as good as its data. This file records where every dataset came from, how it
was checked, and what is still unverified. **Update it in the same commit as any data change.**

## Decision needed from the owner (before Phase 2)

Claude Code has no live access to the game and will otherwise fill JSON from memory, which is
where wrong numbers come from. Pick a primary source:

| Option | Accuracy | Effort | Notes |
|---|---|---|---|
| **A. Extract from your own game install** | Highest, always matches your patch | High | Dump item/recipe/creature data from the installed game using community tooling. Personal use only. Keep extracted raw files and any art out of the repo; commit only the cleaned JSON. |
| **B. Open community dataset as the base, cross-check against the wiki** | High if the dataset is current | Medium | Candidate: the open-source Valheim knowledge base by kirilloid (GitHub `kirilloid/valheim`, site valheim.kirilloid.ru) which ships a typed object database. **Check its license and terms before copying anything**, and record the result below. Use it as a cross-check at minimum. |
| **C. Wiki + manual entry** | Medium, error-prone | Medium | Wiki text is community-written and licensed (attribution required). Good for descriptions and strategy text, weaker for exact numbers. |

**Recommendation:** B as the base for structure and numbers, A only if you later want exact
patch-level values for rankings, C for strategy text. Whatever you choose, mark every entry
`verified` honestly. You can upgrade entries to `"in-game"` as you confirm them while playing.

> Status: **Decided (2026-10-26): Option A, extracted from the owner's own game install.** kirilloid/valheim was ruled out as a copy source (no license) and is cross-check only. Raw extraction output lives in git-ignored `data-raw/`; only cleaned JSON is committed.
> Licenses and terms above have **not** been verified. Do it in Phase 0 and record the results.

## Source register

| Dataset | Source | License / terms | Retrieved | Verified level | Notes |
|---|---|---|---|---|---|
| Candidate base: kirilloid/valheim (valheim.kirilloid.ru) | https://github.com/kirilloid/valheim | **No LICENSE file; GitHub reports no license (all rights reserved by default).** README: content used under fair use, non-commercial; to re-use content, refer to the game EULA. Code and data are in TS under `src/data`, not a published dataset. | 2026-10-26 | n/a (nothing copied) | **Not cleared for copying.** Allowed use for now: read-only cross-check of values we enter ourselves. Owner to decide: ask the author for written permission, or use as cross-check only. |
| Seed data: items, recipes, stations, weapons, armor, foods, trophies, creatures, bosses (Meadows + Black Forest) | Owner's local Valheim install, Steam build 25909357, read with `tools/extract/` (UnityPy). Reads gameplay values only; no art, audio or raw assets are committed. | Personal use of own copy; game content (c) Iron Gate. Not an open license, so keep the repo non-commercial and commit only cleaned values (see README disclaimer). | 2026-10-26 | cross-checked (single source: game files) | Weights, stacks, damage, armor, food, health, recipes and drop tables come from the files. Curated by hand and NOT from the files: biome assignment, hoard defaults, gather/smelt/cook sources (those items are `unverified`), boss summon items. |

## Game version

Track in `data/meta.json`:

```json
{ "gameVersion": "TBD", "lastReviewed": "YYYY-MM-DD" }
```

At the start of Phase 2, look up the current Valheim version and which biomes/items exist
(the brief lists Meadows through Ashlands). Record it here.

## Known gaps

- Station upgrade levels and their requirements (`stations.json` `levels` is empty).
- Meads: items and recipes exist, but their effects and numbers come from status effects, which are not extracted yet (no `foods.json` rows for meads).
- Smelting and cooking conversions (smelter, kiln, cooking station) are not extracted; curated notes only.
- Attack timings for DPS (Phase 3), creature resistances, boss summon items, gather nodes.
- Biome assignment is curated. Check the seed lists in `tools/extract/build_seed.py` when in doubt.
- `kind` on every recipe is `craft`; cooking and smelting kinds are not distinguished yet.

## Regenerating the seed data

```
python tools/extract/extract_raw.py "<Valheim install dir>" data-raw     # needs: pip install UnityPy
python tools/extract/build_seed.py data-raw data <steam build id>
npm run validate
```
