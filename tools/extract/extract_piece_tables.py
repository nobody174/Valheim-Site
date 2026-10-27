"""Dump the build menus (PieceTable components: Hammer, Hoe, Cultivator, ...) into data-raw/piecetable.json.

Which pieces a player can actually build is defined by these tables, not by the Piece components
(those also cover world decorations, copies placed in locations and trader props). Run after
extract_raw.py; it only writes data-raw/piecetable.json.

Usage (Python 3.10+):
    python tools/extract/extract_piece_tables.py "D:/SteamLibrary/steamapps/common/Valheim" data-raw
"""

import json
import os
import sys

import UnityPy


def main(game_dir, out_dir):
    bundles_dir = os.path.join(game_dir, 'valheim_Data', 'StreamingAssets', 'SoftRef', 'Bundles')
    rows = []
    for name in sorted(os.listdir(bundles_dir)):
        env = UnityPy.load(os.path.join(bundles_dir, name))
        for obj in env.objects:
            if obj.type.name != 'MonoBehaviour':
                continue
            data = obj.read_typetree()
            if 'm_pieces' in data and 'm_categories' in data:
                rows.append({'bundle': name, 'pathId': obj.path_id, 'data': data})
    with open(os.path.join(out_dir, 'piecetable.json'), 'w', encoding='utf8') as f:
        json.dump(rows, f)
    print('piece tables:', len(rows))


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
