import type { GameData } from '../../data/schemas';

export interface LevelCounts {
  total: number;
  unverified: number;
  /** Read from the game files, not yet seen working in game. */
  fromFiles: number;
  inGame: number;
}

export interface UnverifiedGroup {
  reason: string;
  entries: { id: string; name: string }[];
}

const empty = (): LevelCounts => ({ total: 0, unverified: 0, fromFiles: 0, inGame: 0 });

function add(c: LevelCounts, level: 'unverified' | 'cross-checked' | 'in-game'): void {
  c.total += 1;
  if (level === 'unverified') c.unverified += 1;
  else if (level === 'in-game') c.inGame += 1;
  else c.fromFiles += 1;
}

/** Every file whose entries carry a verified level. */
const FILES = ['items', 'recipes', 'stations', 'weapons', 'armor', 'foods', 'trophies', 'creatures', 'bosses', 'pieces'] as const;

/**
 * How much of the data is checked, overall and per zone, and why each unverified entry is
 * unverified. Computed from the data, never stored, so it cannot drift from it.
 */
export function trustReport(data: Pick<GameData, (typeof FILES)[number] | 'biomes'>) {
  const overall = empty();
  for (const file of FILES) for (const e of data[file]) add(overall, e.verified);

  // Per zone, over the files whose entries belong to one zone.
  const zoneOf = (id: string) => data.items.find((i) => i.id === id)?.biome ?? null;
  const zones = [...data.biomes]
    .sort((a, b) => a.order - b.order)
    .map((b) => {
      const c = empty();
      for (const e of data.items) if (e.biome === b.id) add(c, e.verified);
      for (const e of data.creatures) if (e.biome === b.id) add(c, e.verified);
      for (const e of data.bosses) if (e.biome === b.id) add(c, e.verified);
      for (const e of [...data.weapons, ...data.armor, ...data.foods, ...data.trophies]) {
        if (zoneOf(e.item) === b.id) add(c, e.verified);
      }
      return { id: b.id, name: b.name, ...c };
    });

  const groups = new Map<string, { id: string; name: string }[]>();
  const push = (id: string, name: string, note: string | undefined) => {
    const reason = note?.trim() || 'No reason recorded';
    groups.set(reason, [...(groups.get(reason) ?? []), { id, name }]);
  };
  for (const i of data.items) if (i.verified === 'unverified') push(i.id, i.name, i.note);
  for (const c of data.creatures) if (c.verified === 'unverified') push(c.id, c.name, c.note);
  for (const b of data.bosses) if (b.verified === 'unverified') push(b.id, b.name, b.note);
  const unverified: UnverifiedGroup[] = [...groups.entries()]
    .map(([reason, entries]) => ({ reason, entries }))
    .sort((a, b) => b.entries.length - a.entries.length);

  return { overall, zones, unverified };
}
