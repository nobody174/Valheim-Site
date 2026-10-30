import type {
  Armor,
  Boss,
  Creature,
  Food,
  GameData,
  Item,
  Piece,
  Recipe,
  Station,
  Trophy,
  Weapon,
} from './schemas';
import { buildGraph } from './graph';
import { gameData } from './load';

export type EntityKind = 'item' | 'creature' | 'boss' | 'station' | 'piece';

export interface EntityRef {
  kind: EntityKind;
  id: string;
  name: string;
}

const byKey = <T>(list: T[], key: (t: T) => string) => new Map(list.map((t) => [key(t), t]));

/** Id lookups over the loaded data. Ids are unique across files (enforced by validate). */
export function createLookup(data: GameData) {
  const items = byKey(data.items, (i) => i.id);
  const creatures = byKey(data.creatures, (c) => c.id);
  const bosses = byKey(data.bosses, (b) => b.id);
  const stations = byKey(data.stations, (s) => s.id);
  const pieces = byKey(data.pieces, (p) => p.id);
  const recipes = byKey(data.recipes, (r) => r.id);
  const biomes = byKey(data.biomes, (b) => b.id);
  const weapons = byKey(data.weapons, (w) => w.item);
  const armor = byKey(data.armor, (a) => a.item);
  const foods = byKey(data.foods, (f) => f.item);
  const trophies = byKey(data.trophies, (t) => t.item);

  const entity = (id: string): EntityRef | undefined => {
    const i = items.get(id);
    if (i) return { kind: 'item', id, name: i.name };
    const c = creatures.get(id);
    if (c) return { kind: 'creature', id, name: c.name };
    const b = bosses.get(id);
    if (b) return { kind: 'boss', id, name: b.name };
    const s = stations.get(id);
    if (s) return { kind: 'station', id, name: s.name };
    const p = pieces.get(id);
    if (p) return { kind: 'piece', id, name: p.name };
    return undefined;
  };

  return {
    entity,
    item: (id: string): Item | undefined => items.get(id),
    creature: (id: string): Creature | undefined => creatures.get(id),
    boss: (id: string): Boss | undefined => bosses.get(id),
    station: (id: string): Station | undefined => stations.get(id),
    piece: (id: string): Piece | undefined => pieces.get(id),
    recipe: (id: string): Recipe | undefined => recipes.get(id),
    weapon: (id: string): Weapon | undefined => weapons.get(id),
    armor: (id: string): Armor | undefined => armor.get(id),
    food: (id: string): Food | undefined => foods.get(id),
    trophy: (id: string): Trophy | undefined => trophies.get(id),
    biomeName: (id: string | null): string | null => (id ? (biomes.get(id)?.name ?? id) : null),
    allItems: () => data.items,
    allBiomes: () => data.biomes,
    allRecipes: () => data.recipes,
    allWeapons: () => data.weapons,
    allStations: () => data.stations,
    allArmor: () => data.armor,
    allCreatures: () => data.creatures,
    allBosses: () => data.bosses,
    allFoods: () => data.foods,
    allPieces: () => data.pieces,
    allTrophies: () => data.trophies,
    /** The trophy item a creature drops, if the data links one. */
    trophyOf: (creatureId: string): string | undefined =>
      data.trophies.find((t) => t.creature === creatureId)?.item,
    /** Creatures and bosses that drop this item, by id. */
    droppedBy: (itemId: string) =>
      [...data.creatures, ...data.bosses].filter((m) => m.drops.some((d) => d.item === itemId)),
    /** Recipes crafted at a station. */
    recipesAt: (stationId: string) => data.recipes.filter((r) => r.station?.id === stationId),
    /** Bosses that need this item to be summoned. */
    summonsFor: (itemId: string) =>
      data.bosses.filter((b) => b.summonItems.some((s) => s.item === itemId)),
  };
}

export type Lookup = ReturnType<typeof createLookup>;

export const lookup = createLookup(gameData);
export const graph = buildGraph(gameData);
