import { describe, expect, it } from 'vitest';
import { gameData } from '../../data/load';
import { buildGuide, combatDamage } from './guide';

describe('buildGuide', () => {
  it('derives the Black Forest guide from data', () => {
    const g = buildGuide(gameData, 'blackforest');
    expect(g.bosses.map((b) => b.id)).toEqual(['gd_king']);
    expect(g.bosses[0].summon).toEqual([{ item: 'AncientSeed', qty: 3 }]);
    expect(g.mustKeep).toContain('Copper');
    expect(g.creatures[0].id).toBe('Troll'); // highest health first
    expect(g.armor.map((a) => a.slot)).toContain('chest');
    expect(g.weapons.length).toBeGreaterThan(0);
    expect(g.weapons.every((w) => w.damage > 0)).toBe(true);
  });

  it('keeps meadows and black forest content separate', () => {
    const m = buildGuide(gameData, 'meadows');
    expect(m.bosses.map((b) => b.id)).toEqual(['Eikthyr']);
    expect(m.creatures.map((c) => c.id)).not.toContain('Troll');
    expect(m.mustKeep).not.toContain('Copper');
  });

  it('returns empty lists for an unknown biome', () => {
    const g = buildGuide(gameData, 'nope');
    expect(g.creatures).toEqual([]);
    expect(g.bosses).toEqual([]);
  });

  it('sums combat damage only', () => {
    expect(combatDamage({ slash: 10, chop: 99, fire: 5 })).toBe(15);
  });
});
