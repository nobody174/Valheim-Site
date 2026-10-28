/**
 * When this browser last downloaded a backup, so the site can nudge now and then. Kept per device
 * (not in a profile) and the site works when storage is blocked. `since` is the first time the
 * site looked, so a new user is not nagged on day one.
 */
const KEY = 'vcs:v1:backup';

export const BACKUP_EVERY_DAYS = 14;
const DAY_MS = 86_400_000;

interface BackupInfo {
  last?: string;
  since: string;
}

function read(now: Date): BackupInfo {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { last?: unknown; since?: unknown };
      const since = typeof parsed.since === 'string' && !Number.isNaN(Date.parse(parsed.since)) ? parsed.since : now.toISOString();
      const last = typeof parsed.last === 'string' && !Number.isNaN(Date.parse(parsed.last)) ? parsed.last : undefined;
      return { last, since };
    }
    const fresh: BackupInfo = { since: now.toISOString() };
    localStorage.setItem(KEY, JSON.stringify(fresh));
    return fresh;
  } catch {
    return { since: now.toISOString() };
  }
}

export function markBackup(now = new Date()): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...read(now), last: now.toISOString() }));
  } catch {
    // Blocked storage: the reminder just comes back next visit.
  }
}

/** Days since the last backup, or null if none was made on this device. */
export function daysSinceBackup(now = new Date()): number | null {
  const { last } = read(now);
  return last ? Math.floor((now.getTime() - Date.parse(last)) / DAY_MS) : null;
}

/** True when a backup is overdue: the last one (or, with none, the first visit) is old enough. */
export function backupDue(now = new Date()): boolean {
  const { last, since } = read(now);
  return now.getTime() - Date.parse(last ?? since) >= BACKUP_EVERY_DAYS * DAY_MS;
}
