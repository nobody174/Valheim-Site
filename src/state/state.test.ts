import { describe, expect, it } from 'vitest';
import {
  buildExport,
  effectiveHoard,
  emptyProfile,
  favoriteKindOf,
  hasFlag,
  migrateProfile,
  parseImport,
} from './model';
import { loadState, type StorageLike } from './persistence';
import { createAppStore } from './store';

function memoryStorage(
  initial: Record<string, string> = {},
): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = v;
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}

const active = (s: ReturnType<typeof createAppStore>) => s.getState().profiles[s.getState().active];

describe('migrateProfile', () => {
  it('accepts a current profile', () => {
    expect(migrateProfile(emptyProfile('a', 'A'))?.id).toBe('a');
  });
  it('rejects garbage, wrong shapes and newer versions', () => {
    expect(migrateProfile(null)).toBeNull();
    expect(migrateProfile('x')).toBeNull();
    expect(migrateProfile({ version: 1 })).toBeNull();
    expect(migrateProfile({ ...emptyProfile('a', 'A'), version: 99 })).toBeNull();
  });
});

describe('persistence', () => {
  it('starts with one empty working profile when storage is empty or missing', () => {
    for (const storage of [memoryStorage(), null]) {
      const state = loadState(storage);
      expect(state.order).toHaveLength(1);
      expect(state.profiles[state.active].progress).toEqual({});
    }
  });

  it('keeps state across a reload', () => {
    const storage = memoryStorage();
    const a = createAppStore(storage);
    a.getState().toggleFlag('Wood', 'collected');
    a.getState().toggleFavorite('materials', 'Wood');
    a.getState().setHoardOverride('Wood', 'must_keep');
    const b = createAppStore(storage);
    expect(hasFlag(active(b), 'Wood', 'collected')).toBe(true);
    expect(active(b).favorites.materials).toEqual(['Wood']);
    expect(active(b).hoardOverrides.Wood).toBe('must_keep');
  });

  it('survives corrupt storage', () => {
    const storage = memoryStorage({ 'vcs:v1:meta': '{nope', 'vcs:v1:profile:x': '[]' });
    const store = createAppStore(storage);
    expect(store.getState().order).toHaveLength(1);
    store.getState().toggleFlag('Wood', 'collected'); // still usable
    expect(hasFlag(active(store), 'Wood', 'collected')).toBe(true);
  });

  it('does not throw when storage rejects writes', () => {
    const broken: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => undefined,
    };
    const store = createAppStore(broken);
    expect(() => store.getState().toggleFlag('Wood', 'collected')).not.toThrow();
    expect(hasFlag(active(store), 'Wood', 'collected')).toBe(true);
  });
});

describe('profiles', () => {
  it('never leaks progress between profiles', () => {
    const store = createAppStore(memoryStorage());
    const first = store.getState().active;
    store.getState().toggleFlag('Wood', 'collected');
    store.getState().toggleFavorite('gear', 'Club');
    store.getState().createProfile('Second');
    expect(store.getState().active).not.toBe(first);
    expect(active(store).progress).toEqual({});
    expect(active(store).favorites.gear).toEqual([]);
    store.getState().toggleFlag('Stone', 'crafted');
    store.getState().switchProfile(first);
    expect(hasFlag(active(store), 'Wood', 'collected')).toBe(true);
    expect(hasFlag(active(store), 'Stone', 'crafted')).toBe(false);
  });

  it('renames, deletes, and keeps at least one profile', () => {
    const storage = memoryStorage();
    const store = createAppStore(storage);
    const first = store.getState().active;
    store.getState().renameProfile(first, '  Viking  ');
    expect(active(store).name).toBe('Viking');
    store.getState().deleteProfile(first); // last one: refused
    expect(store.getState().order).toEqual([first]);
    store.getState().createProfile('Other');
    const other = store.getState().active;
    store.getState().deleteProfile(other);
    expect(store.getState().active).toBe(first);
    expect(storage.data[`vcs:v1:profile:${other}`]).toBeUndefined();
    store.getState().createProfile('   '); // blank names ignored
    expect(store.getState().order).toEqual([first]);
  });
});

describe('progress, favorites and hoard overrides', () => {
  it('toggles flags on and off and drops empty entries', () => {
    const store = createAppStore(memoryStorage());
    store.getState().toggleFlag('Wood', 'farmed');
    expect(hasFlag(active(store), 'Wood', 'farmed')).toBe(true);
    store.getState().toggleFlag('Wood', 'farmed');
    expect(active(store).progress).toEqual({});
  });

  it('uses the override when set and the default otherwise', () => {
    const store = createAppStore(memoryStorage());
    const item = { id: 'Wood', hoard: 'keep_some' as const };
    expect(effectiveHoard(item, active(store))).toBe('keep_some');
    store.getState().setHoardOverride('Wood', 'sell');
    expect(effectiveHoard(item, active(store))).toBe('sell');
    store.getState().setHoardOverride('Wood', null);
    expect(effectiveHoard(item, active(store))).toBe('keep_some');
  });

  it('maps categories to favorite lists', () => {
    expect(favoriteKindOf('weapon')).toBe('gear');
    expect(favoriteKindOf('armor')).toBe('gear');
    expect(favoriteKindOf('material')).toBe('materials');
    expect(favoriteKindOf('food')).toBe('materials');
  });
});

describe('export and import', () => {
  it('round-trips through a wiped storage', () => {
    const storage = memoryStorage();
    const store = createAppStore(storage);
    store.getState().toggleFlag('Wood', 'collected');
    store.getState().createProfile('Second');
    store.getState().toggleFavorite('recipes', 'recipe.Club');
    const text = JSON.stringify(buildExport(store.getState()));

    const wiped = createAppStore(memoryStorage());
    const parsed = parseImport(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    wiped.getState().importData(parsed.data, 'replace');
    expect(wiped.getState().order).toHaveLength(2);
    expect(active(wiped).favorites.recipes).toEqual(['recipe.Club']);
    wiped.getState().switchProfile(store.getState().order[0]);
    expect(hasFlag(active(wiped), 'Wood', 'collected')).toBe(true);
  });

  it('rejects bad files with a clear message', () => {
    for (const bad of [
      'not json',
      '{}',
      '[]',
      JSON.stringify({ app: 'valheim-companion', exportVersion: 1 }),
    ]) {
      const r = parseImport(bad);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.length).toBeGreaterThan(10);
    }
  });

  it('merge keeps existing profiles and avoids id collisions', () => {
    const store = createAppStore(memoryStorage());
    store.getState().toggleFlag('Wood', 'collected');
    const file = buildExport(store.getState());
    store.getState().importData(file, 'merge');
    expect(store.getState().order).toHaveLength(2);
    expect(new Set(store.getState().order).size).toBe(2);
  });
});
