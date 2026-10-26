import type { GameData, Item, Recipe } from './schemas';

type Obtained = Item['obtainedFrom'][number];

export interface Graph {
  recipesFor(itemId: string): Recipe[];
  usedIn(itemId: string): Recipe[];
  obtainedFrom(itemId: string): Obtained[];
}

const EMPTY: never[] = [];

/** Items are nodes, recipes are edges. Built once from loaded data; every view reads from here. */
export function buildGraph(data: Pick<GameData, 'items' | 'recipes'>): Graph {
  const produces = new Map<string, Recipe[]>();
  const consumes = new Map<string, Recipe[]>();
  const sources = new Map<string, Obtained[]>();

  const push = <T>(map: Map<string, T[]>, key: string, value: T) => {
    const list = map.get(key);
    if (list) list.push(value);
    else map.set(key, [value]);
  };

  for (const recipe of data.recipes) {
    push(produces, recipe.output.item, recipe);
    const inputs = new Set([
      ...recipe.inputs.map((i) => i.item),
      ...recipe.upgrades.flatMap((u) => u.inputs.map((i) => i.item)),
    ]);
    for (const id of inputs) push(consumes, id, recipe);
  }
  for (const item of data.items) sources.set(item.id, item.obtainedFrom);

  return {
    recipesFor: (id) => produces.get(id) ?? EMPTY,
    usedIn: (id) => consumes.get(id) ?? EMPTY,
    obtainedFrom: (id) => sources.get(id) ?? EMPTY,
  };
}
