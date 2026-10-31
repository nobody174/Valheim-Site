import { z } from 'zod';
import type { GameData, SaveKeys } from '../../data/schemas';
import { stableHash, type ParsedCharacter } from './fch';

/** What the site keeps of a character file: names and numbers only, stored in the profile. */
export const CharacterSnapshotSchema = z
  .object({
    name: z.string().max(80),
    importedAt: z.string(),
    stats: z.object({
      deaths: z.number(),
      kills: z.number(),
      builds: z.number(),
      craftsAndUpgrades: z.number(),
      hoursPlayed: z.number(),
    }),
    maxHealth: z.number(),
    maxStamina: z.number(),
    gear: z.array(
      z.object({
        item: z.string(),
        quality: z.number().int().min(1),
        stack: z.number().int().min(1),
        equipped: z.boolean(),
      }),
    ),
    /** Skill name -> level. */
    skills: z.record(z.string(), z.number()),
    /** Station id -> level. */
    stations: z.record(z.string(), z.number().int()),
    biomes: z.array(z.string()),
    /** Boss ids the character has a trophy of. */
    bosses: z.array(z.string()),
    /** Creature id -> times killed. */
    kills: z.record(z.string(), z.number().int()),
    foods: z.array(z.object({ item: z.string(), minutesLeft: z.number().int() })),
  })
  .loose();

export type CharacterSnapshot = z.infer<typeof CharacterSnapshotSchema>;

/** Indices of the counters we show (the game's PlayerStatType enum). */
const STAT = { deaths: 0, craftsOrUpgrades: 1, builds: 2, enemyKills: 6, timeInBase: 21, timeOutOfBase: 22 } as const;

export interface CharacterImport {
  snapshot: CharacterSnapshot;
  /** Items the character has found: known materials, trophies and everything in the inventory. */
  collected: string[];
  /** Items the character has made, or carries having made them. */
  crafted: string[];
  /** Names in the file the site could not match to its data (a newer item, or a mod). */
  unknown: string[];
}

/**
 * Turn a parsed character into what the site stores and ticks. Pure: the data and the clock are
 * passed in. Unknown names are counted, never guessed at.
 */
export function importCharacter(
  parsed: ParsedCharacter,
  data: Pick<GameData, 'items' | 'bosses'>,
  keys: SaveKeys,
  now: Date,
): CharacterImport {
  const itemIds = new Set(data.items.map((i) => i.id));
  const byHash = new Map(data.items.map((i) => [stableHash(i.id), i.id]));
  const unknown = new Set<string>();

  const collected = new Set<string>();
  const crafted = new Set<string>();

  for (const key of parsed.knownMaterials) {
    const id = keys.items[key];
    if (id && itemIds.has(id)) collected.add(id);
    else unknown.add(key);
  }
  for (const trophy of parsed.trophies) {
    if (itemIds.has(trophy)) collected.add(trophy);
    else unknown.add(trophy);
  }
  for (const [key, count] of Object.entries(parsed.crafted)) {
    const id = keys.items[key];
    if (count > 0 && id && itemIds.has(id)) {
      crafted.add(id);
      collected.add(id);
    }
  }

  const gear: CharacterSnapshot['gear'] = [];
  for (const it of parsed.items) {
    const id = byHash.get(it.hash);
    if (!id) {
      unknown.add(`item #${it.hash}`);
      continue;
    }
    collected.add(id);
    if (it.crafterName) crafted.add(id);
    gear.push({ item: id, quality: it.quality, stack: it.stack, equipped: it.equipped });
  }

  const skills: Record<string, number> = {};
  for (const s of parsed.skills) {
    const name = keys.skills[String(s.type)];
    if (name) skills[name] = Math.floor(s.level);
  }

  const stations: Record<string, number> = {};
  for (const [key, level] of Object.entries(parsed.knownStations)) {
    const id = keys.stations[key];
    if (id) stations[id] = level;
  }

  const kills: Record<string, number> = {};
  for (const [key, count] of Object.entries(parsed.kills)) {
    const id = keys.creatures[key];
    if (id && count > 0) kills[id] = Math.round(count);
  }

  const bosses = data.bosses.filter((b) => b.trophy && parsed.trophies.includes(b.trophy)).map((b) => b.id);

  const foods: CharacterSnapshot['foods'] = [];
  for (const f of parsed.foods) {
    const id = itemIds.has(f.name) ? f.name : undefined;
    if (id) foods.push({ item: id, minutesLeft: Math.max(0, Math.round(f.secondsLeft / 60)) });
  }

  const stat = (i: number) => Math.round(parsed.stats[i] ?? 0);
  const snapshot: CharacterSnapshot = {
    name: parsed.name,
    importedAt: now.toISOString(),
    stats: {
      deaths: stat(STAT.deaths),
      kills: stat(STAT.enemyKills),
      builds: stat(STAT.builds),
      craftsAndUpgrades: stat(STAT.craftsOrUpgrades),
      hoursPlayed: Math.round(((parsed.stats[STAT.timeInBase] ?? 0) + (parsed.stats[STAT.timeOutOfBase] ?? 0)) / 360) / 10,
    },
    maxHealth: Math.round(parsed.maxHealth),
    maxStamina: Math.round(parsed.maxStamina),
    gear,
    skills,
    stations,
    biomes: parsed.knownBiomes,
    bosses,
    kills,
    foods,
  };

  return { snapshot, collected: [...collected].sort(), crafted: [...crafted].sort(), unknown: [...unknown].sort() };
}
