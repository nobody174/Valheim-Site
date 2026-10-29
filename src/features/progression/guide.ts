import type { Armor, GameData, Item } from '../../data/schemas';

/** Everything the progression page shows for one biome, derived from the data files. */
export interface BiomeGuide {
  creatures: { id: string; name: string; health: number | null }[];
  bosses: {
    id: string;
    name: string;
    health: number | null;
    summon: { item: string; qty: number }[];
    /** True when the altar cost was read from the game files (not a guide). */
    summonFromFiles: boolean;
    drops: string[];
  }[];
  mustKeep: string[];
  materials: string[];
  armor: { slot: Armor['slot']; item: string; armor: number }[];
  weapons: { item: string; damage: number }[];
  shields: { item: string; blockPower: number }[];
  food: { item: string; health: number; stamina: number }[];
}

const COMBAT = ['blunt', 'slash', 'pierce', 'fire', 'frost', 'lightning', 'poison', 'spirit'];
const SLOT_ORDER: Armor['slot'][] = ['helmet', 'chest', 'legs', 'cape'];

/** Sum of combat damage types at quality 1. A rough measure; real rankings are Phase 3. */
export function combatDamage(damage: Record<string, number>): number {
  return COMBAT.reduce((sum, k) => sum + (damage[k] ?? 0), 0);
}

export function buildGuide(data: GameData, biomeId: string): BiomeGuide {
  const itemsHere = new Map<string, Item>(
    data.items.filter((i) => i.biome === biomeId).map((i) => [i.id, i]),
  );
  const here = (id: string) => itemsHere.has(id);

  const bestArmor = new Map<Armor['slot'], { item: string; armor: number }>();
  for (const a of data.armor.filter((x) => here(x.item) && x.slot !== 'shield')) {
    const cur = bestArmor.get(a.slot);
    if (!cur || a.armor > cur.armor) bestArmor.set(a.slot, { item: a.item, armor: a.armor });
  }

  return {
    creatures: data.creatures
      .filter((c) => c.biome === biomeId)
      .map((c) => ({ id: c.id, name: c.name, health: c.health ?? null }))
      .sort((a, b) => (b.health ?? 0) - (a.health ?? 0)),
    bosses: data.bosses
      .filter((b) => b.biome === biomeId)
      .map((b) => ({
        id: b.id,
        name: b.name,
        health: b.health ?? null,
        summon: b.summonItems,
        summonFromFiles: b.summonFromFiles === true,
        drops: b.drops.map((d) => d.item),
      })),
    mustKeep: [...itemsHere.values()].filter((i) => i.hoard === 'must_keep').map((i) => i.id),
    materials: [...itemsHere.values()]
      .filter((i) => i.category === 'material' && i.hoard !== 'must_keep')
      .map((i) => i.id),
    armor: SLOT_ORDER.flatMap((slot) => {
      const best = bestArmor.get(slot);
      return best ? [{ slot, ...best }] : [];
    }),
    weapons: data.weapons
      .filter((w) => here(w.item) && w.skill !== 'Blocking' && !w.item.startsWith('Arrow'))
      .map((w) => ({ item: w.item, damage: combatDamage(w.damage) }))
      .filter((w) => w.damage > 0)
      .sort((a, b) => b.damage - a.damage)
      .slice(0, 3),
    shields: data.weapons
      .filter((w) => here(w.item) && w.skill === 'Blocking' && w.blockPower !== undefined)
      .map((w) => ({ item: w.item, blockPower: w.blockPower ?? 0 }))
      .sort((a, b) => b.blockPower - a.blockPower)
      .slice(0, 2),
    food: data.foods
      .filter((f) => here(f.item) && f.kind === 'food')
      .map((f) => ({ item: f.item, health: f.health ?? 0, stamina: f.stamina ?? 0 }))
      .sort((a, b) => b.health + b.stamina - (a.health + a.stamina))
      .slice(0, 3),
  };
}
