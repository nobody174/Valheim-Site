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

/** Load all profiles. Never throws; unreadable data is skipped and an empty profile is made if needed. */
export function loadState(storage: StorageLike | null): AppState {
  const meta = MetaSchema.safeParse(readJson(storage, META_KEY));
  const order: string[] = [];
  const profiles: AppState['profiles'] = {};
  if (meta.success) {
    for (const id of meta.data.order) {
      const profile = migrateProfile(readJson(storage, profileKey(id)));
      if (profile && profile.id === id && !profiles[id]) {
        profiles[id] = profile;
        order.push(id);
      }
    }
  }
  if (order.length === 0) return initialState();
  const active = meta.success && profiles[meta.data.active] ? meta.data.active : order[0];
  return { order, active, profiles };
}

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
