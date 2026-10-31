# REVIEW C: Visual design and consistency critic

Reviewer: independent, role C. Date 2026-10-31. Live site https://nobody174.github.io/Valheim-Site/ (Edge, owner state, read-only).

## Method and assumptions

- 1280x720 and 390x844 were measured by loading the live site in a same-origin iframe of that size (the window cannot be resized). Owner state was only read. First-run view: sandboxed iframe (`sandbox="allow-scripts"`), empty storage, profile "Default".
- Big text was tested only by setting `data-screen="second"` on the iframe's `<html>` (no persisted setting touched).
- Page height is `main.scrollHeight / main.clientHeight` (main is the scroll container, about 653 px tall at 1280x720; the header takes the rest). "Screens" below are in those units.
- Contrast was computed from computed colours against the nearest opaque ancestor background, then checked by hand from the CSS tokens. My script flagged 1.2:1 on the active "List/Weapons" toggle and on station pills. These are false alarms: dark ink on a parchment gradient, 8.2:1 by token. I do not count them.
- No data facts were judged. Findings are about patterns.

## Verdict

1. The look is coherent and genuinely Valheim (dark wood, Cinzel headings, zone colours, in-game icons). It is more calm than the density suggests, and the typography and contrast are good.
2. The weakness is not style but quantity and mixed purposes. Database pages open on controls and a wall of pills (Items: 892 badges, 446 rows, 33 screens), the sidebar is taller than the screen, and the three kinds of page do not look different from each other.
3. Phone and empty states are the roughest part: a table cut off with a blank band on Comfort, a permanent data footer, and bare dark voids on empty pages.

## Scores (0 to 10)

| Area | Score | Reason |
|---|---|---|
| Theme and Valheim feel | 8 | Consistent tokens, wood header, parchment active state, zone colours, game icons. Only 7 hues for zones. |
| Hierarchy | 6 | Good page title plus gold "About this page" pill; but the pill is as loud as the primary controls, and first screens start with filters, not answers. |
| Density | 4 | Items 33.3 screens, Recipes 36.3, Checklist 27, Building 23.4; Recipes 1,726 and Checklist 2,269 controls. |
| Contrast and glare | 7 | Almost everything passes; main text is 15.7:1 (cream #efe8d8 on #120f0c), which is more glare than needed in a dim room. Bronze on bg-2 is 4.10:1. |
| Tap targets | 4 | Of the controls on Recipes, 1,553 of 1,726 are under 24 px and 1,723 under 44 px; Items 324 of 488 under 24 px. |
| Type scale | 6 | Small and tidy (below), but 11.2 and 12 px carry key trust information. |
| Icon use | 6 | Icons help; but 2,159 images on Recipes, and sidebar icons repeat unrelated items (Wood for Items, Flint for Recipes). |
| Badges | 3 | 892 on Items, 48 on Trophies, plus about 20 chips on Home/Bosses; two vocabularies (hoard and data) side by side in every row. |
| Empty, error, loading states | 4 | Bare one-line boxes on Favorites, Build planner, Character; no loading state seen. Compare (7 text nodes) and Updates are near empty. |
| Motion | 7 | `prefers-reduced-motion` is honoured globally (base.css 28 to 32); Big text also kills motion. `getAnimations()` returned 0 on every page. |
| Wide and narrow use | 5 | Wide: content column about 1,050 px max at 1280, reportedly 820 px of 1912 on items; right strip only at 1500+. Narrow: tab bar is good; tables are not. |
| Consistency across 3 kinds of page | 5 | Same skeleton everywhere; no visual cue separates reference, tool and maintainer pages. |

## The 5 worst screens

1. **Items, first screen (1280x720)** `/tmp/claude-chrome-screenshots-1T820T/screenshot-1793406511181-7.png`. Intro, About pill, 3 selects, search, Cards/List, 446 rows. Each row carries 2 pills ("Safe to discard", "unchecked" and "Verified in game" side by side) plus "From game files". 892 pills, 108 words and 30 controls in the first screen, 14 badges already visible. Contradicting trust words sit in one row (for example "unchecked" next to "Verified in game"). Five seconds in, the eye lands on an orange wall of links, not on one answer.
2. **Comfort on a phone (390x844)** `/tmp/claude-chrome-screenshots-1T820T/screenshot-1793406614591-18.png`. Two paragraphs of caveats, a dashed "guide, not checked" pill before the text, a table clipped at the right ("MAD..."), and a large blank band where the first rows should be. The top of the table gives no visible answer.
3. **Recipes, first screen** `/tmp/claude-chrome-screenshots-1T820T/screenshot-1793406517411-8.png`. Search box labelled by an example; 282 recipes grouped by station; 1,726 controls, 1,553 under 24 px (ingredient pills are tiny hit areas); 36 screens. Nice cards, but the page is a catalogue.
4. **Checklist first screen** `/tmp/claude-chrome-screenshots-1T820T/screenshot-1793406523670-9.png`. Seven progress bars, each with three different counts (Collected, Crafted, Completed, Farmed) in 12 to 13 px dim text; the key to the four words is an inline sentence. 2,269 controls, 27 screens. The bar is amber for every zone, so it ignores the zone colours used on Home.
5. **My world (owner setup)** `/tmp/claude-chrome-screenshots-1T820T/screenshot-1793406529903-10.png`. Setup text with `worlds_local`, `.db2` and "the world file" in a code font, five parts and 10.7 screens. It reads as a manual. It also looks exactly like a player page. Runner-up: Console commands `/tmp/claude-chrome-screenshots-1T820T/screenshot-1793406557121-13.png` (130 rows, a tiny filter box overlapping the label, "guide, not checked" pills in a dense table).

Other screenshots for reference: Home 1280 `...1793406496936-6.png`; Building `...-11.png`; Bosses `...-12.png`; Progression `...-14.png`; Check in game `...-15.png`; Home phone `...-16.png`; Items phone `...-17.png`; first run Home `...-19.png`, Favorites `...-20.png`, Build planner `...-21.png`, My character `...-22.png`. All in `/tmp/claude-chrome-screenshots-1T820T/screenshot-<id>.png|jpg`.

## Numbers for all 29 pages (1280x720, owner state)

Screens, visible text nodes, visible controls (links, buttons, inputs, summaries), controls under 24 px and under 44 px, controls and words in the first screen, `_badge_` pills, chips, h2 count, minimum contrast over text elements (false alarms removed where noted).

| Page | Screens | Text nodes | Controls | <24px | <44px | 1st screen controls | 1st screen words | Badges | Chips | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Home | 2.0 | 64 | 67 | 1 | 48 | 24 | 26 | 0 | 18 | min contrast 5.11 (zone green on bg). 4 h2. Right "portals" strip absent below 1500 px. |
| Items | 33.3 | 2,760 | 488 | 324 | 362 | 30 | 108 | 892 | 0 | 68 text nodes at 11.2 px. |
| Recipes | 36.3 | 3,010 | 1,726 | 1,553 | 1,723 | 36 | 57 | 0 | 0 | 20 h2 station pills with count. |
| Building | 23.4 | 1,794 | 905 | 426 | 663 | 38 | 54 | 0 | 0 | |
| Creatures | 4.1 | 363 | 237 | 185 | 221 | 52 | 106 | 0 | 0 | |
| Bosses | 2.2 | 82 | 66 | 22 | 63 | 29 | 63 | 7 | 21 | Min contrast 4.66 (bronze). Best page (see Protect). |
| Trophies | 3.4 | 300 | 136 | 99 | 133 | 37 | 106 | 48 | 0 | |
| Food | 5.5 | 492 | 114 | 50 | 92 | 34 | 99 | 0 | 0 | |
| Skills | 3.7 | 282 | 114 | 69 | 100 | 36 | 154 | 0 | 6 h2 | |
| Places | 8.6 | 359 | 45 | 7 | 42 | 21 | 98 | 0 | 0 | Beta dot in menu. |
| Build planner | 1.0 | 9 | 41 | 1 | 38 | 22 | 65 | 0 | 0 | Empty until used. |
| Comfort | 2.1 | 120 | 107 | 42 | 76 | 34 | 117 | 0 | 0 | Table width problem on phone. |
| Upgrades | 1.0 | 4 | 36 | 1 | 33 | 17 | 32 | 0 | 0 | Near empty. |
| Rankings | 8.5 | 914 | 125 | 37 | 83 | 39 | 90 | 0 | 0 | |
| Compare | 1.0 | 7 | 39 | 1 | 36 | 20 | 51 | 0 | 0 | Empty until used. |
| Food optimizer | 1.6 | 42 | 54 | 1 | 51 | 29 | 99 | 0 | 0 | |
| Crafting graph | 1.5 | 22 | 44 | 1 | 40 | 21 | 65 | 0 | 0 | Canvas page. |
| My character | 3.1 | 132 | 73 | 36 | 70 | 24 | 66 | 0 | 0 | 6 h2. Setup copy. |
| Check in game | 6.9 | 201 | 164 | 41 | 154 | 28 | 119 | 0 | 0 | 10 h2. |
| My portals | 2.7 | 74 | 75 | 17 | 72 | 29 | 104 | 0 | 0 | |
| My world | 10.7 | 278 | 213 | 88 | 209 | 22 | 105 | 0 | 0 | 6 h2. |
| Next steps | 2.0 | 64 | 70 | 15 | 67 | 35 | 48 | 0 | 0 | |
| Checklist | 27.0 | 498 | 2,269 | 2,231 | 2,266 | 20 | 58 | 0 | 0 | 6.51 min. |
| Progression | 5.4 | 271 | 144 | 95 | 134 | 28 | 75 | 0 | 0 | 24 text nodes under 12 px. |
| Favorites | 1.0 | 4 | 36 | 1 | 33 | 17 | 12 | 0 | 0 | One line empty state. |
| Console commands | 11.4 | 377 | 38 | 1 | 35 | 19 | 74 | 0 | 0 | 130 rows, the only table that works without links. |
| Data trust | 1.9 | 73 | 40 | 2 | 34 | 16 | 157 | 0 | 0 | Highest first-screen words per control. |
| Update log | 1.0 | 6 | 37 | 1 | 34 | 18 | 75 | 0 | 0 | Near empty. |
| Profile & data | 1.0 | 10 | 40 | 1 | 37 | 21 | 79 | 0 | 0 | |

Reading the table: 1,000-plus controls on three pages (Recipes, Checklist, Building about 900) make them tap-hostile on a phone. The 17 to 25 controls of the shell (sidebar 29 links, header, tab bar) count in every row: 16 to 20 controls on every page are navigation.

Badge-like styling outside the `_badge_` class: Home 18 browse chips, Bosses 21 ingredient chips, 20 station pills on Recipes, 7 beta/orange dots in the menu (5 routes marked beta: Places, Food optimizer, Crafting graph, My character, My world), gold "About this page" pill on every page (29), "guide, not checked" pills on Comfort and Console commands.

## Type scale and colours actually used

Distinct font sizes seen across all pages: 11.2, 12, 12.8, 13.6, 14.4, 15.2, 16, 19.2, 20.8, 24, 30.4 px (11 sizes). Dominant: 16 (about 1,400 nodes on Items), 13.6 (447), 12 (897, the pills), 11.2 (68). Only one h1 size (30.4). About 8 text colours per page; the repeated ones are cream #efe8d8, dim #b3a995, amber #d98e04 (links), silver #b8bcc2, gold #c9a227, bronze #a97142, ink #2b2118. The palette is small and consistent.

Computed contrast (from tokens): text 15.65; dim on bg 8.21; dim on wood 5.22; amber link 7.11; gold 7.90; silver 10.02; bronze 4.66 on bg-0 and 4.10 on bg-2 (fails 4.5 for 12 px text); zone text colours 5.1 to 8.8; ink on parchment 8.18. Non-text: card border #3b2f24 against the page is 1.47:1 and iron border 1.94:1, so card edges almost vanish (a pass for calm, a fail for WCAG 1.4.11 on inputs).

Sidebar: 29 links, heights 36 to 60 px, content 1,414 px in a 653 px box (2.2 screens of menu, own scrollbar). Three nested scrollbars are visible at 1280: sidebar, main, and the page frame.
Header controls at 1280: search 480x44, "Big text" 73x34, profile select 91x37, settings gear link 16x29 (the smallest and least findable target).
Big text: only html font-size 16 to 18 px (+12.5%); Items height 21,729 to 21,703 px (no change), table cell text 18 px. Headings do not change. That is not glanceable at 1 to 2 metres; it is a small step.
Motion: 0 running animations on every page; `prefers-reduced-motion` and Big text both disable transitions.

## What to remove to make the site quieter

1. The second pill in every Items row: show one state per row (hoard OR trust, not both). Remove "From game files" and "Verified in game" from the list; keep trust only on the detail page. About 450 of the 892 badges go.
2. The gold "About this page" pill as a loud button on 29 pages; make it a quiet text link or a "?" in the title row (already counted 29 per page).
3. Home: one of the three ways to reach the same destinations (tiles, browse chips, sidebar). 18 chips and the "Handy tools" tiles duplicate the menu.
4. The fixed "Data: Steam build ..., reviewed ..." footer strip on phone, which costs about 25 px on every screen; move it to Profile or Data trust.
5. Empty pages as menu entries (Upgrades 4 text nodes, Compare 7, Favorites 4, Update log 6, Build planner 9): hide until used or merge.
6. Beta dots: five orange dots in the menu pull the eye away from the zone content. Put "Beta" inside the page.
7. Intro paragraphs of caveats ("sources disagree", "guide, not checked") placed before data (Comfort). Fold under the table.
8. Repeated icons in the sidebar (Wood for Items, Flint for Recipes) mean nothing; use a section label or a single glyph per group.

## "Calm" design direction

- One question per screen: each page opens on what the player asked (a search or the current thing), then the list. Filters collapse into one "Filter" row.
- Quiet components: one badge colour for "needs attention" (amber) and no badge for "fine". Cream text slightly dimmer (#e6dcc8) to cut glare. Borders at least 3:1 for inputs only.
- One accent per page: gold for the title underline, amber for links, zone colour only for zone things (Checklist and Progression bars should use it).
- Three page kinds, three looks: Database (list and one quick card), Tool (inputs on top, result card below, with an empty state that says what to type), Owner (a plain "Owner" section with a different header colour, setup steps without file paths).
- Wide screen: two columns, list left and quick card right; the portals strip from 1,100 px, not 1,500.
- Narrow: tables become cards under 600 px; tap targets at least 40 px for every list row.
- Big text: scale headings and rows (about 125%) and remove motion, not just the root size.

## Findings

| ID | Severity | Evidence | Fix | Effort |
|---|---|---|---|---|
| C1 | High | Items has 892 pills (two per row), 33.3 screens, 14 badges in the first screen; screenshot `...-7.png` | One state pill per row, trust only on detail; start on filters not rows | M |
| C2 | High | Controls under 24 px: Recipes 1,553 of 1,726; Checklist 2,231 of 2,269; Building 426 of 905; Items 324 of 488 | Row-level tap area (whole row or 40 px min); keep ingredient pills as text on phone | M |
| C3 | High | Comfort on 390 px: clipped table, blank band, two paragraphs before table; `...-18.png` | Stack rows as cards under 600 px; caveats under the table | M |
| C4 | Med | Sidebar 1,414 px in a 653 px box with 29 links (36 to 60 px high); three nested scrollbars at 1280 | Group collapsed by default, shorter labels, one scroll | M |
| C5 | Med | Big text is 16 to 18 px only; Items height unchanged; headings fixed | Real large mode: 125 percent plus bigger rows, no scrollbars in nav | M |
| C6 | Med | "About this page" gold pill on all 29 pages is the brightest element after the title | Quiet text link beside the title | S |
| C7 | Med | Maintainer pages (My world, Console commands, Check in game, Data trust, Update log) look identical to player pages; My world uses `worlds_local`, `.db2` in code font | Owner section with its own header tint; setup wizard text in plain words | M |
| C8 | Med | Empty states: Favorites one line and 80 percent black void (`...-20.png`), Build planner, My character; Compare 7 text nodes, Upgrades 4 | Empty state with an example and one action; hide empty pages from menu | S |
| C9 | Med | 11 font sizes; 11.2 px used 68 times on Items and 12 px pills 897 times carry trust info; bronze on bg-2 is 4.10:1 | Floor of 12.8 px for anything meaning something; lighten bronze | S |
| C10 | Low | Card and input borders 1.47 to 1.94:1 against page; text is 15.7:1 | Raise input borders to 3:1, soften body text 10 to 15 percent | S |
| C11 | Low | Settings gear is 16x29 px; "Big text" 73x34 | 40 px targets in the header | S |
| C12 | Low | Orange beta dot on 5 menu entries; icons in menu repeat item sprites | Move Beta into pages; consistent glyph set | S |
| C13 | Low | Home at 1280 has no portals strip (appears only at 1500+); the owner's portals are the key second-screen glance | Show strip from 1,100 px or as a row above the zones | S |
| C14 | Low | Checklist progress bars are all amber; zone colours exist on Home | Reuse zone colour tokens | S |
| C15 | Low | Phone: permanent "Data: Steam build ... reviewed ..." footer above tab bar in `...-16.png`, `...-17.png` | Move to Profile | S |

## Protect this

- The dark-wood theme, Cinzel headings, parchment active state and zone colours: consistent across all 29 pages and already calm in layout.
- Home hero and zone cards (progress bars, boss name), and the Bosses page (`...-12.png`): the best examples of "one card, one answer" with only 7 pills.
- Phone bottom tab bar (Home, Search, Items, Planner, More): clear, large, correct.
- Reduced-motion support and no running animations.
- The first-run Home (`...-19.png`) works with empty storage and shows "Not started" zones without errors.
- Console commands as a model for a table that is plain, readable, filterable.

## Could not check

- A real device or true touch emulation; phone numbers come from a 390 px iframe (still `pointer: fine`, so the `(pointer: coarse)` rules, 9 of them in CSS, were not exercised).
- Real glare or luminance in a dark room; judged by contrast ratios only.
- Loading and error states (offline start, failed data load): none observed in normal runs.
- Item detail pages and the quick card in depth (outside the 29 menu entries); Cards view of Items.
- Wide 1912 px screenshots (reported by other reviewers; I used the live 1912 viewport only to confirm the three-column layout starts at 1500).
- The persisted Big text setting (not touched by rule).
- Forced-colours and print.
