import { useSyncExternalStore } from 'react';

/**
 * The places read from the owner's world file, and the spots a character remembers in it. This is
 * about one world. Kept per profile (a profile is a character, and a character plays in a world), in this
 * browser only, and left out of the backup file because it can always be read again from the files. Safe
 * when storage is missing or corrupt.
 */
export interface SavedPoint {
  x: number;
  z: number;
}

export interface SavedWorld {
  /** Name of the file the places were read from, shown back to the reader. */
  file: string;
  /** Place family id -> flat list of x, z, x, z ... in whole metres. */
  places: Record<string, number[]>;
  /** Places in the file that the data does not know by name. */
  unknown: number;
  /** Where the character was, from a character file, if one was read. */
  me?: { name: string; home?: SavedPoint; logout?: SavedPoint; death?: SavedPoint };
}

const key = (profile: string) => `vcs:v1:world:${profile}`;
const cache = new Map<string, SavedWorld | null>();
const listeners = new Set<() => void>();

const isPoint = (v: unknown): v is SavedPoint =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as SavedPoint).x === 'number' &&
  typeof (v as SavedPoint).z === 'number';

function parse(raw: string | null): SavedWorld | null {
  try {
    const v: unknown = raw ? JSON.parse(raw) : null;
    if (typeof v !== 'object' || v === null) return null;
    const w = v as Partial<SavedWorld>;
    if (typeof w.file !== 'string' || typeof w.places !== 'object' || w.places === null)
      return null;
    const places = Object.fromEntries(
      Object.entries(w.places).filter(
        ([, list]) => Array.isArray(list) && list.every((n) => typeof n === 'number'),
      ),
    );
    const me = w.me;
    return {
      file: w.file,
      places,
      unknown: typeof w.unknown === 'number' ? w.unknown : 0,
      me:
        me && typeof me.name === 'string'
          ? {
              name: me.name,
              ...(isPoint(me.home) && { home: me.home }),
              ...(isPoint(me.logout) && { logout: me.logout }),
              ...(isPoint(me.death) && { death: me.death }),
            }
          : undefined,
    };
  } catch {
    return null;
  }
}

function load(profile: string): SavedWorld | null {
  const known = cache.get(profile);
  if (known !== undefined) return known;
  let value: SavedWorld | null = null;
  try {
    value = parse(localStorage.getItem(key(profile)));
  } catch {
    // Blocked storage: nothing saved.
  }
  cache.set(profile, value);
  return value;
}

function store(profile: string, next: SavedWorld | null): void {
  cache.set(profile, next);
  try {
    if (next) localStorage.setItem(key(profile), JSON.stringify(next));
    else localStorage.removeItem(key(profile));
  } catch {
    // Blocked storage: the places last until the page closes.
  }
  listeners.forEach((l) => l());
}

/** Keep a freshly read world file; spots read earlier from a character stay. */
export function saveWorldPlaces(
  profile: string,
  file: string,
  places: Record<string, number[]>,
  unknown: number,
): void {
  store(profile, { file, places, unknown, me: load(profile)?.me });
}

/** Keep the spots a character file remembers. */
export function saveWorldMe(profile: string, me: NonNullable<SavedWorld['me']>): void {
  const world = load(profile);
  store(profile, {
    file: world?.file ?? '',
    places: world?.places ?? {},
    unknown: world?.unknown ?? 0,
    me,
  });
}

export function clearWorld(profile: string): void {
  store(profile, null);
}

export function useWorld(profile: string): SavedWorld | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => load(profile),
    () => null,
  );
}

/** For tests: forget the in-memory copy so the next read goes to storage. */
export function resetWorldCache(): void {
  cache.clear();
  listeners.forEach((l) => l());
}
