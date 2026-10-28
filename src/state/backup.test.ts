// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { backupDue, daysSinceBackup, markBackup } from './backup';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

const day = (n: number) => new Date(Date.UTC(2026, 9, 1 + n));

describe('backup reminder', () => {
  it('does not nag on the first visit', () => {
    expect(backupDue(day(0))).toBe(false);
    expect(daysSinceBackup(day(0))).toBeNull();
  });

  it('is due two weeks after the first visit with no backup', () => {
    backupDue(day(0));
    expect(backupDue(day(13))).toBe(false);
    expect(backupDue(day(14))).toBe(true);
  });

  it('counts from the last backup', () => {
    backupDue(day(0));
    markBackup(day(20));
    expect(backupDue(day(30))).toBe(false);
    expect(daysSinceBackup(day(30))).toBe(10);
    expect(backupDue(day(34))).toBe(true);
  });

  it('ignores a corrupt stored value', () => {
    localStorage.setItem('vcs:v1:backup', '{nope');
    expect(backupDue(day(0))).toBe(false);
  });

  it('survives blocked storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(backupDue(day(0))).toBe(false);
    expect(() => markBackup(day(0))).not.toThrow();
  });
});
