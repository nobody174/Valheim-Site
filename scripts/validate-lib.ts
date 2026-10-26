import { FILE_SCHEMAS, MetaSchema, VERIFIED_LEVELS, type GameData } from '../src/data/schemas';

export type RawData = Record<string, unknown>;

export interface ValidationResult {
  errors: string[];
  /** entry counts per file */
  counts: Record<string, number>;
  /** entry counts per verified level, across all files */
  verified: Record<string, number>;
}

/** Files whose entries own a global `id`. Stat-extension files are keyed by `item` instead. */
const ID_FILES = [
  'biomes',
  'items',
  'recipes',
  'stations',
  'creatures',
  'bosses',
  'pieces',
] as const;

type Entry = Record<string, unknown>;

export function validateData(raw: RawData): ValidationResult {
  const errors: string[] = [];
  const counts: Record<string, number> = {};
  const verified: Record<string, number> = Object.fromEntries(VERIFIED_LEVELS.map((v) => [v, 0]));
  const parsed: Record<string, Entry[]> = {};

  const meta = MetaSchema.safeParse(raw.meta);
  if (!meta.success) {
    for (const i of meta.error.issues) errors.push(`meta.json: ${i.path.join('.')}: ${i.message}`);
  }

  // 1. Schemas
  for (const [file, schema] of Object.entries(FILE_SCHEMAS)) {
    const value = raw[file];
    if (!Array.isArray(value)) {
      errors.push(`${file}.json: expected an array`);
      continue;
    }
    counts[file] = value.length;
    parsed[file] = [];
    value.forEach((entry, idx) => {
      const r = schema.safeParse(entry);
      if (r.success) {
        const e = r.data as Entry;
        parsed[file].push(e);
        verified[e.verified as string] += 1;
      } else {
        const label = (entry as Entry | null)?.id ?? (entry as Entry | null)?.item ?? `#${idx}`;
        for (const i of r.error.issues) {
          errors.push(
            `${file}.json [${String(label)}]: ${i.path.join('.') || '(entry)'}: ${i.message}`,
          );
        }
      }
    });
  }
  if (errors.length > 0) return { errors, counts, verified };

  // 2. Duplicate ids
  const seen = new Map<string, string>();
  for (const file of ID_FILES) {
    for (const e of parsed[file]) {
      const key = e.id as string;
      const prev = seen.get(key);
      if (prev) errors.push(`duplicate id "${key}" in ${file}.json (already in ${prev}.json)`);
      else seen.set(key, file);
    }
  }
  for (const file of ['weapons', 'armor', 'foods', 'trophies']) {
    const keys = new Set<string>();
    for (const e of parsed[file]) {
      const key = e.item as string;
      if (keys.has(key)) errors.push(`duplicate item "${key}" in ${file}.json`);
      keys.add(key);
    }
  }

  // 3. References
  const ids = (file: string) => new Set(parsed[file].map((e) => e.id as string));
  const biomes = ids('biomes');
  const items = ids('items');
  const recipes = ids('recipes');
  const stations = ids('stations');
  const monsters = new Set([...ids('creatures'), ...ids('bosses')]);

  const ref = (where: string, target: string, set: Set<string>, kind: string) => {
    if (!set.has(target)) errors.push(`${where}: dangling ${kind} reference "${target}"`);
  };
  const refIngredients = (where: string, list: { item: string }[]) =>
    list.forEach((g) => ref(where, g.item, items, 'item'));

  const data = parsed as unknown as {
    items: GameData['items'];
    recipes: GameData['recipes'];
    stations: GameData['stations'];
    weapons: GameData['weapons'];
    armor: GameData['armor'];
    foods: GameData['foods'];
    trophies: GameData['trophies'];
    creatures: GameData['creatures'];
    bosses: GameData['bosses'];
    pieces: GameData['pieces'];
  };

  for (const it of data.items) {
    const w = `items.json [${it.id}]`;
    if (it.biome) ref(w, it.biome, biomes, 'biome');
    for (const o of it.obtainedFrom) {
      if (o.type === 'drop') ref(w, o.creature, monsters, 'creature');
      if (o.type === 'recipe') ref(w, o.recipe, recipes, 'recipe');
    }
  }
  for (const r of data.recipes) {
    const w = `recipes.json [${r.id}]`;
    ref(w, r.output.item, items, 'item');
    refIngredients(w, r.inputs);
    r.upgrades.forEach((u) => refIngredients(w, u.inputs));
    if (r.station) ref(w, r.station.id, stations, 'station');
  }
  for (const s of data.stations) {
    const w = `stations.json [${s.id}]`;
    for (const l of s.levels) {
      refIngredients(w, l.requirements);
      l.unlocks.forEach((u) => ref(w, u, items, 'item'));
    }
  }
  for (const file of ['weapons', 'armor', 'foods', 'trophies'] as const) {
    for (const e of data[file]) ref(`${file}.json [${e.item}]`, e.item, items, 'item');
  }
  for (const t of data.trophies) ref(`trophies.json [${t.item}]`, t.creature, monsters, 'creature');
  for (const c of data.creatures) {
    const w = `creatures.json [${c.id}]`;
    if (c.biome) ref(w, c.biome, biomes, 'biome');
    c.drops.forEach((d) => ref(w, d.item, items, 'item'));
  }
  for (const b of data.bosses) {
    const w = `bosses.json [${b.id}]`;
    ref(w, b.biome, biomes, 'biome');
    refIngredients(w, b.summonItems);
    if (b.trophy) ref(w, b.trophy, items, 'trophy item');
    b.drops.forEach((d) => ref(w, d.item, items, 'item'));
  }
  for (const p of data.pieces) {
    const w = `pieces.json [${p.id}]`;
    refIngredients(w, p.requirements);
    if (p.station) ref(w, p.station, stations, 'station');
  }

  return { errors, counts, verified };
}
