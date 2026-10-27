"""Build the cleaned /data/*.json files from the raw dump made by extract_raw.py.

Game numbers (weights, stacks, damage, armor, food, recipes, drops, health, station extensions,
conversions, status effects, resistances) come straight from the owner's local game files.
What the game files do NOT contain is curated by hand in tools/extract/biomes/<biome>.json and
flagged: which items belong to a biome, hoard defaults, gather sources, boss summon items.
All biome configs are merged on every run, so adding a biome can only add or complete entries.

Usage:  python tools/extract/build_data.py data-raw data "<steam build id>" [YYYY-MM-DD]
"""

import csv
import json
import os
import re
import sys
from collections import defaultdict
from datetime import date

SKILLS = {1: 'Swords', 2: 'Knives', 3: 'Clubs', 4: 'Polearms', 5: 'Spears', 6: 'Blocking', 7: 'Axes',
          8: 'Bows', 9: 'FireMagic', 10: 'FrostMagic', 11: 'Unarmed', 12: 'Pickaxes',
          13: 'WoodCutting', 14: 'Crossbows', 15: 'ElementalMagic', 16: 'BloodMagic'}
DMG_KEYS = ['blunt', 'slash', 'pierce', 'chop', 'pickaxe', 'fire', 'frost', 'lightning', 'poison',
            'spirit']
# Character.DamageModifier enum
MODIFIER = {1: 'resistant', 2: 'weak', 3: 'immune', 4: 'ignore', 5: 'very resistant', 6: 'very weak'}
# Heightmap.Biome flags used by the spawn system
BIOME_BITS = {1: 'meadows', 2: 'swamp', 4: 'mountain', 8: 'blackforest', 16: 'plains', 32: 'ashlands',
              64: 'deepnorth', 256: 'ocean', 512: 'mistlands'}
# Conversion components (fermenter, smelter, kiln, cooking station, ...) -> recipe kind
CONVERSION_KIND = {'fermenter': 'ferment', 'piece_cookingstation': 'cook'}


def base_name(name):
    """Strip Unity's ' (1)' duplicate suffix so variants of one prefab share an id."""
    return re.sub(r' \(\d+\)$', '', name) if name else name


def load(raw, name):
    with open(os.path.join(raw, name), encoding='utf8') as f:
        return json.load(f)


def load_configs():
    here = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'biomes')
    configs = []
    for fn in sorted(os.listdir(here)):
        if fn.endswith('.json'):
            with open(os.path.join(here, fn), encoding='utf8') as f:
                configs.append(json.load(f))
    return sorted(configs, key=lambda c: c['order'])


def main(raw, out, build_id, reviewed=None):
    reviewed = reviewed or date.today().isoformat()
    configs = load_configs()
    warnings = []

    refs = load(raw, 'refs.json')
    go_name = {int(k): v for k, v in refs['gameObjects'].items()}
    comp_go = {int(k): v for k, v in refs['components'].items()}

    loc = {}
    for fn in sorted(os.listdir(os.path.join(raw, 'localization'))):
        if fn.startswith('localization'):
            with open(os.path.join(raw, 'localization', fn), encoding='utf8', newline='') as f:
                for row in csv.reader(f):
                    if len(row) > 1 and row[0] and row[1]:
                        loc.setdefault(row[0], row[1])

    def english(token, fallback):
        if token and token.startswith('$'):
            return loc.get(token[1:], fallback)
        return token or fallback

    def comp_name(ref):
        pid = ref.get('m_PathID', 0)
        return go_name.get(comp_go.get(pid)) if pid else None

    def go_ref_name(ref):
        pid = ref.get('m_PathID', 0)
        return go_name.get(pid) if pid else None

    # ---- raw indexes (first occurrence of a prefab name wins; the rest are variants)
    items_raw = {}
    for row in load(raw, 'item.json'):
        n = go_name.get(comp_go.get(row['pathId']))
        if n and n not in items_raw:
            items_raw[n] = row['data']['m_itemData']['m_shared']
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
    status = {r['pathId']: r['data'] for r in load(raw, 'statuseffect.json')}
    pieces = {}
    for row in load(raw, 'piece.json'):
        n = go_name.get(comp_go.get(row['pathId']))
        if n and n not in pieces:
            pieces[n] = row['data']

    # ---- spawn data: which biomes each creature spawns in (used to cross-check the configs)
    spawn_biomes = defaultdict(set)
    for row in load(raw, 'spawnsystem.json'):
        for sp in row['data']['m_spawners']:
            if not sp['m_enabled'] or sp['m_devDisabled']:
                continue
            prefab = go_ref_name(sp['m_prefab'])
            for bit, name in BIOME_BITS.items():
                if sp['m_biome'] & bit:
                    spawn_biomes[prefab].add(name)

    # ---- merge configs
    biome_of, category_of, armor_slot = {}, {}, {}
    creature_biome, boss_biome = {}, {}
    summon, curated_src, keep_some, must_keep = {}, {}, {}, set()

    def add_item(i, cat, biome):
        if i in biome_of:
            if cat != 'food':
                warnings.append(f'{i} listed twice; keeping first ({category_of[i]})')
            return
        biome_of[i], category_of[i] = biome, cat

    for c in configs:
        b = c['id']
        for cat, key in (('material', 'materials'), ('tool', 'tools'), ('weapon', 'weapons'),
                         ('mead', 'meads'), ('trophy', 'trophies'), ('food', 'foods')):
            for i in c.get(key, []):
                add_item(i, cat, b)
        for i, slot in c.get('armor', {}).items():
            biome_of[i], category_of[i], armor_slot[i] = b, 'armor', slot
        for i in c.get('creatures', []):
            creature_biome[i] = b
        for i in c.get('bosses', []):
            boss_biome[i] = b
        summon.update(c.get('bossSummon', {}))
        curated_src.update(c.get('gather', {}))
        keep_some.update(c.get('hoard', {}).get('keepSome', {}))
        must_keep.update(c.get('hoard', {}).get('mustKeep', []))
    food_ids = {i for c in configs for i in c.get('foods', [])}

    for i in list(biome_of):
        if i not in items_raw:
            warnings.append(f'allowlisted item {i} not found in game files; dropped')
            del biome_of[i]
            del category_of[i]
    allowed = set(biome_of)

    src = f'game-files:steam-build-{build_id}'
    prov = {'source': src, 'verified': 'cross-checked'}

    # ---- creatures and bosses
    def clean_drops(char_id):
        res = []
        for d in drops_by_char.get(char_id, []):
            item = go_ref_name(d['m_prefab'])
            if item in allowed:
                e = {'item': item, 'min': d['m_amountMin'], 'max': d['m_amountMax']}
                if d['m_chance'] < 1:
                    e['chance'] = round(d['m_chance'], 4)
                res.append(e)
            elif item:
                warnings.append(f'drop {item} of {char_id} is not in any biome config; skipped')
        return res

    def attacks_of(data):
        res, seen_ids = [], set()
        refs_ = [*data.get('m_defaultItems', []), *data.get('m_randomWeapon', [])]
        for rs in data.get('m_randomSets', []):
            refs_.extend(rs.get('m_items', []))
        for ref in refs_:
            name = go_ref_name(ref)
            shared = items_raw.get(name)
            if not shared or name in seen_ids:
                continue
            seen_ids.add(name)
            dmg = {k: shared['m_damages']['m_' + k] for k in DMG_KEYS
                   if shared['m_damages']['m_' + k] and k not in ('chop', 'pickaxe')}
            if dmg:
                res.append({'id': name, 'damage': dmg})
        return res

    def resistances_of(data):
        res = {}
        for k, v in data.get('m_damageModifiers', {}).items():
            key = k.removeprefix('m_')
            if key in ('chop', 'pickaxe', 'nonPlayer') or v not in MODIFIER:
                continue
            res[key] = MODIFIER[v]
        return res

    creatures, bosses = [], []
    for cid, biome in [*creature_biome.items(), *boss_biome.items()]:
        if cid not in chars:
            warnings.append(f'creature {cid} not found; dropped')
            continue
        data = chars[cid]
        seen = spawn_biomes.get(cid)
        if seen and biome not in seen and cid not in boss_biome:
            warnings.append(f'{cid}: config says {biome} but spawn data says {sorted(seen)}')
        entry = {'id': cid, 'name': english(data.get('m_name', ''), cid), 'biome': biome,
                 'health': data.get('m_health'), 'drops': clean_drops(cid),
                 'attacks': attacks_of(data), **prov}
        res = resistances_of(data)
        if res:
            entry['resistances'] = res
        if cid in boss_biome:
            entry['summonItems'] = [{'item': i, 'qty': q} for i, q in summon.get(cid, []) if i in allowed]
            troph = next((d['item'] for d in entry['drops'] if d['item'].startswith('Trophy')), None)
            if troph:
                entry['trophy'] = troph
            entry['verified'] = 'unverified'
            entry['note'] = 'Health, drops, attacks and resistances from game files; summon items curated.'
            bosses.append(entry)
        else:
            creatures.append(entry)
    monster_ids = {c['id'] for c in creatures + bosses}

    # ---- recipes (crafting)
    stations_seen = set()
    recipes, recipe_ids = [], set()
    recipe_outputs = defaultdict(list)
    for row in load(raw, 'recipe.json'):
        d = row['data']
        out_item = comp_name(d['m_item'])
        if out_item not in allowed or not d['m_enabled']:
            continue
        shared = items_raw[out_item]
        station = comp_name(d['m_craftingStation'])
        inputs, upgrades, ok = [], defaultdict(list), True
        for r in d['m_resources']:
            if r['m_upgraderResource']:
                continue
            rin = comp_name(r['m_resItem'])
            if rin not in allowed:
                warnings.append(f"recipe {d['m_Name']}: input {rin} not in any biome config; skipped")
                ok = False
                break
            if r['m_amount'] > 0:
                inputs.append({'item': rin, 'qty': r['m_amount']})
            for q in range(2, shared['m_maxQuality'] + 1):
                qty = r['m_amount'] + (q - 1) * r['m_amountPerLevel']
                if r['m_amountPerLevel'] and qty > 0:
                    upgrades[q].append({'item': rin, 'qty': qty})
        rid = 'recipe.' + d['m_Name'].removeprefix('Recipe_')
        if not ok or rid in recipe_ids:
            continue
        recipe_ids.add(rid)
        recipe_outputs[out_item].append(rid)
        if station:
            stations_seen.add(station)
        recipes.append({
            'id': rid, 'kind': 'craft', 'output': {'item': out_item, 'qty': d['m_amount']},
            'station': {'id': station, 'minLevel': max(1, d['m_minStationLevel'])} if station else None,
            'inputs': inputs,
            'upgrades': [{'quality': q, 'inputs': v} for q, v in sorted(upgrades.items())],
            **prov,
        })

    # ---- conversions: cooking, smelting, kilns, fermenting (from -> to, with a time)
    conv_names = {}
    for row in load(raw, 'conversion.json'):
        d = row['data']
        station = base_name(go_name.get(comp_go.get(row['pathId'])))
        if not station or station in conv_names:
            continue
        conv_names[station] = english(d.get('m_name', ''), station)
        kind = 'cook' if 'cooking' in station else CONVERSION_KIND.get(station, 'smelt')
        time_s = d.get('m_fermentationDuration') if station == 'fermenter' else None
        for c in d['m_conversion']:
            frm, to = comp_name(c.get('m_from', {})), comp_name(c.get('m_to', {}))
            if frm not in allowed or to not in allowed:
                continue
            rid = f'conv.{station}.{frm}'
            if rid in recipe_ids:
                continue
            recipe_ids.add(rid)
            recipe_outputs[to].append(rid)
            stations_seen.add(station)
            t = time_s or c.get('m_cookTime')
            recipe = {'id': rid, 'kind': kind, 'output': {'item': to, 'qty': 1},
                      'station': {'id': station, 'minLevel': 1},
                      'inputs': [{'item': frm, 'qty': 1}], 'upgrades': [], **prov}
            if t:
                recipe['timeSec'] = t
            recipes.append(recipe)

    # ---- stations: name, build cost, extensions
    station_raw = {}
    for row in load(raw, 'station.json'):
        n = go_name.get(comp_go.get(row['pathId']))
        if n and n not in station_raw:
            station_raw[n] = row['data']

    def piece_cost(name):
        p = pieces.get(name)
        if not p:
            return None
        cost = []
        for r in p['m_resources']:
            item = comp_name(r['m_resItem'])
            if item not in allowed:
                return None  # incomplete until the biome that adds the item is configured
            cost.append({'item': item, 'qty': r['m_amount']})
        return cost

    ext_by_station = defaultdict(dict)
    for row in load(raw, 'stationext.json'):
        d = row['data']
        ext = go_name.get(comp_go.get(row['pathId']))
        owner = comp_name(d['m_craftingStation'])
        if not ext or not owner or ext in ext_by_station[owner]:
            continue
        cost = piece_cost(ext)
        if cost is None:
            warnings.append(f'extension {ext} of {owner}: needs items outside the configured biomes; skipped')
            continue
        name = english(pieces[ext].get('m_name', ''), ext)
        ext_by_station[owner][ext] = {'id': ext, 'name': name, 'rangeM': d['m_maxStationDistance'] or None,
                                      'requirements': cost}

    stations = []
    for s in sorted(stations_seen):
        data = station_raw.get(s, {})
        cost = piece_cost(s)
        entry = {'id': s, 'name': english(data.get('m_name', ''), conv_names.get(s, s)),
                 'buildRequirements': cost or [], 'levels': [],
                 'extensions': list(ext_by_station.get(s, {}).values()), **prov}
        notes = ['Station level rises with the extensions built near it.']
        if cost is None and s in pieces:
            notes.append('Build cost not shown: it needs items from biomes not added yet.')
        entry['note'] = ' '.join(notes)
        stations.append(entry)

    # ---- items and their stat extensions
    items, weapons, armor, foods, trophies = [], [], [], [], []
    sources_by_item = {i: [{'type': 'recipe', 'recipe': r} for r in rs] for i, rs in recipe_outputs.items()}
    dropped_by = defaultdict(list)
    for c in creatures + bosses:
        for d in c['drops']:
            dropped_by[d['item']].append(c['id'])

    def tooltip_of(shared):
        se = status.get(shared['m_consumeStatusEffect']['m_PathID'])
        return se, (english(se.get('m_tooltip', ''), '') if se else '')

    for iid in sorted(allowed):
        s = items_raw[iid]
        cat = category_of[iid]
        curated = curated_src.get(iid, [])
        obtained = [{'type': t, ('node' if t == 'gather' else 'note'): v} for t, v in curated]
        obtained += [{'type': 'drop', 'creature': c} for c in dropped_by.get(iid, [])]
        obtained += sources_by_item.get(iid, [])
        if iid in keep_some:
            hoard, extra = 'keep_some', {'recommendedQty': keep_some[iid]}
        elif iid in must_keep:
            hoard, extra = 'must_keep', {}
        elif cat == 'trophy':
            hoard, extra = 'decorative', {}
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
            for key, field in (('m_blockPower', 'blockPower'), ('m_deflectionForce', 'parryForce'),
                               ('m_attackForce', 'knockback')):
                if s[key]:
                    w[field] = s[key]
            if dur:
                w['durability'] = dur
            if s.get('m_maxQuality', 1) > 1:
                w['maxQuality'] = s['m_maxQuality']
            weapons.append(w)
        elif cat == 'armor':
            a = {'item': iid, 'slot': armor_slot[iid], 'armor': s['m_armor'], **prov}
            if dur:
                a['durability'] = dur
            if s.get('m_setName'):
                a['setName'] = s['m_setName']
                if s.get('m_setSize'):
                    a['setSize'] = s['m_setSize']
                set_se = status.get(s['m_setStatusEffect']['m_PathID'])
                effect = english(set_se.get('m_tooltip', ''), '') if set_se else ''
                if effect:
                    a['setEffect'] = effect
            if s['m_movementModifier']:
                a['movementModifier'] = round(s['m_movementModifier'], 4)
            if s.get('m_maxQuality', 1) > 1:
                a['maxQuality'] = s['m_maxQuality']
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
        elif cat == 'mead':
            se, tip = tooltip_of(s)
            if se:
                f = {'item': iid, 'kind': 'mead', 'durationSec': se['m_ttl'] or None, **prov}
                if se['m_healthOverTime'] > 0:
                    f['health'] = se['m_healthOverTime']
                if se['m_staminaOverTime'] > 0:
                    f['stamina'] = se['m_staminaOverTime']
                if tip:
                    f['effect'] = tip
                if not iid.startswith('MeadBase'):  # base meads cannot be drunk
                    foods.append({k: v for k, v in f.items() if v is not None})

    biomes = [{'id': c['id'], 'name': c['name'], 'order': c['order'],
               **({'guide': c['guide']} if c.get('guide', {}).get('notes') else {}), **prov} for c in configs]

    os.makedirs(out, exist_ok=True)
    files = {'meta': {'gameVersion': f'Steam build {build_id}', 'lastReviewed': reviewed},
             'biomes': biomes, 'items': items, 'recipes': recipes, 'stations': stations, 'weapons': weapons,
             'armor': armor, 'foods': foods, 'trophies': trophies, 'creatures': creatures,
             'bosses': bosses, 'pieces': []}
    for name, content in files.items():
        with open(os.path.join(out, f'{name}.json'), 'w', encoding='utf8', newline='\n') as f:
            json.dump(content, f, indent=2, ensure_ascii=False)
            f.write('\n')
    for k in ('items', 'recipes', 'stations', 'weapons', 'armor', 'foods', 'trophies', 'creatures', 'bosses'):
        print(k, len(files[k]))
    for w in sorted(set(warnings)):
        print('WARN', w)
    print('spawn cross-check:', {m: sorted(spawn_biomes.get(m, [])) for m in sorted(monster_ids)})


if __name__ == '__main__':
    if len(sys.argv) not in (4, 5):
        sys.exit(__doc__)
    main(*sys.argv[1:])
