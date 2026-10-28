import { requiredStationLevel } from '../../data/stationLevels';
import type { Recipe } from '../../data/schemas';

export interface PlanTarget {
  item: string;
  qty: number;
  /** Upgrade quality to reach; 1 or missing means the plain item. */
  quality?: number;
}

/** What the planner needs to know about the data; the real lookup and test data both fit. */
export interface PlanContext {
  recipesFor(itemId: string): readonly Recipe[];
}

export interface PlanLine {
  item: string;
  /** Total needed. */
  need: number;
  /** Covered by the inventory. */
  have: number;
  /** Still to gather or craft. */
  missing: number;
}

export interface PlanStep {
  recipe: string;
  output: string;
  /** How many times the recipe is run. */
  times: number;
  stationId: string | null;
  level: number;
}

export interface Plan {
  /** Items with no recipe (or a recipe loop): to be gathered, dropped or bought. */
  raw: PlanLine[];
  /** Items the plan crafts, with how many are made. */
  crafted: { item: string; qty: number }[];
  /** Items taken straight from the inventory. */
  fromInventory: { item: string; qty: number }[];
  steps: PlanStep[];
  /** Highest level needed at each station. */
  stations: { id: string; level: number }[];
  /** Items met again while expanding themselves; treated as raw. */
  cycles: string[];
}

/** Recipes that make an item the way a player gets it; the first one is used. */
const pick = (ctx: PlanContext, item: string): Recipe | undefined => ctx.recipesFor(item)[0];

/**
 * Expand targets into raw materials, crafting steps and station levels. Inventory is used before
 * anything is crafted, at every level (a Bronze bar you hold saves its Copper and Tin). Upgrades
 * add each quality step's cost for every unit. An item with several recipes uses the first one.
 */
export function buildPlan(
  targets: readonly PlanTarget[],
  ctx: PlanContext,
  inventory: Readonly<Record<string, number>> = {},
): Plan {
  const stock = { ...inventory };
  const rawNeed = new Map<string, number>();
  const crafted = new Map<string, number>();
  const taken = new Map<string, number>();
  const steps = new Map<string, PlanStep>();
  const stations = new Map<string, number>();
  const cycles = new Set<string>();
  const add = (map: Map<string, number>, key: string, n: number) =>
    map.set(key, (map.get(key) ?? 0) + n);

  const station = (recipe: Recipe, level: number) => {
    if (!recipe.station) return;
    stations.set(recipe.station.id, Math.max(stations.get(recipe.station.id) ?? 0, level));
  };

  const need = (item: string, qty: number, path: readonly string[]) => {
    if (qty <= 0) return;
    const used = Math.min(stock[item] ?? 0, qty);
    if (used > 0) {
      stock[item] = (stock[item] ?? 0) - used;
      add(taken, item, used);
    }
    const left = qty - used;
    if (left <= 0) return;
    const recipe = pick(ctx, item);
    if (!recipe || path.includes(item)) {
      if (recipe) cycles.add(item);
      add(rawNeed, item, left);
      return;
    }
    const times = Math.ceil(left / recipe.output.qty);
    const prior = steps.get(recipe.id);
    steps.set(recipe.id, {
      recipe: recipe.id,
      output: item,
      times: (prior?.times ?? 0) + times,
      stationId: recipe.station?.id ?? null,
      level: recipe.station?.minLevel ?? 0,
    });
    station(recipe, recipe.station?.minLevel ?? 1);
    add(crafted, item, times * recipe.output.qty);
    for (const input of recipe.inputs) need(input.item, input.qty * times, [...path, item]);
  };

  for (const target of targets) {
    if (target.qty <= 0) continue;
    need(target.item, target.qty, []);
    const recipe = pick(ctx, target.item);
    const quality = target.quality ?? 1;
    if (!recipe || quality <= 1) continue;
    for (const up of recipe.upgrades) {
      if (up.quality > quality) continue;
      station(recipe, requiredStationLevel(recipe.station?.minLevel ?? 1, up.quality));
      for (const input of up.inputs) need(input.item, input.qty * target.qty, [target.item]);
    }
  }

  // A raw line reads need = have + missing: what the inventory covers plus what is left to gather.
  const leaves = new Set([...rawNeed.keys(), ...[...taken.keys()].filter((i) => !pick(ctx, i))]);
  const raw: PlanLine[] = [...leaves]
    .map((item) => {
      const missing = rawNeed.get(item) ?? 0;
      const have = taken.get(item) ?? 0;
      return { item, need: missing + have, have, missing };
    })
    .sort((a, b) => a.item.localeCompare(b.item));

  return {
    raw,
    crafted: [...crafted].map(([item, qty]) => ({ item, qty })),
    fromInventory: [...taken].map(([item, qty]) => ({ item, qty })),
    steps: [...steps.values()],
    stations: [...stations].map(([id, level]) => ({ id, level })),
    cycles: [...cycles],
  };
}
