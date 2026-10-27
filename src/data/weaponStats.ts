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

/** A weapon is rankable when it deals combat damage at all (shields do not). */
export const isRankable = (w: Weapon): boolean => totalCombatDamage(w) > 0;

/** The weapon type shown in filters: its skill, with ammunition kept apart from the bows. */
export const weaponGroup = (w: Weapon): string => (isAmmo(w) ? AMMO_GROUP : w.skill);
