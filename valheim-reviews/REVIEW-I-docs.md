# REVIEW-I: Docs editor and project hygiene (valheim-site)

Reviewer role I. Report only; nothing in the repo was edited. Date 2026-10-31.

## Verdict

1. The docs are a project diary, not a working set: about 36,500 words (about 48k tokens) across 24 files, and only about 5,500 words (CLAUDE.md, ARCHITECTURE, ROADMAP, DATA_SOURCES core) matter at the start of a session. 15,300 words are six dated reviews that are history, and 3,700 words are phase files for phases that are finished.
2. The "read first" list costs more than it saves: about 8,900 words (about 12k tokens) per session to learn rules that fit in 600, and CLAUDE.md contains no mention of who the site is for beyond one sentence, nothing about the kids, and nothing that would stop a session adding page number 30.
3. README is mostly honest but is written for the owner, not a visitor, and CLAUDE.md's working agreement (phase-per-session, "propose a plan and wait") is stale against how the project now runs (review-driven packages, 29 menu entries, feature freeze).

## Assumptions

- Word counts are `wc -w` on the shallow clone at /home/claude/nobody174/valheim-site, 1 word about 1.33 tokens.
- I read CLAUDE.md, README, ARCHITECTURE, ROADMAP, FEATURES, PROMPTS, ICON-FIX, UPDATE_AFTER_PATCH in full. For NEXT-STEPS, the six REVIEW files, DATA_SOURCES and the six phase files I read openings, all headings and sampled sections, not every line. Findings about those are based on structure and sampled text.
- Code claims were checked with grep/ls only (cheap checks). No build or tests were run.
- "29 menu entries" is taken from the brief; `src/app/routes.ts` has 30 `path:` lines, which is consistent with 29 menu entries plus one non-menu route (not verified).

## Scores (0-10)

| Area | Score | Reason |
|---|---|---|
| Accuracy of docs vs code | 6 | File paths I checked mostly exist (icons.ts, quick.ts, weaponStats.ts, fch.ts, qa/budget.json, testFile.ts). But ARCHITECTURE folder layout and deploy YAML are stale (see F5, F6), and `scripts/build-search-index.ts` does not exist. |
| Findability / size at session start | 3 | 8,900 words of mandatory reading; the one doc that sets rules (CLAUDE.md) points at four others instead of holding the rules itself. |
| Currency | 4 | ROADMAP is a changelog that grew paragraphs ("Since v1.1", "Review-5 pass", "After review 3") instead of a status table; phase files are finished work. CLAUDE.md "one phase step per session" no longer matches reality. |
| Duplication | 4 | Same facts in ROADMAP, ARCHITECTURE, phase-5, FEATURES (done/not done status of Phase 5 features in three places); review findings repeated in NEXT-STEPS and again in later reviews. |
| Purpose clarity | 3 | The second-screen goal appears once (CLAUDE.md line 3). The two audiences (owner adult, son and friends 10-12) are not written anywhere in CLAUDE.md, README or ARCHITECTURE. Nothing says "a menu entry must earn its place". |
| README honesty for a new visitor | 6 | Honest disclaimer and status; but no screenshot, no "who is this for", no warning that it is a personal site with owner-specific pages, and the "Using it" paragraph lists tools but not the 29-entry menu. |
| Hygiene / process | 6 | CI runs lint, validate, test, build and a separate qa job; patchcheck exists; but CLAUDE.md "Commands" omits `lint`, `typecheck`, `patchcheck`, and "Definition of done" omits lint and qa. |

## Per-file decisions

Word counts from `wc -w`. Total docs/ = 28,780 words, docs/phases = 3,676, CLAUDE.md 570, README 382.

| File | Words | Decision | Reason |
|---|---|---|---|
| CLAUDE.md | 570 | **Keep, rewrite top** | Only file read by every session; must carry the purpose and the rules itself. Rewritten top below. |
| README.md | 382 | **Keep, edit** | Add "who it is for", a screenshot, the real menu summary, and move "Develop" commands in line with CLAUDE.md. |
| docs/ARCHITECTURE.md | 2063 | **Keep, trim and fix** | Real reference. Remove the illustrative deploy YAML (stale, the real file is `.github/workflows/deploy.yml`), remove design tokens block (live in `src/styles/tokens.css`, not checked but this is a "starting point" copy), fix folder layout. Target about 1,500 words. |
| docs/ROADMAP.md | 1300 | **Rewrite as short status (about 300 words)** | Status table is useful; the five dated paragraphs below it are a changelog. Move changelog to `docs/HISTORY.md` or let git log carry it. "Why this order" and "Phase summaries" are about finished phases. |
| docs/DATA_SOURCES.md | 4652 | **Keep, split** | Core value (source register, verified rules, known gaps) is about 1,200 words. The per-zone "pass" sections and the spot-check lists (lines 66-132, 164-195) are session logs; move to `docs/archive/data-passes.md`. Delete the "Decision needed from the owner (before Phase 2)" section: the decision was made (option A, game files). |
| docs/UPDATE_AFTER_PATCH.md | 1026 | **Keep as is** | A real runbook used after each patch; the commands match files that exist (extract_*.py, apply_checks.py). Contains the owner's absolute Windows paths, fine for a personal project. |
| docs/FEATURES.md | 869 | **Archive** | Original brief map from before Phase 1. Section A is the 18-item brief, section B a ranked wish list of which 10+ are built. Superseded by ROADMAP. If the owner wants the backlog, keep only the not-done items (about 8 lines) in ROADMAP. |
| docs/PROMPTS.md | 476 | **Archive** | Session prompts for Phase 0-5. They tell Claude Code to read `docs/phases/*`, which would be archived. The tip line ("owner scopes in chat, Claude Code implements") is worth one line in CLAUDE.md. |
| docs/ICON-FIX-2026-10-28.md | 242 | **Archive (or delete)** | "Already implemented... nothing else needs to be done." One-off PR note. The durable fact (regenerate PNGs from `public/icon.svg` at listed sizes, flatten on #111111) is 2 lines for ARCHITECTURE "Assets". |
| docs/NEXT-STEPS-2026-10-27.md | 1899 | **Archive** | Work plan for packages 1-5 from reviews of 2026-10-27; its own header says "Read this file after CLAUDE.md", which makes every session pay for finished work. It also says "five zones covered", now seven. |
| docs/REVIEW-2026-10-27.md | 1007 | **Archive** | Its H1/H2/H3 are marked fixed in later reviews. |
| docs/REVIEW-2026-10-27-2.md | 4971 | **Archive** | Largest single doc (30 KB); "Longhouse at night" design direction is the only part still referenced by the look; fold 5 lines into a design note if wanted. |
| docs/REVIEW-2026-10-28.md | 2449 | **Archive** | Review 3. "Road to 10/10" packages A-E done per ROADMAP. |
| docs/REVIEW-2026-10-28-b.md | 1259 | **Archive** | Review 4, follow-up. |
| docs/REVIEW-2026-10-29.md | 2911 | **Archive** | Review 5. |
| docs/REVIEW-2026-10-29-b.md | 2704 | **Archive** | Review 6. Kept only as a baseline for numbers (bundle size, tap targets); the new REVIEW files from this round replace them. |
| docs/phases/phase-0-foundation.md | 430 | **Archive** | Finished. Task list refers to "placeholder panels", never true again. |
| docs/phases/phase-1-mvp.md | 521 | **Archive** | Finished. |
| docs/phases/phase-2-core-database.md | 491 | **Archive** | Finished. |
| docs/phases/phase-3-advanced-tools.md | 1143 | **Archive** | Finished, largest phase file; contains "Built (...)" status paragraphs that duplicate ROADMAP. Rankings formula text is duplicated in ARCHITECTURE "Computed values". |
| docs/phases/phase-4-polish.md | 798 | **Archive** | Finished. Design direction partly useful; see "design pass 2" section. |
| docs/phases/phase-5-future.md | 293 | **Merge into ROADMAP** | Its only live content is the 4-5 not-done candidates and the rule "if something needs a backend, stop". |

Result: archive 17 files (about 21,000 words) and keep or merge 7.

### Does "read first" cost more than it saves?

- CLAUDE.md "Read first, every session" lists ARCHITECTURE (2,063) + ROADMAP (1,300) + the current phase file (293 to 1,143; there is no current phase, all are done) + DATA_SOURCES (4,652) = **about 8,300 to 9,200 words, roughly 11,000 to 12,000 tokens**, plus CLAUDE.md itself (570).
- NEXT-STEPS adds 1,899 more for anyone who follows its own header; PROMPTS tells sessions to read phase files too.
- What a session needs to avoid mistakes: the Data rules (already in CLAUDE.md, about 200 words), the folder map (about 300), the formulas only when touching rankings/stations (on demand), and the sources only when touching `/data` (on demand).
- Verdict: it costs more than it saves. 70% of it is read by sessions that do not touch data (e.g. a CSS or menu change). Make DATA_SOURCES, ARCHITECTURE formulas and UPDATE_AFTER_PATCH "read when you touch X" and keep always-read to CLAUDE.md alone (target 600-700 words, about 900 tokens). That cuts per-session context by roughly 11,000 tokens, about 90%.
- The "Read first" list also never says "who is this for", which is the thing most likely to prevent wrong changes (see F1).

### Is the README honest for a new visitor?

Mostly yes: status line admits "Swamp to Ashlands data is unverified until reached in game", the disclaimer says the icons are Iron Gate art not licensed for reuse. Gaps:

- No sentence on who it is for. "A personal, offline-capable Valheim companion" is true but a visitor does not learn it is built around the owner's own character, world and portals files, or that pages like My world and My character need a local Valheim save.
- No screenshot; no list of what the 29 menu entries are or that 5 or so are maintainer/owner pages.
- "Status: all seven zones ... are built" sits next to "Swamp to Ashlands data is unverified" with no count of how many entries are checked in game (the number lives on the Data trust page). It should point there.
- "Develop" lists four commands and omits `lint`, `typecheck`, `qa`, `patchcheck`, so the README and CLAUDE.md disagree on how to verify a change (CI runs lint and qa).
- It points at `docs/ARCHITECTURE.md` and `docs/UPDATE_AFTER_PATCH.md` correctly; if files are archived, the links must be kept (UPDATE_AFTER_PATCH and ARCHITECTURE stay).

## Findings

| ID | Severity | Evidence | Fix | Effort |
|---|---|---|---|---|
| I1 | High | CLAUDE.md contains one purpose sentence ("One player (the owner) uses it while playing, usually on a second monitor or a phone") and no mention of the son and friends aged 10-12, plain language, glanceability, or a limit on menu size. Brief section 1 says this is the standard for every page. No doc contains a rule against adding pages or terms like "hoard", "prefab". | Put the one-page purpose (below) at the top of CLAUDE.md; link a longer copy as `docs/PURPOSE.md` if wanted. | S |
| I2 | High | "Read first, every session" = ARCHITECTURE 2,063 + ROADMAP 1,300 + phase file + DATA_SOURCES 4,652 = about 8,300 to 9,200 words (about 11-12k tokens) before work starts; all six phases are done so "the current phase file" does not exist. | Replace with a short "Read when" table (below). Always-read = CLAUDE.md only. | S |
| I3 | High | CLAUDE.md Working agreement says "One phase step per session ... Work on a branch per phase (`phase-0-foundation`, `phase-1-mvp`)" and "Update ROADMAP". ROADMAP shows phases 0-4 done and 5 "open"; the real flow since 2026-10-27 is review-driven packages (NEXT-STEPS, "one branch each"). A new session cannot follow the instruction literally. | Rewrite working agreement: "One package per session, one branch, one PR; plan first; stop at acceptance test." | S |
| I4 | Med | 17 files, about 21,000 words (60% of all docs) are history: six REVIEW files (15,301 words), NEXT-STEPS, six phase files, PROMPTS, FEATURES, ICON-FIX. They are linked from ROADMAP and CLAUDE.md so they get opened. NEXT-STEPS header says "Read this file after CLAUDE.md". Earlier reviews' scores will also bias new reviewers (the brief itself says to ignore them). | Move to `docs/archive/` with a 5-line README, and remove all "read" instructions pointing there. Git history keeps them anyway. | S |
| I5 | Med | ARCHITECTURE "Folder layout" lists 12 data files and `scripts/build-search-index.ts`; real `/data` has 18 files (adds commands, confirmed, places, savekeys, skills, updatelog) and `scripts/` has patchcheck.ts, validate-lib.ts, no build-search-index.ts. It lists no `tools/`, `tools/qa`, `tools/review` and lists features only as "search, items, recipes, graph, planner...". | Replace the tree with a 15-line current map generated once by `ls`; delete `build-search-index.ts`. | S |
| I6 | Med | ARCHITECTURE contains the full deploy YAML (about 35 lines): it runs validate, test, build but not lint, and has no qa job; the real `.github/workflows/deploy.yml` runs `lint`, `validate`, `test`, `build`, and a second job `npm run qa` (with `playwright install`). Doc says "Check the current major versions of these actions when creating the file" i.e. it is a creation template, not a description. | Delete the YAML; write "see `.github/workflows/deploy.yml`: lint, validate, test, build, deploy; separate qa job". | S |
| I7 | Med | ARCHITECTURE persistence block describes `{ version, progress, favorites, hoardOverrides, inventory, notes }`. `src/state/model.ts` also has `portals` (line 42), game checks live in a separate key (`gameChecks.ts`), and the profile has a "keep" shape per version. Doc rule "single versioned key per profile `vcs:v1:profile:<id>`" matches tests, but the list of fields is out of date. | Point at `src/state/model.ts` as the source of truth; keep only the rules (try/catch, migrations, export). | S |
| I8 | Med | ARCHITECTURE "Decisions recorded after review 3" lists "Page tiers: Core / Useful / Beta" and a "feature freeze that the owner can lift". The ROADMAP then records many new pages after that date (My portals, My world, Comfort, Hearth/pieces, quick card), so the freeze was either lifted without being recorded or ignored. A session reading both cannot tell whether new pages are allowed. | State the rule once in CLAUDE.md: "No new menu entries without owner approval and a play situation." (see purpose below). | S |
| I9 | Med | ROADMAP is the doc the Definition of Done says to update every session; it is now 1,300 words with the status table plus six dated paragraphs, each repeating counts and file names. "Status after Phase 3" cell is itself 60 words. | Keep the 6-row table with one-line notes; move the paragraphs to `docs/archive/history.md`. | S |
| I10 | Med | DATA_SOURCES (4,652 words, 221 lines) starts with "Decision needed from the owner (before Phase 2)... Pick a primary source" although the decision is long made; per-zone pass sections and spot-check lists are session logs. A data session must read it all (CLAUDE.md says to). | Split: `DATA_SOURCES.md` (register, rules, known gaps, game version, regenerate) about 1,200 words; zone logs to archive. | M |
| I11 | Med | CLAUDE.md "Commands" lists dev, validate, test, build, preview, qa; omits `lint`, `typecheck`, `patchcheck`, all in package.json (and `lint` is the first CI step). "Definition of done" says build + test pass, which skips lint and qa; CI would fail where a local session would say done. | Add `lint`, `typecheck`, `patchcheck`; Definition of done = lint, test, build, and qa when UI changed. | S |
| I12 | Med | README "Using it": lists tools but never says the site has 29 menu entries or that My world / My character / My portals need the owner's own save files; no screenshot; no sentence on audience. "Develop" omits lint/qa. | Add 3-sentence "Who it is for", one screenshot, link to Data trust page for the verified count. | S |
| I13 | Low | CLAUDE.md "Plan first ... wait for approval" appears also in 4 phase files and PROMPTS; if archived, only CLAUDE.md should keep it. PROMPTS tip "owner scopes in chat (Claude) and implements in Claude Code" is the owner's real workflow and exists nowhere else. | Keep the one sentence in CLAUDE.md. | S |
| I14 | Low | Counts inside docs rot: "182 tests", "329 tests", "288 passed" (ICON-FIX), "130 commands", "Four low findings" (npm audit), "entry chunk 2,082 kB to 789 kB" all appear in current-looking docs. No single source. | Rule: docs may state numbers only when the build prints them (validate summary, qa budget). Delete numbers from ARCHITECTURE/ROADMAP; point to `tools/qa/budget.json`. | S |
| I15 | Low | ARCHITECTURE "Hoard categories: the original brief listed four, but its examples also included 'Safe to Sell'". Refers to a brief that is not in the repo; pure archaeology. The user-facing hoard vocabulary is itself the subject of the vocabulary-overload pattern (brief section 4, item 3). | Delete that sentence; keep the five values. | S |
| I16 | Low | UPDATE_AFTER_PATCH and ICON-FIX contain owner-machine absolute paths (`D:\SteamLibrary\...`, `C:/Users/Vartd/...`). Fine for a personal project, but the repo is public. | Optional: use `$GAME_DIR`, `$PY` variables defined once. Not urgent. | S |
| I17 | Low | No doc tells a session what "calm" means for the UI: ARCHITECTURE keeps "Design tokens (starting point)" colours and Cinzel/Inter, while the real look (wood and parchment, zone colours, Big text mode) is described only in phase-4 and in review files. | One paragraph in a short `docs/DESIGN.md` or in ARCHITECTURE; link to `src/styles/tokens.css` as truth. | S |

## Proposed smaller docs set

```
CLAUDE.md                     ~700 words  purpose, rules, commands, done checklist (always read)
README.md                     ~350 words  honest front page, screenshot
docs/ARCHITECTURE.md          ~1,500      stack, map of src/ and data/, data model rules, formulas, persistence, assets
docs/DATA_SOURCES.md          ~1,200      source register, verified levels, known gaps, how to regenerate
docs/UPDATE_AFTER_PATCH.md    ~1,000      unchanged runbook
docs/ROADMAP.md               ~300        status table + open backlog + frozen-decisions list
docs/archive/                 everything else (17 files) + README (5 lines)
```

Total live docs about 5,000 words (from 33,500 live-looking words), always-read about 700.

Proposed "Read when" table for CLAUDE.md:

| You are touching | Read |
|---|---|
| anything | this file |
| `/data`, `tools/extract` | `docs/DATA_SOURCES.md`, `docs/UPDATE_AFTER_PATCH.md` |
| formulas (rankings, stations, planner) | "Computed values" in `docs/ARCHITECTURE.md` |
| new page, menu, routes | `docs/ROADMAP.md` and the Purpose section below |
| storage / profiles | `src/state/model.ts`, "Persistence" in ARCHITECTURE |

## One-page "What this project is for"

**The product.** A free Valheim helper that sits on a second screen or a phone while a person is playing. It is not a wiki. A wiki answers "what is everything?"; this site answers "what do I need right now?" in a few seconds, with the player's own character, world, portals and progress loaded.

**Who uses it.**
1. The owner (adult), at a second monitor (often half a 1280x720 window) or phone, mid-game, with his own saved data. His data is part of the product. Never clear, reset or "fix" it.
2. His son and friends (10 to 12 years old). They will open it with no instructions. They read plain words, do not know the game's internals, and give up fast.

It is a personal and family tool. No marketing, analytics, accounts or backend.

**Rules every change must respect.**
1. **Ten-second rule.** A player opening any player page mid-game must get the answer in under 10 seconds, in at most 2 taps, without scrolling past a screen of other things. Setup and maintenance pages are judged on being clear and done once.
2. **Glance rule.** The first screen at 1280x720 and at 390x844 shows the answer, large enough to read from 1-2 metres in Big text mode. No answer below the fold.
3. **Eleven-year-old rule.** Every label, button and sentence must be understandable by a 10-12 year old who has not read the docs. No file paths, file extensions, internal ids (`TrophyHard`, `darkwood_beam_67`), or code words (prefab, hoard, cross-checked) in player-facing text; use plain words. If a technical word is unavoidable, explain it in one short line next to it.
4. **A blank line beats a wrong line.** Never invent data. Never show filler advice dressed as fact. If the site does not know, say "not in the site yet" and point to the nearest page. A wrong answer is worse than a missing one.
5. **One name for one thing.** One way to reach a page that the player uses mid-game; one progress idea; one trust label per fact. A new term needs a plain-words rewrite first.
6. **The menu is small.** Default player menu stays at about 8-10 entries. Every new menu entry needs a named play situation and owner approval; maintainer and owner pages (Check in game, Data trust, Update log, Console commands, Profile, My world/character setup) belong in an Owner/Advanced area, not in the way of a 11 year old.
7. **Quiet beats clever.** Prefer removing a control to adding one. Badges, chips, tiles and counts need to change a decision; otherwise remove them.
8. **Phone and wide screen both work.** 390px: no sideways page scroll, no 800px tables in a 347px box (stack as cards); 1912px: no 820px strip in a sea of empty space.
9. **Offline and free.** Works offline after the first visit; static; GitHub Pages; no paid service. Stored data uses the `vcs:v1:` prefix and try/catch; nothing leaves the browser.
10. **Evidence for every change.** State what you measured (scrolls, taps, seconds, word count) before and after at 1280x720 and 390x844. "Looks better" is not acceptance.

**Before adding anything, answer:** Which play situation is this for? Who asks (owner, kid, both)? Can it answer in under 10 seconds? Which existing page does it replace or merge with?

## Rewritten top of CLAUDE.md (proposed text)

```markdown
# Valheim Companion (valheim-site)

A personal, free, static helper for the game Valheim, hosted on GitHub Pages. No backend,
no analytics, no accounts, no paid services. Live: https://nobody174.github.io/Valheim-Site/

## What this is for (read this before any change)

It is a **helper, not a wiki**: it sits on a second monitor (often a half-width 1280x720
window) or a phone while someone plays, and answers "what do I need right now?" in under
10 seconds.

Two audiences, both always:
1. **The owner (adult)**, mid-game, with his own character, world, portals and progress
   loaded. That saved data is part of the product: never reset, clear or "fix" it.
2. **His son and friends, aged 10 to 12**, who open it with no instructions. If they cannot
   use a page without help, the page is wrong.

Rules for every change:
1. **Ten-second rule:** a player page gives its answer in at most 2 taps, in the first
   screen, at 1280x720 and 390x844. Setup pages are judged on being clear and done once.
2. **Eleven-year-old rule:** plain words. No file paths, file types, internal ids
   (`TrophyHard`) or code words (prefab, hoard, cross-checked) in player-facing text.
3. **A blank line beats a wrong line:** never invent data, never show filler advice as fact.
   When the site does not know, say so and point to the nearest page.
4. **The menu is small:** about 8-10 player entries by default. A new menu entry needs a named
   play situation and the owner's approval. Maintainer pages (Check in game, Data trust,
   Update log, Console commands, Profile) are owner-only, not player menu.
5. **Quiet beats clever:** prefer removing a control, badge or tile to adding one. One name
   per thing, one way in per page the player uses mid-game.
6. **Phone and wide screens both work;** works offline; Big text mode stays readable.
7. **Show evidence:** report what you measured (scrolls, taps, seconds, words) before and after.

Before adding anything ask: which play situation, who asks (owner, kid, both), which existing
page does it replace or merge with?

## Working agreement

- **One package per session.** Propose a short plan, wait for approval, build, stop at the
  acceptance test in the package. Branch per package, small commits, PR into `main`; the owner
  merges. (The owner scopes in chat and implements in Claude Code.)
- Ask when a decision is the owner's: data source, visual direction, a new page, menu changes.
- Update `docs/ROADMAP.md` at the end of the session (status table only, one line).

## Read when (do not read everything)

| You are touching | Read |
|---|---|
| `/data`, `tools/extract` | `docs/DATA_SOURCES.md`, `docs/UPDATE_AFTER_PATCH.md` |
| formulas (rankings, stations, planner) | "Computed values" in `docs/ARCHITECTURE.md` |
| a new page, menu, routes | `docs/ROADMAP.md` |
| storage, profiles | `src/state/model.ts` and "Persistence" in `docs/ARCHITECTURE.md` |
| the folder layout | `docs/ARCHITECTURE.md` |

Old reviews and phase files are in `docs/archive/`. They are history; do not follow them.
```

(The existing "Data rules", "Code conventions", "Commands" and "Definition of done" sections stay below this, with `lint`, `typecheck` and `patchcheck` added to Commands, and Definition of done changed to: `npm run lint`, `npm run test`, `npm run build` pass; `npm run qa` when UI changed; acceptance test of the package met; ROADMAP line updated; any new data has `source` and `verified` and DATA_SOURCES updated.)

## Protect this

- CLAUDE.md "Data rules": never invent data, no game data in components, stable ids, `validate` before commit, computed values never stored. These are short, clear and enforced by `scripts/validate-data.ts` and tests.
- `docs/UPDATE_AFTER_PATCH.md`: a real, ordered, tested runbook with a failure table; commands refer to files that exist.
- ARCHITECTURE "Computed values" and "Station levels / Weapon skill / DPS (approximate, timing unverified)": honest about what is estimated and where in code it is computed. Keep, and keep the "unverified" wording.
- The `confirmed_in_game.json` mechanism described in ROADMAP/UPDATE_AFTER_PATCH (a test fails if a confirmed line changes): it is a good honesty guard.
- The README disclaimer about Iron Gate art.
- Reviews have one real use: the baselines (bundle size, tap targets). Keep the numbers in `tools/qa/budget.json`, not in prose.

## Could not check

- I did not read every line of NEXT-STEPS, the six REVIEW files, DATA_SOURCES (4,652 words) and phases 1-4. Claims about them rest on headings and sampled sections; a hidden live rule inside them may exist.
- I did not run `npm run build/test/lint/validate`, so test counts quoted in docs (182, 288, 318, 329) were not compared with reality.
- I did not verify the 29-entry menu count, the `routes.ts` route list against the docs, or live site claims (deployed version, Data trust page count).
- I did not check whether `tools/review/screenshots.mjs` is referenced anywhere or whether the design tokens in ARCHITECTURE match `src/styles/tokens.css`.
- Whether the owner still wants FEATURES.md backlog items 17, 18, 21, 25 (weight planner, farming reference, events, printable list) is an owner question; I assumed no.
