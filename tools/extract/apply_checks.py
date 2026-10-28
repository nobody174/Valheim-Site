"""Add the lines the owner confirmed in game to confirmed_in_game.json.

Usage: python apply_checks.py results.txt
where results.txt is what the Check in game page's "Copy my results" button copied:
one line each, "OK | key | label | site says: ..." or "DIFFERENT | key | ...".
OK lines are added (with today's date). DIFFERENT lines are only printed: they need a look
at the data, not a tick. After this, run the usual build_data step so the entries are marked.
"""
import datetime
import json
import os
import sys


def main(path):
    sidecar = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'confirmed_in_game.json')
    with open(sidecar, encoding='utf8') as f:
        confirmed = json.load(f)
    today = datetime.date.today().isoformat()
    added, different = [], []
    with open(path, encoding='utf8') as f:
        for line in f:
            parts = [p.strip() for p in line.split('|')]
            if len(parts) < 3:
                continue
            verdict, key, label = parts[0], parts[1], parts[2]
            if verdict == 'OK' and key not in confirmed:
                confirmed[key] = today
                added.append(f'{key} ({label})')
            elif verdict == 'DIFFERENT':
                different.append(f'{key} ({label}): {" | ".join(parts[3:])}')
    with open(sidecar, 'w', encoding='utf8', newline='\n') as f:
        json.dump(confirmed, f, indent=2, ensure_ascii=False)
        f.write('\n')
    print(f'added {len(added)}:', *added, sep='\n  ')
    print(f'different {len(different)}:', *different, sep='\n  ')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
