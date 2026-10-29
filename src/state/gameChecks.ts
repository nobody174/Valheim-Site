import { useSyncExternalStore } from 'react';
import type { Profile } from './model';

/**
 * What the game showed for each "Check in game" line: "ok" (the site matched) or "bad" (it did not).
 * This is about the site's data, not about a character, so it is kept for the whole browser rather
 * than per profile. Safe when storage is missing or corrupt.
 */
export type GameCheck = 'ok' | 'bad';
export type GameChecks = Record<string, GameCheck>;

const KEY = 'vcs:v1:gamechecks';
const ADOPTED = 'vcs:v1:gamechecks-adopted';
const EMPTY: GameChecks = {};

let cache: GameChecks | null = null;
const listeners = new Set<() => void>();

function parse(raw: string | null): GameChecks {
  try {
    const value: unknown = raw ? JSON.parse(raw) : {};
    if (typeof value !== 'object' || value === null) return {};
    return Object.fromEntries(Object.entries(value).filter(([, v]) => v === 'ok' || v === 'bad')) as GameChecks;
  } catch {
    return {};
  }
}

function load(): GameChecks {
  if (cache) return cache;
  try {
    cache = parse(localStorage.getItem(KEY));
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function store(next: GameChecks): void {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Blocked storage: the answers last until the page closes.
  }
  listeners.forEach((l) => l());
}

/** Mark a line as matching the game (ok) or not (bad); pressing the same answer again clears it. */
export function setGameCheck(key: string, value: GameCheck): void {
  const next = { ...load() };
  if (next[key] === value) delete next[key];
  else next[key] = value;
  store(next);
}

/** Once: take in answers an earlier version kept inside each profile. Answers already here win. */
export function adoptProfileChecks(profiles: Profile[]): void {
  try {
    if (localStorage.getItem(ADOPTED)) return;
    localStorage.setItem(ADOPTED, '1');
  } catch {
    return;
  }
  const merged: GameChecks = {};
  for (const p of profiles) Object.assign(merged, p.checks);
  if (Object.keys(merged).length > 0) store({ ...merged, ...load() });
}

/** The answers as they are now, for a backup file. */
export function getGameChecks(): GameChecks {
  return load();
}

/** Take answers from a backup: "replace" swaps what is here, "merge" keeps what is here and adds the rest. */
export function importGameChecks(incoming: GameChecks | undefined, mode: 'replace' | 'merge'): void {
  if (!incoming) return;
  store(mode === 'replace' ? { ...incoming } : { ...incoming, ...load() });
}

export function useGameChecks(): GameChecks {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    load,
    () => EMPTY,
  );
}

/** For tests: forget the in-memory copy so the next read goes to storage. */
export function resetGameChecksCache(): void {
  cache = null;
  listeners.forEach((l) => l());
}
