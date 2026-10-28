import type { Boss, Item, Recipe } from '../../data/schemas';

/** What the advisor reads; the real data and test data both fit. */
export interface AdvisorData {
  items: readonly Pick<Item, 'id' | 'biome'>[];
  recipesFor(itemId: string): readonly Recipe[];
  bosses: readonly Pick<Boss, 'id' | 'biome' | 'trophy' | 'summonItems'>[];
  /** Zone order, first zone 1. */
  zoneOrder: ReadonlyMap<string, number>;
}

/** What the player has marked: items found or made, and what they hold. */
export interface AdvisorProgress {
  collected(itemId: string): boolean;
  crafted(itemId: string): boolean;
  inventory: Readonly<Record<string, number>>;
}

export interface CraftAdvice {
  item: string;
  recipe: string;
  station: { id: string; level: number } | null;
  /** The ingredients, all of which the player has. */
  have: string[];
}

export interface CollectAdvice {
  item: string;
  /** What collecting it makes craftable, with everything else already in hand. */
  unlocks: string[];
}

export interface BossAdvice {
  boss: string;
  /** Summon items held, and those still missing. */
  have: string[];
  missing: string[];
}

export interface Advice {
  /** Zones up to this order are open; later zones wait for the boss that guards the way. */
  openZone: number;
  craft: CraftAdvice[];
  collect: CollectAdvice[];
  boss?: BossAdvice;
}

/**
 * Suggest what to do next. A zone is open once the boss of every earlier zone is down (a boss is
 * down when its trophy is ticked). Prerequisites are strict:
 * - "Craft X" only when every ingredient is collected, crafted or in the inventory.
 * - "Collect Y" only for an item with no recipe, and only when it is the single missing ingredient
 *   of at least one recipe, so the reason is always something it makes possible.
 * Nothing in a closed zone is suggested.
 */
export function advise(data: AdvisorData, progress: AdvisorProgress): Advice {
  const owned = (id: string) =>
    progress.collected(id) || progress.crafted(id) || (progress.inventory[id] ?? 0) > 0;
  const biomeOf = new Map(data.items.map((i) => [i.id, i.biome]));
  const zone = (id: string) => data.zoneOrder.get(biomeOf.get(id) ?? '') ?? 0;

  const bossDown = (b: AdvisorData['bosses'][number]) =>
    b.trophy ? progress.crafted(b.trophy) || progress.collected(b.trophy) : false;
  const bosses = [...data.bosses].sort(
    (a, b) => (data.zoneOrder.get(a.biome) ?? 0) - (data.zoneOrder.get(b.biome) ?? 0),
  );
  const nextBoss = bosses.find((b) => !bossDown(b));
  const openZone = nextBoss ? (data.zoneOrder.get(nextBoss.biome) ?? Infinity) : Infinity;

  const craft: CraftAdvice[] = [];
  const unlocks = new Map<string, Set<string>>();
  for (const item of data.items) {
    if (zone(item.id) > openZone) continue;
    if (progress.crafted(item.id) || (progress.inventory[item.id] ?? 0) > 0) continue;
    const recipe = data.recipesFor(item.id)[0];
    if (!recipe) continue;
    const inputs = [...new Set(recipe.inputs.map((i) => i.item))];
    const missing = inputs.filter((i) => !owned(i));
    if (missing.length === 0) {
      craft.push({
        item: item.id,
        recipe: recipe.id,
        station: recipe.station ? { id: recipe.station.id, level: recipe.station.minLevel } : null,
        have: inputs,
      });
      continue;
    }
    const only = missing[0]!;
    if (missing.length === 1 && data.recipesFor(only).length === 0 && zone(only) <= openZone) {
      const set = unlocks.get(only) ?? new Set<string>();
      set.add(item.id);
      unlocks.set(only, set);
    }
  }

  const collect: CollectAdvice[] = [...unlocks]
    .map(([item, set]) => ({ item, unlocks: [...set] }))
    .sort(
      (a, b) =>
        b.unlocks.length - a.unlocks.length || zone(a.item) - zone(b.item) || a.item.localeCompare(b.item),
    );

  craft.sort((a, b) => zone(a.item) - zone(b.item) || a.item.localeCompare(b.item));

  const boss = nextBoss && {
    boss: nextBoss.id,
    have: nextBoss.summonItems.filter((s) => owned(s.item)).map((s) => s.item),
    missing: nextBoss.summonItems.filter((s) => !owned(s.item)).map((s) => s.item),
  };

  return { openZone, craft, collect, boss };
}
