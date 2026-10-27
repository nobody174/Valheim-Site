import { describe, expect, it } from 'vitest';
import { lookup } from './lookup';
import { requiredStationLevel, stationLevels } from './stationLevels';

describe('requiredStationLevel', () => {
  it('adds one level per quality above the first', () => {
    expect(requiredStationLevel(1, 1)).toBe(1);
    expect(requiredStationLevel(1, 4)).toBe(4);
    expect(requiredStationLevel(2, 3)).toBe(4);
  });
  it('treats a minimum level of 0 as 1', () => {
    expect(requiredStationLevel(0, 1)).toBe(1);
  });
});

describe('stationLevels', () => {
  const rows = (id: string) => stationLevels(lookup.station(id)!, lookup.allRecipes());

  it('puts the Flint Spear at workbench level 1 and each upgrade one level higher', () => {
    const wb = rows('piece_workbench');
    expect(wb[0]!.crafts.map((r) => r.output.item)).toContain('SpearFlint');
    const steps = wb.flatMap((r) =>
      r.upgrades.filter((u) => u.recipe.output.item === 'SpearFlint').map((u) => [u.quality, r.level]),
    );
    expect(steps).toEqual([
      [2, 2],
      [3, 3],
      [4, 4],
    ]);
  });

  it('does not list recipes that need no station (the Club is made by hand)', () => {
    const all = lookup.allStations().flatMap((s) => rows(s.id).flatMap((r) => r.crafts));
    expect(all.map((r) => r.output.item)).not.toContain('Club');
  });

  it('needs N - 1 different extensions for level N, and flags levels that need later zones', () => {
    const wb = rows('piece_workbench');
    expect(wb[2]!.extensionsNeeded).toBe(2);
    expect(wb[2]!.reachable).toBe(true); // 3 known extensions
    const known = lookup.station('piece_workbench')!.extensions.length;
    for (const r of wb) expect(r.reachable).toBe(r.level - 1 <= known);
  });

  it('knows the cauldron has later-zone extensions beyond the Spice Rack', () => {
    const c = lookup.station('piece_cauldron')!;
    expect(c.extensions.map((e) => e.name)).toContain('Spice Rack');
    expect(c.laterExtensions.map((e) => e.name)).toContain('Smoker');
    const levels = stationLevels(c, lookup.allRecipes());
    expect(levels.length).toBeGreaterThanOrEqual(6);
    for (const l of levels) expect(l.reachable).toBe(l.level - 1 <= c.extensions.length);
    expect(levels.at(-1)!.reachable).toBe(false);
  });
});
