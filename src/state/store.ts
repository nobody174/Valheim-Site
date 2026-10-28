import { createStore, useStore as useZustand } from 'zustand';
import type { Item } from '../data/schemas';
import type { CharacterImport } from '../features/save/character';
import {
  applyImport,
  emptyProfile,
  newId,
  withHoardOverride,
  withCharacter,
  profileForCharacter,
  withInventoryQty,
  withNote,
  withPortal,
  withoutPortal,
  type Portal,
  withPlannerTargets,
  withToggledTick,
  withToggledFavorite,
  withToggledFlag,
  type AppState,
  type ExportFile,
  type FavoriteKind,
  type Profile,
  type PlannerState,
  type ProgressFlag,
} from './model';
import {
  browserStorage,
  loadState,
  removeProfile,
  saveMeta,
  saveProfile,
  saveAll,
  type StorageLike,
} from './persistence';

export interface Actions {
  toggleFlag(itemId: string, flag: ProgressFlag): void;
  toggleFavorite(kind: FavoriteKind, id: string): void;
  setHoardOverride(itemId: string, hoard: Item['hoard'] | null): void;
  setInventoryQty(itemId: string, qty: number): void;
  setPlannerTargets(targets: PlannerState['targets']): void;
  toggleTick(itemId: string): void;
  setNote(itemId: string, text: string): void;
  /** Add or change one of the active profile's portals (same id replaces). */
  savePortal(portal: Portal): void;
  removePortal(id: string): void;
  /** Tick what a character file shows and keep its snapshot; returns the profile it went to. */
  applyCharacter(imp: CharacterImport): void;
  createProfile(name: string): void;
  renameProfile(id: string, name: string): void;
  switchProfile(id: string): void;
  deleteProfile(id: string): void;
  importData(data: ExportFile, mode: 'replace' | 'merge'): void;
}

export type StoreState = AppState & Actions;

const cleanName = (name: string) => name.trim().slice(0, 40);

/** Zustand store with write-through persistence. `storage` can be null (app still works in memory). */
export function createAppStore(storage: StorageLike | null) {
  const initial = loadState(storage);
  saveAll(storage, initial); // a fresh or repaired state is stored right away
  return createStore<StoreState>()((set, get) => {
    const base = (): AppState => {
      const { order, active, profiles } = get();
      return { order, active, profiles };
    };

    const updateActive = (fn: (p: Profile) => Profile) => {
      const { active, profiles } = base();
      const next = fn(profiles[active]);
      saveProfile(storage, next);
      set({ profiles: { ...profiles, [active]: next } });
    };

    return {
      ...initial,

      toggleFlag: (itemId, flag) => updateActive((p) => withToggledFlag(p, itemId, flag)),
      toggleFavorite: (kind, id) => updateActive((p) => withToggledFavorite(p, kind, id)),
      setHoardOverride: (itemId, hoard) => updateActive((p) => withHoardOverride(p, itemId, hoard)),
      setInventoryQty: (itemId, qty) => updateActive((p) => withInventoryQty(p, itemId, qty)),
      setPlannerTargets: (targets) => updateActive((p) => withPlannerTargets(p, targets)),
      toggleTick: (itemId) => updateActive((p) => withToggledTick(p, itemId)),
      setNote: (itemId, text) => updateActive((p) => withNote(p, itemId, text)),
      savePortal: (portal) => updateActive((p) => withPortal(p, portal)),
      removePortal: (id) => updateActive((p) => withoutPortal(p, id)),

      applyCharacter: (imp) => {
        const state = base();
        let target = profileForCharacter(state, imp.snapshot.name);
        let next = state;
        if (target === null) {
          target = newId();
          const profile = emptyProfile(target, cleanName(imp.snapshot.name) || 'Character');
          next = { order: [...state.order, target], active: target, profiles: { ...state.profiles, [target]: profile } };
        }
        const current = next.profiles[target];
        // A still-unnamed starter profile takes the character's name.
        const named = current.name === 'Default' ? { ...current, name: cleanName(imp.snapshot.name) || current.name } : current;
        const updated = withCharacter(named, imp);
        const result = { ...next, active: target, profiles: { ...next.profiles, [target]: updated } };
        saveProfile(storage, updated);
        saveMeta(storage, result);
        set(result);
      },

      createProfile: (name) => {
        const clean = cleanName(name);
        if (!clean) return;
        const state = base();
        const id = newId();
        const profile = emptyProfile(id, clean);
        const next = {
          order: [...state.order, id],
          active: id,
          profiles: { ...state.profiles, [id]: profile },
        };
        saveProfile(storage, profile);
        saveMeta(storage, next);
        set(next);
      },

      renameProfile: (id, name) => {
        const clean = cleanName(name);
        const state = base();
        if (!clean || !state.profiles[id]) return;
        const profile = { ...state.profiles[id], name: clean };
        saveProfile(storage, profile);
        set({ profiles: { ...state.profiles, [id]: profile } });
      },

      switchProfile: (id) => {
        const state = base();
        if (!state.profiles[id]) return;
        saveMeta(storage, { ...state, active: id });
        set({ active: id });
      },

      deleteProfile: (id) => {
        const state = base();
        if (!state.profiles[id] || state.order.length <= 1) return; // never delete the last profile
        const order = state.order.filter((x) => x !== id);
        const profiles = { ...state.profiles };
        delete profiles[id];
        const next = { order, profiles, active: state.active === id ? order[0] : state.active };
        removeProfile(storage, id);
        saveMeta(storage, next);
        set(next);
      },

      importData: (data, mode) => {
        const previous = base();
        const next = applyImport(previous, data, mode);
        saveAll(storage, next, previous);
        set(next);
      },
    };
  });
}

export const appStore = createAppStore(browserStorage());

export function useApp<T>(selector: (s: StoreState) => T): T {
  return useZustand(appStore, selector);
}

export const useProfile = (): Profile => useApp((s) => s.profiles[s.active]);
