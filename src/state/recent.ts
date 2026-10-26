const KEY = 'vcs:v1:recent';
const MAX = 8;

/** Recently opened item ids, newest first. Safe when storage is missing or corrupt. */
export function getRecent(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function pushRecent(id: string): void {
  try {
    const next = [id, ...getRecent().filter((x) => x !== id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable: recents are a convenience only
  }
}
