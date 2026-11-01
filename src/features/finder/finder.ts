import type { Recipe } from '../../data/schemas';

export interface Craftable {
  recipe: Recipe;
  /** How many times the recipe can be made from what is held. */
  times: number;
  /** Inputs that are short, with how many are missing. Empty when the recipe can be made now. */
  missing: { item: string; short: number }[];
}

/**
 * Sort recipes by what the held items allow. `ready` can be made now; `close` is short of at most
 * `maxMissing` kinds of input and uses at least one held item, so it is not a random recipe.
 */
export function whatCanIMake(
  recipes: readonly Recipe[],
  held: Readonly<Record<string, number>>,
  maxMissing = 2,
): { ready: Craftable[]; close: Craftable[] } {
  const ready: Craftable[] = [];
  const close: Craftable[] = [];
  for (const recipe of recipes) {
    if (recipe.inputs.length === 0) continue;
    const missing = recipe.inputs
      .filter((i) => (held[i.item] ?? 0) < i.qty)
      .map((i) => ({ item: i.item, short: i.qty - (held[i.item] ?? 0) }));
    const times = Math.min(...recipe.inputs.map((i) => Math.floor((held[i.item] ?? 0) / i.qty)));
    if (missing.length === 0) ready.push({ recipe, times, missing });
    else if (missing.length <= maxMissing && recipe.inputs.some((i) => (held[i.item] ?? 0) > 0))
      close.push({ recipe, times: 0, missing });
  }
  const byId = (a: Craftable, b: Craftable) => a.recipe.id.localeCompare(b.recipe.id);
  ready.sort(byId);
  close.sort((a, b) => a.missing.length - b.missing.length || byId(a, b));
  return { ready, close };
}
