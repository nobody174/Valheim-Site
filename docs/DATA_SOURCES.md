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

> Status: **undecided.** Claude Code must not start Phase 2 data entry until this is set.
> Licenses and terms above have **not** been verified. Do it in Phase 0 and record the results.

## Source register

| Dataset | Source | License / terms | Retrieved | Verified level | Notes |
|---|---|---|---|---|---|
| (fill in during Phase 0/2) | | | | | |

## Game version

Track in `data/meta.json`:

```json
{ "gameVersion": "TBD", "lastReviewed": "YYYY-MM-DD" }
```

At the start of Phase 2, look up the current Valheim version and which biomes/items exist
(the brief lists Meadows through Ashlands). Record it here.

## Known gaps

Keep a running list here of fields that are approximate or missing (for example attack timings
for DPS, exact drop chances, difficulty-scaled values).
