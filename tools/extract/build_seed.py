"""Build the cleaned /data/*.json seed files from the raw dump made by extract_raw.py.

Game numbers (weights, stacks, damage, armor, food, recipes, drops, health) come straight from
the owner's local game files. What the game files do NOT contain is curated here by hand and
flagged: which biome an entry belongs to, hoard defaults, gather/smelt/cook sources, boss summon
items. Entries are limited to the allowlist below (Meadows + Black Forest).

Usage:  python tools/extract/build_seed.py data-raw data "<steam build id>"
"""

import csv
import json
import os
import sys
from collections import defaultdict

# ---------------------------------------------------------------- curated allowlist
# prefab id -> biome. Category is decided by which list the id is in.
MEADOWS, BLACKFOREST = 'meadows', 'blackforest'

MATERIALS = {
    MEADOWS: 'Wood Stone Flint Resin Coal Dandelion Raspberry Blueberries Mushroom Honey DeerHide '
    'LeatherScraps BoneFragments Feathers Needle Entrails RawMeat DeerMeat NeckTail HardAntler '
    'Amber AmberPearl Coins Acorn'.split(),
    BLACKFOREST: 'Carrot CarrotSeeds Thistle MushroomYellow GreydwarfEye AncientSeed ElderBark '
    'FineWood RoundLog Pukeberries SurtlingCore CopperOre Copper TinOre Tin Bronze BronzeNails TrollHide CryptKey '
    'Ruby'.split(),
}
TOOLS = {
    MEADOWS: 'Hammer Hoe Torch Cultivator FishingRod FishingBait'.split(),
    BLACKFOREST: [],
}
WEAPONS = {  # includes ammo, axes, pickaxes, shields
    MEADOWS: 'Club AxeStone AxeFlint PickaxeStone PickaxeAntler KnifeFlint SpearFlint Bow '
    'ArrowWood ArrowFlint ShieldWood'.split(),
    BLACKFOREST: 'BowFineWood ArrowBronze ShieldWoodTower ShieldBronzeBuckler AxeBronze '
    'PickaxeBronze MaceBronze SwordBronze SpearBronze AtgeirBronze KnifeCopper '
    'SledgeStagbreaker'.split(),
}
ARMOR = {  # id -> slot
    MEADOWS: {
        'ArmorRagsChest': 'chest', 'ArmorRagsLegs': 'legs', 'ArmorLeatherChest': 'chest',
        'ArmorLeatherLegs': 'legs', 'HelmetLeather': 'helmet', 'CapeDeerHide': 'cape',
    },
    BLACKFOREST: {
        'ArmorTrollLeatherChest': 'chest', 'ArmorTrollLeatherLegs': 'legs',
        'HelmetTrollLeather': 'helmet', 'CapeTrollHide': 'cape', 'ArmorBronzeChest': 'chest',
        'ArmorBronzeLegs': 'legs', 'HelmetBronze': 'helmet',
    },
}
FOODS = {
    MEADOWS: 'Raspberry Blueberries Mushroom Honey DeerMeat NeckTail RawMeat CookedMeat '
    'CookedDeerMeat NeckTailGrilled QueensJam'.split(),
    BLACKFOREST: 'Carrot MushroomYellow CarrotSoup DeerStew MinceMeatSauce Sausages BoarJerky '
    'Turnip'.split(),
}
MEADS = {
    MEADOWS: 'MeadBaseHealthMinor MeadHealthMinor MeadBaseStaminaMinor MeadStaminaMinor '
    'MeadBaseTasty MeadTasty'.split(),
    BLACKFOREST: [],
}
TROPHIES = {
    MEADOWS: 'TrophyBoar TrophyDeer TrophyNeck TrophyEikthyr'.split(),
    BLACKFOREST: 'TrophyGreydwarf TrophyGreydwarfBrute TrophyGreydwarfShaman TrophySkeleton '
    'TrophyFrostTroll TrophyTheElder TrophySurtling'.split(),
}
CREATURES = {
    MEADOWS: 'Boar Deer Neck Greyling'.split(),
    BLACKFOREST: 'Greydwarf Greydwarf_Elite Greydwarf_Shaman Skeleton Troll Surtling'.split(),
}
BOSSES = {'Eikthyr': MEADOWS, 'gd_king': BLACKFOREST}
BOSS_NAME_FALLBACK = {'gd_king': 'The Elder'}
# Boss summon items are not in the extracted components (altar offering stands).
BOSS_SUMMON = {'Eikthyr': [('TrophyDeer', 2)], 'gd_king': [('AncientSeed', 3)]}

BIOMES = [(MEADOWS, 'Meadows', 1), (BLACKFOREST, 'Black Forest', 2)]

# Sources the game files do not show as recipes/drops. Curated; entries get verified=unverified.
CURATED_OBTAINED = {
    'Wood': [('gather', 'Chop trees')],
    'Stone': [('gather', 'Pick up or mine stones and rock')],
    'Flint': [('gather', 'Loose flint on the ground, mainly near water')],
    'Resin': [('gather', 'Chop trees or destroy tree stumps')],
    'Coal': [('other', 'Burn Wood in a charcoal kiln')],
    'Copper': [('other', 'Smelt Copper Ore in a smelter')],
    'Tin': [('other', 'Smelt Tin Ore in a smelter')],
    'CopperOre': [('gather', 'Mine copper deposits')],
    'TinOre': [('gather', 'Mine tin deposits in shallow water')],
    'CookedMeat': [('other', 'Cook Raw Meat on a cooking station')],
    'CookedDeerMeat': [('other', 'Cook Deer Meat on a cooking station')],
    'NeckTailGrilled': [('other', 'Cook Neck Tail on a cooking station')],
    'Dandelion': [('gather', 'Pick wild plants')],
    'Raspberry': [('gather', 'Pick wild bushes')],
    'Blueberries': [('gather', 'Pick wild bushes')],
    'Mushroom': [('gather', 'Pick from the ground')],
    'MushroomYellow': [('gather', 'Pick from the ground')],
    'Thistle': [('gather', 'Pick from the ground')],
    'Carrot': [('gather', 'Grow from Carrot Seeds')],
    'Honey': [('other', 'Beehive')],
}
BOSS_DROPS_ONLY = set()

# Hoard defaults are suggestions, not game data.
HOARD_KEEP_SOME = {'Wood': 200, 'Stone': 100, 'Flint': 50, 'Resin': 50, 'Coal': 50, 'LeatherScraps': 30,
                   'DeerHide': 20, 'BoneFragments': 30, 'FineWood': 50, 'Feathers': 20}
HOARD_MUST_KEEP = {'Copper', 'Tin', 'Bronze', 'CopperOre', 'TinOre', 'SurtlingCore', 'AncientSeed',
                   'TrollHide', 'ElderBark', 'CryptKey', 'Amber', 'AmberPearl', 'Ruby', 'HardAntler',
                   'GreydwarfEye', 'Entrails', 'BronzeNails'}

SKILLS = {1: 'Swords', 2: 'Knives', 3: 'Clubs', 4: 'Polearms', 5: 'Spears', 6: 'Blocking', 7: 'Axes',
          8: 'Bows', 9: 'FireMagic', 10: 'FrostMagic', 11: 'Unarmed', 12: 'Pickaxes',
          13: 'WoodCutting', 14: 'Crossbows', 15: 'ElementalMagic', 16: 'BloodMagic'}
DMG_KEYS = ['blunt', 'slash', 'pierce', 'chop', 'pickaxe', 'fire', 'frost', 'lightning', 'poison',
            'spirit']

# ---------------------------------------------------------------- helpers


def load(raw, name):
    with open(os.path.join(raw, name), encoding='utf8') as f:
        return json.load(f)


def main(raw, out, build_id):
    refs = load(raw, 'refs.json')
    go_name = {int(k): v for k, v in refs['gameObjects'].items()}
    comp_go = {int(k): v for k, v in refs['components'].items()}

    loc = {}
    for fn in sorted(os.listdir(os.path.join(raw, 'localization'))):
        if not fn.startswith('localization'):
            continue
        with open(os.path.join(raw, 'localization', fn), encoding='utf8', newline='') as f:
            for row in csv.reader(f):
                if len(row) > 1 and row[0] and row[1]:
                    loc.setdefault(row[0], row[1])

    def english(token, fallback):
        if token.startswith('$'):
            return loc.get(token[1:], fallback)
        return token or fallback

    warnings = []
    missing_refs = 0

    def name_of_component(ref):
        nonlocal missing_refs
        pid = ref.get('m_PathID', 0)
        if not pid:
            return None
        go = comp_go.get(pid)
        if go is None:
            missing_refs += 1
            return None
        return go_name.get(go)

    def name_of_go(ref):
        pid = ref.get('m_PathID', 0)
        return go_name.get(pid) if pid else None

    # --- index items by prefab id (first occurrence wins; duplicates are variants)
    items_raw = {}
    for row in load(raw, 'item.json'):
        pid = go_name.get(comp_go.get(row['pathId']))
        if pid and pid not in items_raw:
            items_raw[pid] = row['data']['m_itemData']['m_shared']

    def tuples(d):
        return [(i, b) for b, ids in d.items() for i in ids]

    biome_of, category_of, armor_slot = {}, {}, {}
    for cat, d in (('material', MATERIALS), ('tool', TOOLS), ('weapon', WEAPONS), ('food', FOODS),
                   ('mead', MEADS), ('trophy', TROPHIES)):
        for i, b in tuples(d):
            if i in biome_of and cat in ('food',):
                continue  # food ids may overlap with materials; keep the earlier category
            if i in biome_of and cat != 'food':
                warnings.append(f'{i} listed twice; keeping first ({category_of[i]})')
                continue
            biome_of[i], category_of[i] = b, cat
    for b, d in ARMOR.items():
        for i, slot in d.items():
            biome_of[i], category_of[i], armor_slot[i] = b, 'armor', slot
    food_ids = {i for i, _ in tuples(FOODS)}

    for i in list(biome_of):
        if i not in items_raw:
            warnings.append(f'allowlisted item {i} not found in game files; dropped')
            del biome_of[i]
            del category_of[i]
    allowed = set(biome_of)

    # --- creatures / bosses (Character + CharacterDrop on the same prefab)
    chars = {}
    for row in load(raw, 'character.json'):
        n = go_name.get(comp_go.get(row['pathId']))
        if n and n not in chars:
            chars[n] = row['data']
    drops_by_char = {}
    for row in load(raw, 'drops.json'):
        n = go_name.get(row['data']['m_GameObject']['m_PathID'])
        if n and n not in drops_by_char:
            drops_by_char[n] = row['data']['m_drops']

    def clean_drops(char_id):
        res = []
        for d in drops_by_char.get(char_id, []):
            item = name_of_go(d['m_prefab'])
            if item in allowed:
                e = {'item': item, 'min': d['m_amountMin'], 'max': d['m_amountMax']}
                if d['m_chance'] < 1:
                    e['chance'] = round(d['m_chance'], 4)
                res.append(e)
            elif item:
                warnings.append(f'drop {item} of {char_id} is not in the allowlist; skipped')
        return res

    src = f'game-files:steam-build-{build_id}'
    prov = {'source': src, 'verified': 'cross-checked'}

    biomes = [{'id': i, 'name': n, 'order': o, **prov} for i, n, o in BIOMES]
    creatures, bosses = [], []
    monster_ids = set()
    for cid, b in tuples(CREATURES) + [(k, v) for k, v in BOSSES.items()]:
        if cid not in chars:
            warnings.append(f'creature {cid} not found; dropped')
            continue
        data = chars[cid]
        name = english(data.get('m_name', ''), BOSS_NAME_FALLBACK.get(cid, cid))
        entry = {'id': cid, 'name': name, 'biome': b, 'health': data.get('m_health'),
                 'drops': clean_drops(cid), **prov}
        if cid in BOSSES:
            del entry['biome']
            entry['biome'] = b
            summon = [{'item': i, 'qty': q} for i, q in BOSS_SUMMON.get(cid, []) if i in allowed]
            entry['summonItems'] = summon
            troph = next((d['item'] for d in entry['drops'] if d['item'].startswith('Trophy')), None)
            if troph:
                entry['trophy'] = troph
            entry['verified'] = 'unverified'
            entry['note'] = 'Health and drops from game files; summon items curated, not in extracted data.'
            bosses.append(entry)
        else:
            creatures.append(entry)
        monster_ids.add(cid)

    # --- recipes
    stations_seen = {}
    recipes = []
    recipe_ids = set()
    recipe_outputs = defaultdict(list)
    for row in load(raw, 'recipe.json'):
        d = row['data']
        out_item = name_of_component(d['m_item'])
        if out_item not in allowed or not d['m_enabled']:
            continue
        shared = items_raw[out_item]
        station = name_of_component(d['m_craftingStation'])
        inputs, upgrades = [], defaultdict(list)
        ok = True
        for r in d['m_resources']:
            if r['m_upgraderResource']:
                continue
            rin = name_of_component(r['m_resItem'])
            if rin not in allowed:
                warnings.append(f"recipe {d['m_Name']}: input {rin} not in allowlist; recipe skipped")
                ok = False
                break
            if r['m_amount'] > 0:  # amount 0 means the item is only needed for upgrades
                inputs.append({'item': rin, 'qty': r['m_amount']})
            for q in range(2, shared['m_maxQuality'] + 1):
                if r['m_amountPerLevel'] and r['m_amount'] + (q - 1) * r['m_amountPerLevel'] > 0:
                    upgrades[q].append({'item': rin, 'qty': r['m_amount'] + (q - 1) * r['m_amountPerLevel']})
        if not ok:
            continue
        rid = 'recipe.' + d['m_Name'].removeprefix('Recipe_')
        if rid in recipe_ids:
            warnings.append(f'duplicate recipe id {rid}; skipped')
            continue
        recipe_ids.add(rid)
        recipe_outputs[out_item].append(rid)
        if station:
            stations_seen[station] = True
        recipes.append({
            'id': rid, 'kind': 'craft', 'output': {'item': out_item, 'qty': d['m_amount']},
            'station': {'id': station, 'minLevel': max(1, d['m_minStationLevel'])} if station else None,
            'inputs': inputs,
            'upgrades': [{'quality': q, 'inputs': v} for q, v in sorted(upgrades.items())],
            **prov,
        })

    # --- stations referenced by kept recipes
    station_name = {}
    for row in load(raw, 'station.json'):
        n = go_name.get(comp_go.get(row['pathId']))
        if n and n not in station_name:
            station_name[n] = english(row['data'].get('m_name', ''), n)
    stations = [{'id': s, 'name': station_name.get(s, s), 'levels': [], **prov,
                 'note': 'Upgrade levels and their requirements are not extracted yet.'}
                for s in sorted(stations_seen)]

    # --- items and stat extensions
    items, weapons, armor, foods, trophies = [], [], [], [], []
    recipe_sources_by_item = {i: [{'type': 'recipe', 'recipe': r} for r in rs]
                              for i, rs in recipe_outputs.items()}
    dropped_by = defaultdict(list)
    for c in creatures + bosses:
        for d in c['drops']:
            dropped_by[d['item']].append(c['id'])

    for iid in sorted(allowed):
        s = items_raw[iid]
        cat = category_of[iid]
        obtained = []
        curated = CURATED_OBTAINED.get(iid, [])
        for t, v in curated:
            obtained.append({'type': t, ('node' if t == 'gather' else 'note'): v})
        obtained += [{'type': 'drop', 'creature': c} for c in dropped_by.get(iid, [])]
        obtained += recipe_sources_by_item.get(iid, [])
        if iid in HOARD_KEEP_SOME:
            hoard, extra = 'keep_some', {'recommendedQty': HOARD_KEEP_SOME[iid]}
        elif iid in HOARD_MUST_KEEP:
            hoard, extra = 'must_keep', {}
        elif cat == 'trophy':
            hoard, extra = 'decorative', {}
        elif cat in ('weapon', 'armor', 'tool'):
            hoard, extra = 'safe_discard', {}
        else:
            hoard, extra = 'safe_discard', {}
        item = {
            'id': iid, 'name': english(s['m_name'], iid), 'category': cat, 'biome': biome_of[iid],
            'weight': s['m_weight'], 'stackSize': s['m_maxStackSize'], 'tags': [],
            'hoard': hoard, **extra, 'obtainedFrom': obtained, **prov,
        }
        if curated:
            item['verified'] = 'unverified'
            item['note'] = 'Stats from game files; acquisition source curated by hand.'
        items.append(item)

        dur = s.get('m_maxDurability')
        if cat == 'weapon':
            dmg = {k: s['m_damages']['m_' + k] for k in DMG_KEYS if s['m_damages']['m_' + k]}
            per = {k: s['m_damagesPerLevel']['m_' + k] for k in DMG_KEYS if s['m_damagesPerLevel']['m_' + k]}
            w = {'item': iid, 'skill': SKILLS.get(s['m_skillType'], f"skill{s['m_skillType']}"),
                 'damage': dmg, **prov}
            if per:
                w['damagePerLevel'] = per
            if s['m_blockPower']:
                w['blockPower'] = s['m_blockPower']
            if s['m_deflectionForce']:
                w['parryForce'] = s['m_deflectionForce']
            if s['m_attackForce']:
                w['knockback'] = s['m_attackForce']
            if dur:
                w['durability'] = dur
            weapons.append(w)
        elif cat == 'armor':
            a = {'item': iid, 'slot': armor_slot[iid], 'armor': s['m_armor'], **prov}
            if dur:
                a['durability'] = dur
            if s.get('m_setName'):
                a['setName'] = s['m_setName']
            armor.append(a)
        elif cat == 'trophy':
            owner = next((c['id'] for c in creatures + bosses if any(d['item'] == iid for d in c['drops'])), None)
            if owner:
                trophies.append({'item': iid, 'creature': owner, **prov})
            else:
                warnings.append(f'trophy {iid}: no owning creature found among dropped trophies')
        if iid in food_ids and s['m_food'] > 0:
            foods.append({'item': iid, 'kind': 'food', 'health': s['m_food'], 'stamina': s['m_foodStamina'],
                          'durationSec': s['m_foodBurnTime'], **prov})

    # armor from the allowlist: shields live in weapons (Blocking skill), no separate slot needed.
    os.makedirs(out, exist_ok=True)
    meta = {'gameVersion': f'Steam build {build_id}', 'lastReviewed': '2026-10-26'}
    files = {'meta': meta, 'biomes': biomes, 'items': items, 'recipes': recipes, 'stations': stations,
             'weapons': weapons, 'armor': armor, 'foods': foods, 'trophies': trophies,
             'creatures': creatures, 'bosses': bosses, 'pieces': []}
    for name, content in files.items():
        with open(os.path.join(out, f'{name}.json'), 'w', encoding='utf8', newline='\n') as f:
            json.dump(content, f, indent=2, ensure_ascii=False)
            f.write('\n')
    for k in ('items', 'recipes', 'stations', 'weapons', 'armor', 'foods', 'trophies', 'creatures', 'bosses'):
        print(k, len(files[k]))
    print('unresolved component refs:', missing_refs)
    for w in warnings:
        print('WARN', w)


if __name__ == '__main__':
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    main(*sys.argv[1:])
