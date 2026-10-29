import { useSyncExternalStore } from 'react';

/**
 * The places read from the owner's world file, and the spots a character remembers in it. This is
 * about one world on one device, not about a profile, and it can always be read again from the
 * files, so it is kept per browser and left out of the backup file. Safe when storage is missing or corrupt.
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

const KEY = 'vcs:v1:world';
let cache: SavedWorld | null | undefined;
const listeners = new Set<() => void>();

const isPoint = (v: unknown): v is SavedPoint =>
  typeof v === 'object' && v !== null && typeof (v as SavedPoint).x === 'number' && typeof (v as SavedPoint).z === 'number';

function parse(raw: string | null): SavedWorld | null {
  try {
    const v: unknown = raw ? JSON.parse(raw) : null;
    if (typeof v !== 'object' || v === null) return null;
    const w = v as Partial<SavedWorld>;
    if (typeof w.file !== 'string' || typeof w.places !== 'object' || w.places === null) return null;
    const places = Object.fromEntries(
      Object.entries(w.places).filter(([, list]) => Array.isArray(list) && list.every((n) => typeof n === 'number')),
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

function load(): SavedWorld | null {
  if (cache !== undefined) return cache;
  try {
    cache = parse(localStorage.getItem(KEY));
  } catch {
    cache = null;
  }
  return cache;
}

function store(next: SavedWorld | null): void {
  cache = next;
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  } catch {
    // Blocked storage: the places last until the page closes.
  }
  listeners.forEach((l) => l());
}

/** Keep a freshly read world file; spots read earlier from a character stay. */
export function saveWorldPlaces(file: string, places: Record<string, number[]>, unknown: number): void {
  store({ file, places, unknown, me: load()?.me });
}

/** Keep the spots a character file remembers. */
export function saveWorldMe(me: NonNullable<SavedWorld['me']>): void {
  const world = load();
  store({ file: world?.file ?? '', places: world?.places ?? {}, unknown: world?.unknown ?? 0, me });
}

export function clearWorld(): void {
  store(null);
}

export function useWorld(): SavedWorld | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    load,
    () => null,
  );
}

/** For tests: forget the in-memory copy so the next read goes to storage. */
export function resetWorldCache(): void {
  cache = undefined;
  listeners.forEach((l) => l());
}
