import {
  CURRENT_VERSION,
  MetaSchema,
  initialState,
  migrateProfile,
  type AppState,
  type Profile,
} from './model';

const META_KEY = 'vcs:v1:meta';
const profileKey = (id: string) => `vcs:v1:profile:${id}`;

/** Minimal slice of the Storage API, so tests can inject a fake and the app can run without one. */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function browserStorage(): StorageLike | null {
  try {
    const s = window.localStorage;
    s.getItem('vcs:probe');
    return s;
  } catch {
    return null; // blocked or unavailable (private mode, disabled storage)
  }
}

function readJson(storage: StorageLike | null, key: string): unknown {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Saved data the app could not read. The raw text is kept aside and offered for export, never deleted. */
export interface Rescued {
  /** The profile id, or `meta` for the profile list. */
  id: string;
  /** Where the raw copy was stored. */
  key: string;
  raw: string;
}

function readRaw(storage: StorageLike | null, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** A short fingerprint, so the same unreadable text is not copied again on every load. */
function fingerprint(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return `${text.length}-${(h >>> 0).toString(36)}`;
}

function rescue(storage: StorageLike | null, id: string, raw: string): Rescued {
  const key = `vcs:v1:broken:${id}:${fingerprint(raw)}`;
  try {
    if (storage && storage.getItem(key) === null) storage.setItem(key, raw);
  } catch {
    // no room to copy: the original key stays where it is and the text is still offered for export
  }
  return { id, key, raw };
}

/**
 * Load all profiles. Never throws. A profile that cannot be read is copied aside as raw text and
 * reported in `rescued`; it is never silently replaced. An empty profile is made only if none load.
 */
export function loadWithRescue(storage: StorageLike | null): {
  state: AppState;
  rescued: Rescued[];
} {
  const rescued: Rescued[] = [];
  const metaRaw = readRaw(storage, META_KEY);
  const meta = MetaSchema.safeParse(readJson(storage, META_KEY));
  if (metaRaw && !meta.success) rescued.push(rescue(storage, 'meta', metaRaw));
  const order: string[] = [];
  const profiles: AppState['profiles'] = {};
  if (meta.success) {
    for (const id of meta.data.order) {
      const raw = readRaw(storage, profileKey(id));
      const profile = migrateProfile(readJson(storage, profileKey(id)));
      if (profile && profile.id === id && !profiles[id]) {
        profiles[id] = profile;
        order.push(id);
      } else if (raw) {
        rescued.push(rescue(storage, id, raw));
      }
    }
  }
  if (order.length === 0) return { state: initialState(), rescued };
  const active = meta.success && profiles[meta.data.active] ? meta.data.active : order[0];
  return { state: { order, active, profiles }, rescued };
}

export const loadState = (storage: StorageLike | null): AppState => loadWithRescue(storage).state;

function write(storage: StorageLike | null, key: string, value: unknown): void {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    // quota or access error: state stays in memory for this session
  }
}

export function saveProfile(storage: StorageLike | null, profile: Profile): void {
  write(storage, profileKey(profile.id), profile);
}

export function saveMeta(storage: StorageLike | null, state: AppState): void {
  write(storage, META_KEY, { version: CURRENT_VERSION, order: state.order, active: state.active });
}

export function removeProfile(storage: StorageLike | null, id: string): void {
  try {
    storage?.removeItem(profileKey(id));
  } catch {
    // ignore
  }
}

/** Persist everything: meta, every profile, and drop profiles that no longer exist. */
export function saveAll(storage: StorageLike | null, state: AppState, previous?: AppState): void {
  for (const id of previous?.order ?? []) if (!state.profiles[id]) removeProfile(storage, id);
  for (const id of state.order) saveProfile(storage, state.profiles[id]);
  saveMeta(storage, state);
}
