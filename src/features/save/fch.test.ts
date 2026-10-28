import { describe, expect, it } from 'vitest';
import { gameData, saveKeys } from '../../data/load';
import { importCharacter } from './character';
import { FchError, parseCharacter, stableHash } from './fch';
import { buildFile } from './testFile';

describe('stableHash', () => {
  it('matches the values the game computes', () => {
    expect(stableHash('')).toBe(5381 + Math.imul(5381, 1566083941) | 0);
    expect(stableHash('Hammer')).not.toBe(stableHash('Wood'));
    expect(stableHash('Wood')).toBe(stableHash('Wood'));
  });

  it('gives every item in the data its own hash, so a save can be read back unambiguously', () => {
    const hashes = new Set(gameData.items.map((i) => stableHash(i.id)));
    expect(hashes.size).toBe(gameData.items.length);
  });
});

describe('parseCharacter', () => {
  it('reads the name, stats, inventory, skills and lists', () => {
    const c = parseCharacter(buildFile());
    expect(c.name).toBe('Venom');
    expect(c.stats.slice(0, 3)).toEqual([4, 12, 30]);
    expect(c.items.map((i) => [i.hash, i.stack, i.quality, i.equipped])).toEqual([
      [stableHash('Hammer'), 1, 1, true],
      [stableHash('Wood'), 40, 1, false],
      [stableHash('AxeBronze'), 1, 2, false],
    ]);
    expect(c.items[2]!.crafterName).toBe('Venom');
    expect(c.knownStations).toEqual({ $piece_workbench: 3 });
    expect(c.trophies).toEqual(['TrophyDeer', 'TrophyEikthyr']);
    expect(c.knownBiomes).toEqual(['Meadows', 'Black Forest']);
    expect(c.kills).toEqual({ $enemy_boar: 5, $enemy_greyling: 0 });
    expect(c.skills).toEqual([
      { type: 7, level: expect.closeTo(27.9, 1) },
      { type: 13, level: 50 },
    ]);
    expect(c.foods).toEqual([{ name: 'CookedMeat', secondsLeft: 600 }]);
  });

  it('refuses files that are not characters, with a plain message', () => {
    expect(() => parseCharacter(new Uint8Array(4))).toThrow(FchError);
    expect(() => parseCharacter(new Uint8Array(40))).toThrow(/not a Valheim character/);
  });

  it('says so when the file is from a newer or older game than the reader knows', () => {
    expect(() => parseCharacter(buildFile(99))).toThrow(/newer Valheim/);
    expect(() => parseCharacter(buildFile(40))).toThrow(/older Valheim/);
  });

  it('fails cleanly on a file cut short', () => {
    const file = buildFile();
    expect(() => parseCharacter(file.subarray(0, 120))).toThrow(FchError);
  });
});

describe('importCharacter', () => {
  const imp = importCharacter(parseCharacter(buildFile()), gameData, saveKeys, new Date('2026-10-28T12:00:00Z'));

  it('ticks what the character has found, including trophies and carried items', () => {
    expect(imp.collected).toEqual(expect.arrayContaining(['Wood', 'Stone', 'TrophyDeer', 'TrophyEikthyr', 'Hammer', 'AxeBronze']));
  });

  it('ticks as made only what was crafted (count above zero, or carried with a crafter name)', () => {
    expect(imp.crafted).toEqual(['AxeBronze']);
  });

  it('keeps names it cannot match as unknown instead of guessing', () => {
    expect(imp.unknown).toContain('$item_notindata');
  });

  it('builds the snapshot: gear, skills by name, stations, bosses and kills', () => {
    const s = imp.snapshot;
    expect(s.name).toBe('Venom');
    expect(s.skills).toEqual({ Axes: 27, 'Wood Cutting': 50 });
    expect(s.stations).toEqual({ piece_workbench: 3 });
    expect(s.bosses).toEqual(['Eikthyr']);
    expect(s.kills).toEqual({ Boar: 5 });
    expect(s.gear.find((g) => g.item === 'Hammer')!.equipped).toBe(true);
    expect(s.stats).toMatchObject({ deaths: 4, craftsAndUpgrades: 12, builds: 30 });
  });
});
