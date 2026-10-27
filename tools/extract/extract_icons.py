"""Export the in-game icons for every item and station in /data into src/assets/icons/.

Personal-use tool, run once per game update after extract_raw.py. It follows each item's icon
reference (ItemDrop.m_icons, Piece.m_icon) from data-raw/ into the game's asset bundles with
UnityPy, renders the sprite and writes a small WebP named after the entry id, for example
SwordBronze.webp or piece_workbench.webp. Ids without an icon are listed and simply fall back to
the generated category glyph in the app.

Game art (c) Iron Gate. The owner decided to commit these icons; see docs/ARCHITECTURE.md "Assets".

Usage (Python 3.10+):
    pip install UnityPy pillow
    python tools/extract/extract_icons.py "D:/SteamLibrary/steamapps/common/Valheim" data-raw data src/assets/icons
"""

import json
import os
import sys
import time

import UnityPy

SIZE = 64  # icons are shown at 20-48 px; 64 keeps them sharp on high-density screens


def load_json(*parts):
    with open(os.path.join(*parts), encoding='utf8') as f:
        return json.load(f)


def entry_ids(data_dir):
    ids = []
    for name in ('items', 'stations', 'pieces'):
        path = os.path.join(data_dir, f'{name}.json')
        if os.path.exists(path):
            ids += [e['id'] for e in load_json(path)]
    return list(dict.fromkeys(ids))


def icon_pointers(raw_dir):
    """id (prefab name) -> (bundle file, source object pathId, icon PPtr dict)."""
    refs = load_json(raw_dir, 'refs.json')
    names, comps = refs['gameObjects'], refs['components']
    found = {}

    def add(rows, pick):
        for row in rows:
            go = comps.get(str(row['pathId']))
            name = names.get(str(go)) if go else None
            ptr = pick(row['data'])
            if name and ptr and ptr.get('m_PathID') and name not in found:
                found[name] = (row['bundle'], row['pathId'], ptr)

    add(load_json(raw_dir, 'item.json'), lambda d: (d['m_itemData']['m_shared'].get('m_icons') or [None])[0])
    add(load_json(raw_dir, 'piece.json'), lambda d: d.get('m_icon'))
    add(load_json(raw_dir, 'station.json'), lambda d: d.get('m_icon'))
    return found


def cab_to_bundle(bundles_dir):
    """Internal asset name (CAB-...) -> bundle file, so cross-bundle references can be followed."""
    mapping = {}
    for name in sorted(os.listdir(bundles_dir)):
        env = UnityPy.load(os.path.join(bundles_dir, name))
        for asset in env.assets:
            mapping[os.path.basename(asset.name).lower()] = name
    return mapping


class Bundles:
    def __init__(self, bundles_dir):
        self.dir = bundles_dir
        self.cache = {}

    def env(self, name):
        if name not in self.cache:
            if len(self.cache) > 6:
                self.cache.pop(next(iter(self.cache)))
            self.cache[name] = UnityPy.load(os.path.join(self.dir, name))
        return self.cache[name]


def target_of(bundles, cabs, source_bundle, source_path_id, ptr):
    """Resolve a PPtr found on an object to (bundle file, asset index, pathId)."""
    env = bundles.env(source_bundle)
    asset = next((a for a in env.assets if source_path_id in a.objects), env.assets[0])
    file_id = ptr['m_FileID']
    if file_id == 0:
        return source_bundle, ptr['m_PathID']
    ext = asset.externals[file_id - 1]
    cab = os.path.basename(getattr(ext, 'path', str(ext))).lower()
    return cabs.get(cab), ptr['m_PathID']


def render(bundles, bundle, path_id):
    env = bundles.env(bundle)
    for asset in env.assets:
        obj = asset.objects.get(path_id)
        if obj is not None and obj.type.name == 'Sprite':
            image = obj.read().image
            if image.width != SIZE or image.height != SIZE:
                image = image.resize((SIZE, SIZE))
            return image
    return None


def main(game_dir, raw_dir, data_dir, out_dir):
    bundles_dir = os.path.join(game_dir, 'valheim_Data', 'StreamingAssets', 'SoftRef', 'Bundles')
    os.makedirs(out_dir, exist_ok=True)
    start = time.time()
    ids = entry_ids(data_dir)
    pointers = icon_pointers(raw_dir)
    print(f'{len(ids)} ids in data, {len(pointers)} icon references in the raw dump', flush=True)
    cabs = cab_to_bundle(bundles_dir)
    print(f'mapped {len(cabs)} asset files in {time.time() - start:.0f}s', flush=True)

    bundles = Bundles(bundles_dir)
    # Group by target bundle so each atlas bundle is loaded once.
    work = {}
    missing = []
    for id_ in ids:
        pointer = pointers.get(id_)
        if not pointer:
            missing.append(id_)
            continue
        bundle, source_path_id, ptr = pointer
        target, path_id = target_of(bundles, cabs, bundle, source_path_id, ptr)
        if not target:
            missing.append(id_)
            continue
        work.setdefault(target, []).append((id_, path_id))

    written = 0
    for target, jobs in work.items():
        for id_, path_id in jobs:
            image = render(bundles, target, path_id)
            if image is None:
                missing.append(id_)
                continue
            image.convert('RGBA').save(os.path.join(out_dir, f'{id_}.webp'), 'WEBP', lossless=True, quality=100, method=6)
            written += 1
    print(f'wrote {written} icons to {out_dir} in {time.time() - start:.0f}s')
    if missing:
        print(f'{len(missing)} without an icon (glyph fallback): ' + ', '.join(sorted(missing)))


if __name__ == '__main__':
    if len(sys.argv) != 5:
        sys.exit(__doc__)
    main(*sys.argv[1:])
