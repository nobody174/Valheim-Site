import type { Weapon } from './schemas';

/** chop and pickaxe only hurt trees and rock; they never count against creatures. */
const TOOL_ONLY_DAMAGE = new Set(['chop', 'pickaxe']);

/** Arrows and bolts are ammunition: they add damage to a bow, they are not weapons themselves. */
const AMMO_ID = /^(Arrow|Bolt|Missile)/;

/** Filter value and group label for arrows and bolts. */
export const AMMO_GROUP = 'Ammunition';

const isAmmo = (w: Weapon): boolean => AMMO_ID.test(w.item);

/** Highest upgrade quality the item has; items without a maxQuality cannot be upgraded. */
export const maxQuality = (w: Weapon): number => w.maxQuality ?? 1;

/**
 * Damage per type at an upgrade quality: base + damagePerLevel * (quality - 1).
 * Quality is clamped to what the item supports.
 */
export function damageAt(w: Weapon, quality = 1): Record<string, number> {
  const q = Math.min(Math.max(1, Math.floor(quality)), maxQuality(w));
  const types = new Set([...Object.keys(w.damage), ...Object.keys(w.damagePerLevel ?? {})]);
  const out: Record<string, number> = {};
  for (const type of types) {
    out[type] = (w.damage[type] ?? 0) + (w.damagePerLevel?.[type] ?? 0) * (q - 1);
  }
  return out;
}

/** Damage that counts against creatures (tool-only types removed). */
export function combatDamage(w: Weapon, quality = 1): Record<string, number> {
  return Object.fromEntries(
    Object.entries(damageAt(w, quality)).filter(([type, v]) => !TOOL_ONLY_DAMAGE.has(type) && v > 0),
  );
}

/** Sum of one hit's combat damage over all types. Not DPS: attack speed is not in the data yet. */
export function totalCombatDamage(w: Weapon, quality = 1): number {
  return Object.values(combatDamage(w, quality)).reduce((a, b) => a + b, 0);
}

/** A weapon is rankable when it deals combat damage at all (shields do not) and is a real weapon skill (bombs are consumables). */
export const isRankable = (w: Weapon): boolean => totalCombatDamage(w) > 0 && w.skill !== 'None';

/** The weapon type shown in filters: its skill, with ammunition kept apart from the bows. */
export const weaponGroup = (w: Weapon): string => (isAmmo(w) ? AMMO_GROUP : w.skill);

/** How a creature's resistance label scales damage of that type (the game's damage modifiers). */
const RESISTANCE_FACTOR: Record<string, number> = {
  'very weak': 2,
  weak: 1.5,
  resistant: 0.5,
  'very resistant': 0.25,
  immune: 0,
  ignore: 0,
};

/** Damage per type after a creature's resistances; unknown or missing labels count as normal. */
export function damageVs(
  damage: Record<string, number>,
  resistances: Record<string, string> | undefined,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(damage).map(([type, value]) => [
      type,
      value * (RESISTANCE_FACTOR[resistances?.[type] ?? ''] ?? 1),
    ]),
  );
}

/**
 * The share of a weapon's listed damage one hit does at a skill level (0 to 100). Each hit rolls
 * uniformly between min and max: lerp(0.4, 1, skill / 100) give or take 0.15, clamped to 0..1
 * (Skills.GetRandomSkillRange). The in-game "(15-27)" next to the damage is damage * min to damage * max.
 */
export function skillRange(level: number): { min: number; max: number; mean: number } {
  const factor = Math.min(1, Math.max(0, level / 100));
  const centre = 0.4 + 0.6 * factor;
  const min = Math.min(1, Math.max(0, centre - 0.15));
  const max = Math.min(1, Math.max(0, centre + 0.15));
  return { min, max, mean: (min + max) / 2 };
}
