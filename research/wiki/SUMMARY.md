# Valheim wiki research: summary

Source: https://valheim.fandom.com/wiki/ (read on 2-3 November 2026, no login or payment wall, no blocked pages).
Branch: `wiki-research`. Files: `part1-used-for.json` (39 items), `part2-missing.json` (60 items), `part3-materials.json` (9 items).

Every entry has only the fields you specified. Text is paraphrased; recipe lists, numbers and item names are exact. Where a page did not say something the field says "not stated". Wiki pages were read from inside the wiki tab in Chrome (page text pulled with in-page fetch); nothing was taken from memory.

## How to read the confidence field

- `stated`: the page says it plainly.
- `unclear`: the page is vague, contradicts itself or another page, has no page of its own, or the data came from a table or a list only.

## IMPORTANT: the Deep North items and the wiki disagree with itself

The wiki's **Version history** page says Valheim **1.0.00** was released on **9 September 2026** and added the Deep North biome, 40+ weapons, 20+ food items and many materials. It lists Moose, Seal, Kale, Oats, Poteitr, Lingonberries, Frostcore, Bloodgold, Moulds, the Nord, Frostfire and Thunderblood weapon families and the Frost Foundry under that release.

But the **Deep North** page still says the biome's content "exists in the game but in an incomplete state" and may need the developer console, and the **Future content** page still presents these items as teasers. I did not pick a winner. Every affected entry carries this in `gameVersionNote`. For the site: treat Deep North data as unverified.

Most of these items have **no wiki page of their own** (404): Oats, Oat Flour, Oat Milk, Oatmeal, Kale, Kale Seeds, Kale Chips, Pancakes, Poteitr, Lingonberries, Moose Meat, Moose Sinew, Seal Pelt, Seal Blubber, Frostcore and every Nord, Frostfire and Thunderblood weapon. Their data comes only from the **Food** page dish table (health, stamina, eitr, healing, duration and ingredients, but no crafting station), the Future content page and the Version history list. No stats, recipes or sources exist on the wiki for Kale Chips, Fish Soup, Cooked Moose Meat or Cooked Seal Blubber beyond their names.

## What was covered

- **Part 1 (39):** all items on your list, including the 10 trinkets. "Fishing Bait" is the wiki's **Bait** page (redirect), which lists every bait type.
- **Part 2 (60):** Ectoplasm; all 13 trinkets on the wiki (10 are in Part 1, the other 3 are Nimble Anklet, Fins of Destiny and Jörmundling); the 10 fish not in Part 1 (Trollfish, Giant Herring, Grouper, Tuna, Coral Cod, Pufferfish, Anglerfish, Magmafish, Northern Salmon, Tetra; Perch and Pike are in Part 1, 12 fish in total); Raw Fish, Cooked Fish, Fish Wraps; foods, ingredients and Deep North dishes; Egg and Cooked Egg; Serpent and Chicken meat with cooked versions; the listed materials; the Nord, Frostfire and Thunderblood families; Dyrnwyn; Hildir's Chests.
- **Part 3 (9):** Tar, Resin, Sharpening Stone, Iron Nails, Chain, Stone, Flint, Rock, Chitin, each with the building pieces and recipes its page lists. The pages give **no amounts**, only which pieces need the material.

Pieces that appear under more than one Part 3 material: Hot tub (Tar, Stone), Windmill (Iron Nails, Stone), Darkwood chair, Long heavy table and Round table (each under Tar and Iron Nails).

## What I could not find

- **Hildir's keys:** no page or item by that name; only Hildir's Chests exist (Brass, Silver, Bronze), which are recorded.
- **Seal Meat:** no such item. The wiki lists Seal Pelt and Seal Blubber as seal drops and a dish named Seal Meat Soup. The Seal creature page loads with an empty body.
- **Smoked Fish and Fish Soup:** no pages. Smoked Fish exists as a Deep North dish row in the Food table; Fish Soup is only a name in the Version history list. The wiki's **Cooked fish** item text calls itself "a tasty side of smoked fish", so that may be what the site means.
- **Cooked Moose Meat, Cooked Seal Blubber:** named in Version history only (no entries created).
- **Dyrnwyn:** which of the three Mysterious Locations holds which fragment was not captured.
- **Recipe amounts on usage lists:** many "used for" lists (for example Withered Bone in the Nimble Anklet, Tar in building pieces) name the recipe but not the quantity on that page. Quantities are given only where the item's own page or the Trinkets list states them (Nimble Anklet: Withered bone x5).
- **Egg:** I only captured the first part of the Egg page, so the natural spawning conditions for Hens' eggs are incomplete.

## Contradictions and notes (not resolved)

- **Raw Fish crafting station:** the Raw Fish and Fish pages say Food preparation table; the Tuna and Anglerfish pages say Cauldron; the Giant Herring page says Food preparation table; the Grouper page is muddled.
- **Carrot, Turnip and Onion seeds:** infobox says each plant produces 3 vegetables; the text says 1x.
- **Torch:** infobox says player crafting menu, upgrade table says Workbench level 1.
- **Dragon Egg:** one note says eggs do not respawn, another says they respawn after 8 h.
- **Pufferfish:** fish page says Mistlands coast only; the Bait page and Fish table also list the Ocean.
- **Moose drop name:** Moose page says "Moose pelt"; other pages say "Moose Hide".
- **Fishing Rod location:** rod page says edge of large frozen lakes in rare Frost Caves; Fishing page says near a rare runestone in some Frost Caves.
- **Crystal Heart:** list page shows "75% damage taken", item page says 25% resistance (same value stated two ways).
- **Tetra bonus drop** cell on the Fish page ("Obsidian 1-15 Coins") is ambiguous about quantities.
- **Oven Pancake and Oven Pancake Batter** show identical ingredients in the Food table; Unbaked and Baked Poteitr also show identical ingredients.
- Fish bonus-drop items (for example Perch gives Stone and Amber, Pike gives Flint and Amber pearl) come from the Fish page table; quantities are as printed there.
- **Bloodgold** page is a stub and gives its internal ID as "Gold".

## Item names seen on the wiki that were not on your lists but look important for a player

Fishing hat (needs one of every fish); Fish 'n' bread and Uncooked fish n' bread; Abyssal harpoon and Abyssal razor (Chitin recipes); Powdered dragon eggshells (sold by the Bog Witch); Mead bases (Vananidir, Troll endurance, Anti-sting); Mead ketill; Celebratory cap (Amber pearl); Staff of the Wild Dundr (Celestial feather); Artisan table and Artisan press (Dragon Tear, Majestic Carapace); Iron Fire Pit (Iron Pit); Sailor's bounty and Serpent stew; Honey glazed chicken; Intricate Key, Mörkhalla gates and the Winding Tunnels (Deep North); Frost Foundry, Frigid Kiln, Timberwood and Scalewood, Petrified Tissue, Ember Charge, Shovel and Grappling hook (all from the Deep North teaser or 1.0.00 list); Lingonberry Juice, Meat In Bread, Smoked Moose Meat and Seal Meat Soup (Deep North dishes).

## Pages that were slow or blocked

None were slow or blocked. Chrome refused actions on github.com for a short time during the session, so the files were committed through a local clone of the repo instead of the GitHub web editor. The wiki's own search API was used to find page names.
