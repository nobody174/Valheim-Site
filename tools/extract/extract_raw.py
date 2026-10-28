"""Dump raw Valheim gameplay data from a local game install into data-raw/ (git-ignored).

Personal-use tool. Reads the game's asset bundles read-only with UnityPy and writes JSON
snapshots of the component data we care about (items, recipes, crafting stations, characters,
drops). Nothing here is committed: only the cleaned JSON in /data is.

Usage (Python 3.10+):
    pip install UnityPy
    python tools/extract/extract_raw.py "D:/SteamLibrary/steamapps/common/Valheim" data-raw
"""

import json
import os
import sys
import time

import UnityPy

# A MonoBehaviour is classified by fields only that script has. First match wins.
KINDS = [
    ('recipe', lambda d: 'm_resources' in d and 'm_item' in d),  # Recipe (ScriptableObject)
    ('item', lambda d: 'm_itemData' in d),  # ItemDrop
    ('stationext', lambda d: 'm_maxStationDistance' in d),  # StationExtension
    ('station', lambda d: 'm_rangeBuild' in d),  # CraftingStation
    ('piece', lambda d: 'm_resources' in d and 'm_category' in d),  # Piece
    ('character', lambda d: 'm_faction' in d),  # Character / Humanoid
    ('drops', lambda d: 'm_drops' in d and 'm_spawnOffset' in d),  # CharacterDrop
    ('statuseffect', lambda d: 'm_ttl' in d and 'm_name' in d),  # StatusEffect
    ('conversion', lambda d: 'm_conversion' in d),  # Fermenter / Smelter / CookingStation
    ('spawnsystem', lambda d: 'm_spawners' in d),  # SpawnSystemList
    ('vegetation', lambda d: 'm_vegetation' in d),  # ZoneSystem vegetation list
    ('skillsdef', lambda d: 'm_DeathLowerFactor' in d),  # Skills (xp per use, loss on death); the longest copy is the live one
]


def classify(data):
    for kind, test in KINDS:
        if test(data):
            return kind
    return None


def main(game_dir, out_dir):
    bundles_dir = os.path.join(game_dir, 'valheim_Data', 'StreamingAssets', 'SoftRef', 'Bundles')
    os.makedirs(out_dir, exist_ok=True)
    out = {k: [] for k, _ in KINDS}
    game_objects = {}  # pathId -> name
    components = {}  # component pathId -> game object pathId
    names = sorted(os.listdir(bundles_dir))
    start = time.time()
    for n, name in enumerate(names, 1):
        env = UnityPy.load(os.path.join(bundles_dir, name))
        for obj in env.objects:
            t = obj.type.name
            if t == 'GameObject':
                game_objects[obj.path_id] = obj.read_typetree().get('m_Name', '')
            elif t == 'MonoBehaviour':
                data = obj.read_typetree()
                go = data.get('m_GameObject', {}).get('m_PathID', 0)
                if go:
                    components[obj.path_id] = go
                kind = classify(data)
                if kind:
                    out[kind].append({'bundle': name, 'pathId': obj.path_id, 'data': data})
        if n % 25 == 0:
            print(f'{n}/{len(names)} bundles, {time.time() - start:.0f}s', flush=True)
    for kind, rows in out.items():
        with open(os.path.join(out_dir, f'{kind}.json'), 'w', encoding='utf8') as f:
            json.dump(rows, f)
        print(kind, len(rows))
    with open(os.path.join(out_dir, 'refs.json'), 'w', encoding='utf8') as f:
        json.dump({'gameObjects': game_objects, 'components': components}, f)


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
