import type { Biome, Item, Recipe } from '../../data/schemas';

export interface ZoneUnlocks {
  zone: Biome;
  /** Recipes whose inputs can all be had by this zone but not by the zone before it. */
  recipes: Recipe[];
}

/**
 * What opens up zone by zone, from the data alone. An item counts as available once the zone it is
 * found in is reached, or once it can be crafted from available items. Items with no zone that nothing
 * crafts (a trader's goods, for example) are never counted, so a recipe that needs one waits unlisted.
 */
export function unlocksByZone(
  zones: readonly Biome[],
  items: readonly Item[],
  recipes: readonly Recipe[],
): ZoneUnlocks[] {
  const ordered = [...zones].sort((a, b) => a.order - b.order);
  const zoneOrder = new Map(ordered.map((z) => [z.id, z.order]));
  const doable = new Set<string>();
  const out: ZoneUnlocks[] = [];
  for (const zone of ordered) {
    const have = new Set(
      items
        .filter((i) => i.biome !== null && (zoneOrder.get(i.biome) ?? Infinity) <= zone.order)
        .map((i) => i.id),
    );
    let grew = true;
    while (grew) {
      grew = false;
      for (const r of recipes) {
        if (r.inputs.length === 0 || have.has(r.output.item)) continue;
        if (r.inputs.every((i) => have.has(i.item))) {
          have.add(r.output.item);
          grew = true;
        }
      }
    }
    const fresh = recipes.filter(
      (r) => r.inputs.length > 0 && !doable.has(r.id) && r.inputs.every((i) => have.has(i.item)),
    );
    for (const r of fresh) doable.add(r.id);
    out.push({ zone, recipes: fresh });
  }
  return out;
}
