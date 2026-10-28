import { requiredStationLevel } from '../../data/stationLevels';
import type { Recipe } from '../../data/schemas';

type Ingredient = Recipe['inputs'][number];

export interface UpgradeStep {
  quality: number;
  inputs: Ingredient[];
  /** Station level needed for this step. */
  level: number;
}

export interface UpgradeCost {
  steps: UpgradeStep[];
  /** All steps added up, one line per item. */
  total: Ingredient[];
  /** Highest station level any step needs; 0 when there are no steps. */
  stationLevel: number;
}

/** Highest quality a recipe can be upgraded to (1 when it cannot be upgraded). */
export const maxUpgradeQuality = (recipe: Recipe): number =>
  Math.max(1, ...recipe.upgrades.map((u) => u.quality));

/**
 * What it costs to take an item you hold at quality `from` up to quality `to`: every step above
 * `from` and up to `to`, with the station level each one needs (`requiredStationLevel`).
 */
export function upgradeCost(recipe: Recipe, from: number, to: number): UpgradeCost {
  const steps = recipe.upgrades
    .filter((u) => u.quality > from && u.quality <= to)
    .sort((a, b) => a.quality - b.quality)
    .map((u) => ({
      quality: u.quality,
      inputs: u.inputs,
      level: requiredStationLevel(recipe.station?.minLevel ?? 1, u.quality),
    }));
  const sums = new Map<string, number>();
  for (const s of steps) for (const i of s.inputs) sums.set(i.item, (sums.get(i.item) ?? 0) + i.qty);
  return {
    steps,
    total: [...sums].map(([item, qty]) => ({ item, qty })),
    stationLevel: Math.max(0, ...steps.map((s) => s.level)),
  };
}
