# Updating the data after a Valheim patch

The site's data is read from the game files on your PC. After a game patch, refresh it like this.
The same steps were used for every zone pass, so they are well worn. Takes about 15 minutes plus
the review.

You need: the game installed (`D:\SteamLibrary\steamapps\common\Valheim`), Python 3.12 with
`pip install UnityPy pillow`, and Node. All commands run from the repository root. Use Python 3.12
explicitly with `-I`:

```
PY="C:/Users/Vartd/AppData/Local/Programs/Python/Python312/python.exe"
```

## 1. Start a branch and note the build id

```
git checkout -b data-update-<build id>
```

The Steam build id is on the game's properties page (Updates), or in
`D:\SteamLibrary\steamapps\appmanifest_892970.acf` (`buildid`).

## 2. Read the game files again

```
"$PY" -I tools/extract/extract_raw.py          "D:/SteamLibrary/steamapps/common/Valheim" data-raw
"$PY" -I tools/extract/extract_piece_tables.py "D:/SteamLibrary/steamapps/common/Valheim" data-raw
"$PY" -I tools/extract/extract_attack_timing.py "D:/SteamLibrary/steamapps/common/Valheim" data-raw
```

`data-raw/` is git-ignored: it is the raw dump and never committed.

## 3. Rebuild the data

```
"$PY" -I tools/extract/build_data.py data-raw data <build id>
```

It prints counts and warnings. Read them:

- `WARN allowlisted item X not found in game files`: the game renamed or removed an item. Fix
  the id in `tools/extract/biomes/*.json`.
- `config says A but spawn data says B`: a creature moved zone.
- `station X has an empty build cost`: a build item is missing from every biome config.
- `MISSING? Recipe_...` lines and the diff of `tools/extract/dropped_recipes.json`: recipes the game
  has that the site does not. New content from the patch shows up here first. Add the items to the
  right zone config, or add a reason to `tools/extract/dropped_reasons.json`.

## 4. Look at what changed

```
git diff --stat data
git diff data/items.json | head -200
```

Expect changes only where the patch changed things. A large unexpected diff means a rename or a
format change in the game files; stop and look before going on.

The build also compares the new files with the old ones and, when the Steam build id is new,
adds an entry to `data/updatelog.json` (new, removed and changed ids). It shows on the site's
"Update log" page. Re-running the build with the same build id adds nothing, so fixes to our own
notes never show up as game changes.

## 5. New icons

```
"$PY" -I tools/extract/extract_icons.py "D:/SteamLibrary/steamapps/common/Valheim" data-raw data src/assets/icons
```

Takes a few minutes. New ids get a `.webp` in `src/assets/icons/`.

## 6. Check

```
npm run validate
npm run lint
npm run test
npm run build
```

Tests that commonly fail after a patch, and what they mean:

| Test | Meaning |
|---|---|
| icons for every item and station | run step 5 |
| every craftable item has a recipe | a new item needs a recipe or an entry in `no_recipe.json` |
| every recipe left out has a reason | add the recipe to `dropped_reasons.json` |
| no two items share a name | give one a name in `name_overrides.json` |
| no crafted item in an earlier zone | move the item to a later zone config |
| every station has a build cost | a build material is not in any zone config yet |

## 7. Record it

- `data/meta.json` is updated by the build (`gameVersion`, `lastReviewed`).
- Add a short note to `docs/DATA_SOURCES.md` for anything hand-written that the patch touched
  (summon costs, gather notes) and extend the in-game spot-check list.
- Update the `docs/ROADMAP.md` status line.

## 8. Ship

Open a pull request into `main`, merge it, and wait for the Deploy workflow. Then open the live
site and check the line "Data: Steam build ..." (sidebar on desktop, bottom of the page on a phone).
The service worker updates by itself, so a returning visitor gets the new data on the next load.

## 9. Console commands

The command list comes from the game's code, not its assets:

```
dotnet tool install ilspycmd --tool-path ./ilspy      # once
./ilspy/ilspycmd -t Terminal "D:/SteamLibrary/steamapps/common/Valheim/valheim_Data/Managed/assembly_valheim.dll" > Terminal.cs
"$PY" -I tools/extract/extract_console_commands.py Terminal.cs data
```

Check `git diff data/commands.json` for new or removed commands. A new skill also needs a line in
`tools/extract/save_skills.json` (a warning from step 3 says so).

## 10. Character files (only if the game changed its save format)

The "My character" page reads `.fch` files with `src/features/save/fch.ts`, which follows the
game's own loader for file version 47. If a patch raises the version, the page says so and refuses
the file instead of guessing. To update it: decompile `assembly_valheim.dll` (for example with
`ilspycmd -t PlayerProfile`, `-t Player`, `-t Inventory`, `-t Skills`), compare the load code with
`parseCharacter`, change it, and raise `MAX_FILE_VERSION`. New skills go in
`tools/extract/save_skills.json`. `data/savekeys.json` is rebuilt by step 3.

## If something goes wrong

- The deploy fails on a test timing out: tests allow 30 s each; a failure is real, not slow CI.
- A page shows an internal id: a name is missing from the localisation; the build falls back to the id.
- You want the old data back: `git revert` the data PR; nothing else depends on it.
