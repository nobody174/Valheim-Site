import { z } from 'zod';
import { HOARD_CATEGORIES, type Item } from '../data/schemas';

export const CURRENT_VERSION = 1;

export const PROGRESS_FLAGS = ['collected', 'crafted', 'completed', 'farmed'] as const;
export type ProgressFlag = (typeof PROGRESS_FLAGS)[number];

export const FAVORITE_KINDS = ['materials', 'recipes', 'gear'] as const;
export type FavoriteKind = (typeof FAVORITE_KINDS)[number];

const Hoard = z.enum(HOARD_CATEGORIES);

export const ProfileSchema = z
  .object({
    version: z.literal(CURRENT_VERSION),
    id: z.string().min(1),
    name: z.string().min(1).max(40),
    progress: z.record(
      z.string(),
      z.object({
        collected: z.boolean().optional(),
        crafted: z.boolean().optional(),
        completed: z.boolean().optional(),
        farmed: z.boolean().optional(),
      }),
    ),
    favorites: z.object({
      materials: z.array(z.string()),
      recipes: z.array(z.string()),
      gear: z.array(z.string()),
    }),
    hoardOverrides: z.record(z.string(), Hoard),
    inventory: z.record(z.string(), z.number().int().nonnegative()),
    notes: z.record(z.string(), z.string()),
  })
  .strict();

export type Profile = z.infer<typeof ProfileSchema>;

export const MetaSchema = z
  .object({ version: z.literal(CURRENT_VERSION), order: z.array(z.string()), active: z.string() })
  .strict();

export type StoredMeta = z.infer<typeof MetaSchema>;

export const ExportSchema = z
  .object({
    app: z.literal('valheim-companion'),
    exportVersion: z.literal(1),
    exportedAt: z.string(),
    active: z.string(),
    profiles: z.array(ProfileSchema).min(1),
  })
  .strict();

export type ExportFile = z.infer<typeof ExportSchema>;

export interface AppState {
  order: string[];
  active: string;
  profiles: Record<string, Profile>;
}

export function newId(): string {
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function emptyProfile(id: string, name: string): Profile {
  return {
    version: CURRENT_VERSION,
    id,
    name,
    progress: {},
    favorites: { materials: [], recipes: [], gear: [] },
    hoardOverrides: {},
    inventory: {},
    notes: {},
  };
}

export function initialState(): AppState {
  const id = newId();
  return { order: [id], active: id, profiles: { [id]: emptyProfile(id, 'Default') } };
}

/**
 * Bring a stored profile up to the current version. Returns null when it cannot be read
 * (corrupt, or written by a newer version of the app). Add a step per future version.
 */
export function migrateProfile(raw: unknown): Profile | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const version = (raw as { version?: unknown }).version;
  if (typeof version !== 'number' || version > CURRENT_VERSION) return null;
  // Migrations go here, e.g. if (version < 2) raw = v1ToV2(raw)
  const parsed = ProfileSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function hasFlag(profile: Profile, itemId: string, flag: ProgressFlag): boolean {
  return profile.progress[itemId]?.[flag] === true;
}

export function withToggledFlag(profile: Profile, itemId: string, flag: ProgressFlag): Profile {
  const entry = { ...profile.progress[itemId], [flag]: !hasFlag(profile, itemId, flag) };
  const progress = { ...profile.progress, [itemId]: entry };
  if (!PROGRESS_FLAGS.some((f) => entry[f])) delete progress[itemId];
  return { ...profile, progress };
}

export function withToggledFavorite(profile: Profile, kind: FavoriteKind, id: string): Profile {
  const list = profile.favorites[kind];
  const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  return { ...profile, favorites: { ...profile.favorites, [kind]: next } };
}

export function withHoardOverride(
  profile: Profile,
  itemId: string,
  hoard: Item['hoard'] | null,
): Profile {
  const hoardOverrides = { ...profile.hoardOverrides };
  if (hoard === null) delete hoardOverrides[itemId];
  else hoardOverrides[itemId] = hoard;
  return { ...profile, hoardOverrides };
}

export function effectiveHoard(item: Pick<Item, 'id' | 'hoard'>, profile: Profile): Item['hoard'] {
  return profile.hoardOverrides[item.id] ?? item.hoard;
}

/** Which favorites list an item belongs to. Recipes are favorited by recipe id instead. */
export function favoriteKindOf(category: Item['category']): FavoriteKind {
  return category === 'weapon' || category === 'armor' || category === 'tool' || category === 'trinket'
    ? 'gear'
    : 'materials';
}

export function buildExport(state: AppState, now = new Date()): ExportFile {
  return {
    app: 'valheim-companion',
    exportVersion: 1,
    exportedAt: now.toISOString(),
    active: state.active,
    profiles: state.order.map((id) => state.profiles[id]),
  };
}

export type ParseImportResult = { ok: true; data: ExportFile } | { ok: false; error: string };

export function parseImport(text: string): ParseImportResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: 'This file is not valid JSON.' };
  }
  const parsed = ExportSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const where = first.path.length ? ` (at ${first.path.join('.')})` : '';
    return {
      ok: false,
      error: `This is not a Valheim Companion export, or it is damaged${where}: ${first.message}`,
    };
  }
  return { ok: true, data: parsed.data };
}

/** Replace everything, or add the imported profiles next to the existing ones. */
export function applyImport(
  state: AppState,
  data: ExportFile,
  mode: 'replace' | 'merge',
): AppState {
  if (mode === 'replace') {
    const profiles = Object.fromEntries(data.profiles.map((p) => [p.id, p]));
    const order = data.profiles.map((p) => p.id);
    return { order, profiles, active: profiles[data.active] ? data.active : order[0] };
  }
  const profiles = { ...state.profiles };
  const order = [...state.order];
  for (const p of data.profiles) {
    const id = profiles[p.id] ? newId() : p.id;
    profiles[id] = { ...p, id };
    order.push(id);
  }
  return { order, profiles, active: state.active };
}
