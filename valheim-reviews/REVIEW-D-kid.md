# REVIEW D - First-run and kid walkthrough (10-12 year old)

Method: live site https://nobody174.github.io/Valheim-Site/ inside a sandboxed iframe (`sandbox="allow-scripts allow-forms allow-popups"`, no allow-same-origin) on a throwaway example.com tab, so storage was empty and the owner's data was never touched. The site worked fully in the sandbox (no breakage seen). Phone = 390x844 iframe, desktop = 1280x720 iframe. I am an AI imitating a child, not a real child; the owner's real 10-minute test is still needed. I did NOT read CLAUDE.md or docs/ARCHITECTURE.md (time), so the "About this page" and trust-label notes come from what the screen showed. Timings are approximate (each tool step ~5-8 s wall clock); clicks and scrolls are exact. Screenshot folder: /tmp/claude-chrome-screenshots-1T820T/ (files named in the table).

## Verdict
1. The front door works: search "flint axe" gives the answer in 3 taps on a phone; the quick card ("MAKE: Workbench, 6 Wood, 4 Flint") is the best thing on the site for a kid.
2. It breaks down the moment a kid leaves search: the 29-entry menu, "what can I make / what do I eat" pages that open on late-game content for a brand-new player, and a vocabulary (hoard, unchecked, unverified, Eitr, profile, advisor, .fch) that a 11-year-old cannot decode.
3. Kid-pass: 3 of 7 loops clean pass, 2 partial, 2 fail. Fixable mostly with wording and better defaults, not new features.

## Scores (0-10)
- First impression / "what is this": 7. "What are you looking for, Viking?" with one big box is clear. The three extra boxes/buttons in the header (Search, Big text, Default, gear) are noise.
- Finding a known thing: 8. Search is instant, result is 1 tap away, works on both sizes.
- Menu / navigation for a kid: 4. 29 entries in "Look things up / Plan & compare / My game / Reference"; names like Upgrades, Rankings, Compare, Crafting graph, Progression are indistinguishable; 4 icons are the same stick glyph (Items, Skills, Rankings, Compare variants).
- Words: 3. See glossary.
- Good defaults for a newcomer: 3. Food optimizer defaults to "All zones" and recommends Fiery Svinstew (late-game); Recipes opens on Artisan Table / Ceramic Plate / Refined Eitr.
- "About this page" fold: 6. Easy to find (yellow ? button under every title), but its text uses "profile Default", "advisor", "checklist" without explaining them.

## Transcript of hesitations (first person, 11-year-old)
Phone, first load (screens: ss_07562u1a9, ss_9265zvrgl)
- "Valheim... ok, it's a helper for the game. Big box says what am I looking for. Cool, I type." (no hesitation; the top-left Search box AND the big box AND the Search tab all exist: "which one?")
- "There's 'Big text' and 'Default' and a gear. What is Default? Is that me? I don't touch it." (Default is the profile name but nothing says so.)
- "PICK A ZONE: Meadows, Black Forest... Boss: Eikthyr. I know zones. 'Not started' - okay." Scrolled 1 screen; zones are fine.
Loop 1 Flint Axe (ss_84379g0lp, ss_5421oslpf)
- Tapped Search tab, typed "flint axe". One result: "Flint Axe" with "AxeFlint" on the right. "Why does it say AxeFlint? Is that a different thing?" Tapped it.
- Card: "USED FOR Damage 20 (Slash 20)". "Used for? I want what it NEEDS." Then "MAKE Workbench: 4, Wood, 6, Flint". "Workbench: 4... do I need 4 workbenches? Oh no, I need 4 Flint? The numbers are in the wrong place." (It reads "Workbench: 4 / Wood, 6 / Flint"; the 4 belongs to Flint and 6 to Wood, but the line-wrap makes it look like Workbench x4.) Real confusion; I would have guessed wrong without game knowledge.
Loop 2 Flint (ss_2642uooaz, ss_9803lnaz3)
- Tapped "Flint" in the recipe. "FARM: Meadows - Loose flint on the ground, mainly near water [unchecked]." "Unchecked? So is it true or not?" Found the answer, but the tag makes me doubt it.
- Title badge "Keep some (50)". "Keep some of what? 50 what?" (This is the 'hoard' label.)
- Opened "More details": "Unverified: Weight and stack size come from the game files. Where to find it was written by hand and not checked." Too long; "unchecked" and "Unverified" differ, two words for one idea.
Loop 3 Next boss (ss_3619wna11, ss_9773419cb)
- Tapped More: a big sheet with 29 buttons. "Bosses is right there. But 'Next steps' says NEXT, so I press that." Landed on NEXT BOSS: EIKTHYR. "Still needed: Deer Trophy. You hold 0 of 1." Pass, but the "hold 0 of 1" - "hold what? I don't have a profile." 
- "WORTH COLLECTING ... unlocks Leather Tunic" - each item icon appears twice. "Why two pictures?" Opened "About this page": "Suggestions from your checklist and inventory (profile Default)... the advisor keeps up." I did not understand "advisor" or "profile".
Loop 4 Food (ss_8050u0s2m, ss_6381q5mbw)
- More > Food: "68 entries", first card "Barley Wine Base: Fire Resistance, Plains". "I'm in Meadows. This is not what I eat." Sorted by Name, filters Zone/Type, no "start here".
- Went to Food optimizer: "Goal: Most health. Foods up to: All zones." Result 1: Fiery Svinstew, Mashed Meat, Piquant Pie "Health 300 Stamina 101". "I cannot make these yet." Also "Rule: ... then Eitr. 53 foods considered. Meads, raw berries and mushrooms are not included." "What is Eitr?" Fail for a new player (answer needs me to change 'All zones' first).
Loop 5 What can I make (ss_35759tj8n, ss_1572e0u1h)
- Tapped Planner tab: "Build planner: Item, Amount, Upgrade level, Add to plan. Nothing planned yet." "This is for after I know what I want." Opened inventory fold: "My inventory (0 items)". "How do I tell it what I have?" No answer. 
- More > Recipes: "282 recipes", first group "ARTISAN TABLE (3)" with Ceramic Plate/Black Marble/Mechanical Spring/Refined Eitr. "I haven't got any of this." Gave up. (The Next steps page "Worth collecting" is the real answer but I would not guess it.)
Loop 6 Menu / words (ss_623759g9s, ss_3933edmlt, ss_5258q7fgl)
- Menu: "Upgrades? Rankings? Compare? Comfort? Crafting graph? Progression? Check in game? Console commands? Data trust? Profile & data?" I would pick: Items, Bosses, Food, Next steps. I would ignore 20 of the 29.
- Tried "My character": "Choose the characters folder / Choose a .fch file / Where are my character files?" "What's a .fch? Do I have a folder with characters? I close this."
- Data trust: "Nearly everything here is read from the game's own files, which is accurate but is not the same as seeing it work in game ... 83 seen in game / 1177 read from the game files." "Boring; I do not understand 'seen in game' vs 'read from game files'."
Desktop 1280x720 (ss_3077w8vbi, ss_0236f7mnb)
- Two search boxes (header and Home). Home box is already focused so I just typed. "flint" gave Flint, Flint Axe, Knife, Spear, Flinthead Arrow and under BUILDING PIECES a "Flint Pile" with `flint_pile` shown on the right. "What is flint_pile?" Ids shown on every row. Left sidebar is taller than the screen (scrolls); "Places" has an orange dot - "what's that for?"

## Loop table
| # | Loop | Size | Taps/clicks | Scrolls | Approx secs | Result | Notes |
|---|------|------|-------------|---------|-------------|--------|-------|
| 1 | What does Flint Axe need? | Phone | 3 (Search tab, type, result) | 0 | ~15 | PASS (ambiguous "Workbench: 4" line) | ss_5421oslpf |
| 1d | same | Desktop | 1 type + 1 click | 0 | ~8 | PASS | ss_0236f7mnb, ids shown in rows |
| 2 | Where to get Flint? | Phone | +1 (tap Flint) | 0 | ~10 | PASS with doubt ("unchecked") | ss_2642uooaz |
| 3 | Next boss? | Phone | 2 (More, Next steps) | 0 | ~12 | PASS (Eikthyr, top of page) | "Next steps" found by name guess; Bosses page not needed |
| 4 | Which food to eat? | Phone | 4 (More, Food, More, Food optimizer) | 0 | ~30 | FAIL for newcomer (late-game answer, alphabetical list starts with Barley Wine) | ss_6381q5mbw |
| 5 | What can I make with what I have? | Phone | 4 (Planner, fold, More, Recipes) | 0 | ~35 | FAIL (no "what I have" input visible; recipes open on Artisan Table) | ss_35759tj8n |
| 6 | Which menu entry do I press? | Phone | 2 (More + 1 scroll) | 1 sheet scroll (~2 screens of 29 buttons) | ~20 | PARTIAL: Items/Bosses/Food/Next steps OK; 20+ ambiguous | ss_623759g9s |
| 7 | What does this word mean? | Phone | 2-3 (More details / About this page) | 0 | ~20 | PARTIAL: some words explained inline, many not | ss_9803lnaz3 |

## Glossary - 10 worst words and plain rewrites
| Word / phrase (where) | What a kid thinks | Plain-words rewrite |
|---|---|---|
| "Keep some (50)" / hoard labels (Flint title badge) | keep some of what? 50 what? | "Good to stock up: you can carry 50" or just hide it |
| "unchecked" / "Unverified" (Flint FARM, More details) | maybe wrong? | "Not tested in the game yet" (one label everywhere) |
| "read from the game files" / "seen in game" (Data trust) | unclear difference | "Taken from the game's data" / "Tested by us in the game" |
| ".fch file" / "characters folder" (My character) | what is that? | "Your saved player file (ends in .fch). Ask a grown-up to help find it" |
| "profile Default" / "Default" selector (header, About this page) | is Default me? | "Player slot: Default (you can add one per person)" |
| "advisor" (Next steps About) | a person? | "this page" / "the helper" |
| "Eitr" (Food optimizer rule, recipes) | unknown | "Eitr (magic energy)" |
| "Foods up to: All zones" / "Goal: Most health" | up to what? | "Show foods from: [your zone]" - default to the player's zone |
| "USED FOR Damage 20 (Slash 20)" (weapon card) | used for what? | "STATS" for gear; keep "USED FOR" only for things that are ingredients |
| "Workbench: 4, Wood, 6, Flint" | need 4 workbenches | "At a Workbench. Needs 6 Wood + 4 Flint" (each count next to its item) |
Runners-up: "prefab" (not seen on the screens I visited; the brief lists it), "sources disagree", "cross-checked", "Console commands", "Crafting graph", "Progression", "Comfort".

## The 5 changes that would help most
1. Give every "what do I..." page a newcomer default: Food optimizer and Food open filtered to the zone the player is in (or Meadows when no profile); Recipes opens on a "Start here: things you can make from Wood, Stone, Flint, Resin" group instead of Artisan Table.
2. Fix the recipe line on item cards: put the count right next to each ingredient ("6 x Wood, 4 x Flint") and the station on its own line ("Make at: Workbench"). Evidence: ss_5421oslpf.
3. One trust word, plain: replace unchecked/unverified/cross-checked/hoard with a single small "Not tested in game" tag, and drop "Keep some (50)" badges that read as advice.
4. Shrink the phone More sheet for kids: show 8 entries (Items, Recipes, Bosses, Food, Places, Next steps, Planner, Favorites) and put the other ~21 under "More tools"; give each a different icon (stick glyph repeats on Items, Skills, Rankings).
5. Hide ids and file talk from kids: no `AxeFlint` / `flint_pile` in search rows; rewrite My character/My world setup text in 3 plain steps; explain "profile" and "Default" in the header once.

## Findings
| ID | Sev | Evidence | Fix | Effort |
|---|---|---|---|---|
| D1 | High | Food optimizer first result Fiery Svinstew, "All zones" default (ss_6381q5mbw) | Default to player zone; show "foods you can make now" | S |
| D2 | High | "Workbench: 4, Wood, 6, Flint" wraps, counts ambiguous (ss_5421oslpf) | Count adjacent to name, station separate | S |
| D3 | High | No "what can I make with what I have" entry: Planner shows "Nothing planned yet / My inventory (0 items)", Recipes opens on Artisan Table (ss_35759tj8n, ss_1572e0u1h) | Add "What can I make?" on Home/Recipes with an inventory input or a start-here list | M |
| D4 | Med | Trust vocabulary: "unchecked" (tag) vs "Unverified" (detail) on same item (ss_9803lnaz3) | One label, one sentence | S |
| D5 | Med | 29-entry More sheet, repeated stick icons (ss_623759g9s) | 8-entry default menu + "More tools" | M |
| D6 | Med | Search rows show ids AxeFlint, Flint, flint_pile (ss_84379g0lp, ss_0236f7mnb) | Remove id column | S |
| D7 | Med | .fch / characters folder setup page (ss_5258q7fgl) | Plain 3-step wizard; hide for kids | M |
| D8 | Med | "Keep some (50)" on Flint, no explanation | Drop or reword | S |
| D9 | Low | Next steps shows each item icon twice (ss_3619wna11) | Render once | S |
| D10 | Low | "profile Default", "advisor" in About text (ss_9773419cb) | Reword | S |
| D11 | Low | Header has Search + Big text + Default + gear while Home has a second search; desktop has two boxes (ss_3077w8vbi) | One search per screen on Home | S |
| D12 | Low | "Places" orange dot with no label | Explain on hover/tap or remove | S |
| D13 | Low | Weapon card "USED FOR Damage 20" (ss_5421oslpf) | Rename to "STATS" for gear | S |

## Protect this
- Home greeting + single big search box + zone cards with boss names.
- Quick card on an item page (icon, 2-line answer, links on ingredients): 3 taps from nothing to the Flint Axe recipe on a phone.
- Next steps top block: "NEXT BOSS: EIKTHYR, Still needed: Deer Trophy" - exactly the kid question.
- Yellow "About this page" ? button under every title (easy to find; only the wording needs work).
- Bottom tab bar on phone (Home, Search, Items, Planner, More).
- Site works fully with empty storage and in a sandboxed iframe (first-run state is robust).

## Could not check
- A real child. This is an AI role-play; reading level, patience and the "give up" threshold need the owner's 10-minute test (BRIEF section 9).
- "Big text" mode and the "Default" profile selector behaviour; keyboard `/` and Ctrl+K at kid level.
- Words "prefab", "sources disagree", "cross-checked", "hoard" as text on pages: I saw related labels ("Keep some", "unchecked", "Unverified") but not the literal words; the Items/Creatures/Building pages and Checklist were not walked.
- Seconds are rough (tool latency); no stopwatch. Exact scroll counts inside long pages not measured.
- 29 menu entries: I opened 9 (Next steps, Food, Food optimizer, Planner, Recipes, Data trust, My character, plus Items via search); not all 29.
- CLAUDE.md and docs/ARCHITECTURE.md were not read (stayed naive, ran out of time), so intended behaviours (e.g. whether the Food optimizer is meant to default to all zones) are unverified.
- Assumptions: sandboxed empty origin = a true first run; the iframe 390x844 is not a real touch device (no touch events, no on-screen keyboard).
