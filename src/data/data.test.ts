import { describe, expect, it } from 'vitest';
import { gameData } from './load';

describe('seed data sanity', () => {
  it('every station used by a recipe is defined and named', () => {
    const stations = new Map(gameData.stations.map((s) => [s.id, s]));
    for (const r of gameData.recipes) {
      if (r.station) expect(stations.get(r.station.id)?.name, r.id).toBeTruthy();
    }
  });

  it('station ids are clean prefab names', () => {
    for (const s of gameData.stations) expect(s.id, s.id).not.toMatch(/[ ()]/);
  });

  it('conversion recipes carry a kind and single input', () => {
    const conv = gameData.recipes.filter((r) => r.id.startsWith('conv.'));
    expect(conv.length).toBeGreaterThan(0);
    for (const r of conv) {
      expect(r.kind, r.id).not.toBe('craft');
      expect(r.inputs, r.id).toHaveLength(1);
    }
  });

  it('meads that can be drunk have an effect; base meads are not listed as drinks', () => {
    const meads = gameData.foods.filter((f) => f.kind === 'mead');
    expect(meads.length).toBeGreaterThan(0);
    for (const m of meads) {
      expect(m.item, m.item).not.toMatch(/^MeadBase/);
      expect(m.effect, m.item).toBeTruthy();
    }
  });

  it('hostile creatures have attack damage and every biome reference exists', () => {
    const biomes = new Set(gameData.biomes.map((b) => b.id));
    for (const c of [...gameData.creatures, ...gameData.bosses]) {
      expect(biomes.has(c.biome ?? ''), c.id).toBe(true);
    }
    const byId = new Map([...gameData.creatures, ...gameData.bosses].map((c) => [c.id, c]));
    for (const id of ['Boar', 'Greydwarf', 'Troll', 'Eikthyr', 'gd_king']) {
      expect(byId.get(id)?.attacks.length, id).toBeGreaterThan(0);
    }
  });

  it('armor set data is complete when a set is named', () => {
    for (const a of gameData.armor.filter((x) => x.setName)) {
      expect(a.setSize, a.item).toBeGreaterThan(1);
    }
  });
});
