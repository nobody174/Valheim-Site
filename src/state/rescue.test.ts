import { describe, expect, it } from 'vitest';
import { emptyProfile, type Profile } from './model';
import { loadWithRescue, type StorageLike } from './persistence';

function fakeStorage(
  initial: Record<string, string>,
): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => void (data[k] = v),
    removeItem: (k) => void delete data[k],
  };
}

const meta = (ids: string[]) => JSON.stringify({ version: 1, order: ids, active: ids[0] });

describe('loading saved profiles', () => {
  it('keeps a profile that has an extra field, unchanged', () => {
    const p = { ...emptyProfile('p1', 'Venom'), notes: { Iron: 'mine' }, futureField: { a: 1 } };
    const s = fakeStorage({ 'vcs:v1:meta': meta(['p1']), 'vcs:v1:profile:p1': JSON.stringify(p) });
    const { state, rescued } = loadWithRescue(s);
    expect(rescued).toEqual([]);
    expect(state.profiles.p1?.name).toBe('Venom');
    expect(state.profiles.p1?.notes).toEqual({ Iron: 'mine' });
    expect((state.profiles.p1 as Profile & { futureField?: unknown }).futureField).toEqual({
      a: 1,
    });
  });

  it('keeps a character snapshot that has an extra field', () => {
    const base = emptyProfile('p1', 'Venom');
    const snapshot = {
      name: 'Venom',
      importedAt: 'x',
      stats: { deaths: 1, kills: 2, builds: 3, craftsAndUpgrades: 4, hoursPlayed: 5 },
      maxHealth: 100,
      maxStamina: 100,
      gear: [],
      skills: {},
      stations: {},
      biomes: [],
      bosses: [],
      kills: {},
      foods: [],
      newThing: true,
    };
    const s = fakeStorage({
      'vcs:v1:meta': meta(['p1']),
      'vcs:v1:profile:p1': JSON.stringify({ ...base, character: snapshot }),
    });
    expect(loadWithRescue(s).state.profiles.p1?.character?.name).toBe('Venom');
  });

  it('sets an unreadable profile aside and never overwrites it', () => {
    const bad = JSON.stringify({ ...emptyProfile('p1', 'Venom'), progress: 'broken' });
    const s = fakeStorage({ 'vcs:v1:meta': meta(['p1']), 'vcs:v1:profile:p1': bad });
    const { rescued } = loadWithRescue(s);
    expect(rescued).toHaveLength(1);
    expect(rescued[0]?.raw).toBe(bad);
    expect(s.data[rescued[0]!.key]).toBe(bad);
    expect(s.data['vcs:v1:profile:p1']).toBe(bad);
    expect(loadWithRescue(s).rescued).toHaveLength(1);
    expect(Object.keys(s.data).filter((k) => k.startsWith('vcs:v1:broken:'))).toHaveLength(1);
  });

  it('sets aside a profile written by a newer version', () => {
    const newer = JSON.stringify({ ...emptyProfile('p1', 'Venom'), version: 2 });
    const s = fakeStorage({ 'vcs:v1:meta': meta(['p1']), 'vcs:v1:profile:p1': newer });
    expect(loadWithRescue(s).rescued[0]?.raw).toBe(newer);
  });

  it('loads the readable profiles and sets aside only the broken one', () => {
    const good = emptyProfile('p2', 'Son');
    const s = fakeStorage({
      'vcs:v1:meta': meta(['p1', 'p2']),
      'vcs:v1:profile:p1': '{not json',
      'vcs:v1:profile:p2': JSON.stringify(good),
    });
    const { state, rescued } = loadWithRescue(s);
    expect(state.order).toEqual(['p2']);
    expect(rescued.map((r) => r.id)).toEqual(['p1']);
  });
});
