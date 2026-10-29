// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getGameChecks, importGameChecks, resetGameChecksCache, setGameCheck } from './gameChecks';
import { buildExport, initialState, parseImport } from './model';

beforeEach(() => {
  localStorage.clear();
  resetGameChecksCache();
});
afterEach(() => localStorage.clear());

describe('Check in game answers in a backup', () => {
  it('are written to the backup file and read back', () => {
    setGameCheck('gear:AxeFlint', 'ok');
    const text = JSON.stringify(buildExport(initialState(), new Date(), getGameChecks()));
    const parsed = parseImport(text);
    expect(parsed.ok && parsed.data.gameChecks).toEqual({ 'gear:AxeFlint': 'ok' });
  });

  it('leave the field out when there are none, so old backups and new ones look alike', () => {
    expect(buildExport(initialState())).not.toHaveProperty('gameChecks');
  });

  it('replace or merge on import', () => {
    setGameCheck('a', 'ok');
    importGameChecks({ a: 'bad', b: 'ok' }, 'merge');
    expect(getGameChecks()).toEqual({ a: 'ok', b: 'ok' });
    importGameChecks({ c: 'bad' }, 'replace');
    expect(getGameChecks()).toEqual({ c: 'bad' });
    importGameChecks(undefined, 'replace');
    expect(getGameChecks()).toEqual({ c: 'bad' });
  });
});
