import type { Recipe, Station } from './schemas';

/**
 * The station level needed to craft or upgrade to a quality: the recipe's minimum level plus one
 * for every quality above the first (`Recipe.GetRequiredStationLevel` in the game code).
 */
export const requiredStationLevel = (minLevel: number, quality = 1): number =>
  Math.max(1, minLevel) + (quality - 1);

export interface StationLevelRow {
  level: number;
  /** Different extensions that must stand within range: a station is level 1 plus that many. */
  extensionsNeeded: number;
  /** False when reaching this level needs an extension whose materials are not in the data yet. */
  reachable: boolean;
  /** Recipes that first become craftable at this level. */
  crafts: Recipe[];
  /** Upgrade steps that need exactly this level. */
  upgrades: { recipe: Recipe; quality: number }[];
}

/**
 * What each level of a station means. The game counts each different extension once (they do not
 * stack) and a station's level is 1 plus that count (`CraftingStation.GetLevel`), so level N needs
 * any N - 1 of the station's extensions. Computed here, never stored.
 */
export function stationLevels(station: Station, recipes: Recipe[]): StationLevelRow[] {
  const known = station.extensions.length;
  const maxLevel = 1 + known + station.laterExtensions.length;
  const mine = recipes.filter((r) => r.station?.id === station.id);
  const needed = mine.flatMap((r) => {
    const base = r.station?.minLevel ?? 1;
    return [requiredStationLevel(base), ...r.upgrades.map((u) => requiredStationLevel(base, u.quality))];
  });
  const top = Math.max(maxLevel, ...needed);
  return Array.from({ length: top }, (_, i) => {
    const level = i + 1;
    return {
      level,
      extensionsNeeded: level - 1,
      reachable: level - 1 <= known,
      crafts: mine.filter((r) => requiredStationLevel(r.station?.minLevel ?? 1) === level),
      upgrades: mine.flatMap((r) =>
        r.upgrades
          .filter((u) => requiredStationLevel(r.station?.minLevel ?? 1, u.quality) === level)
          .map((u) => ({ recipe: r, quality: u.quality })),
      ),
    };
  });
}
