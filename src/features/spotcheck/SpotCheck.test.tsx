// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { confirmedChecks, gameData } from '../../data/load';
import { adoptProfileChecks, resetGameChecksCache } from '../../state/gameChecks';
import { initialState } from '../../state/model';
import { appStore } from '../../state/store';
import { SpotCheckPage } from './SpotCheckPage';
import { allRows, buildSpotChecks, rowsForEntity, rowStatus, staleConfirmations } from './spotcheck';

describe('buildSpotChecks', () => {
  const zones = buildSpotChecks(gameData);

  it('has a section for every zone, in order, with unique row keys', () => {
    expect(zones.map((z) => z.zone)).toEqual(gameData.biomes.sort((a, b) => a.order - b.order).map((b) => b.id));
    const keys = zones.flatMap((z) => z.groups.flatMap((g) => g.rows.map((r) => r.key)));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('gives the first zones real work to do: gear, recipes, food, creatures and the boss', () => {
    for (const z of zones.slice(0, 3)) {
      const ids = z.groups.map((g) => g.id);
      expect(ids, z.zone).toEqual(expect.arrayContaining(['gear', 'recipes', 'food', 'creatures', 'boss']));
    }
  });

  it('leaves out lines already confirmed in game', () => {
    const key = zones[0]!.groups[0]!.rows[0]!.key;
    const rest = buildSpotChecks(gameData, new Map([[key, null]]));
    expect(rest.flatMap((z) => z.groups.flatMap((g) => g.rows.map((r) => r.key)))).not.toContain(key);
  });

  it('says what the site says, so it can be compared with the game', () => {
    const meadows = zones[0]!;
    const boss = meadows.groups.find((g) => g.id === 'boss')!.rows[0]!;
    expect(boss.expect).toMatch(/summon with 2 Deer Trophy/);
  });
});

describe('confirmed lines', () => {
  it('are still the text that was confirmed: a changed line must be checked again, not left as seen', () => {
    expect(staleConfirmations(gameData, confirmedChecks)).toEqual([]);
  });

  it('come back as changed when the site now says something else, and are done when it matches', () => {
    const row = allRows(gameData).find((r) => r.key === 'gear:AxeFlint')!;
    expect(rowStatus(row, new Map([[row.key, row.expect]]))).toBe('confirmed');
    expect(rowStatus(row, new Map([[row.key, 'slash 1']]))).toBe('changed');
    expect(rowStatus(row, new Map())).toBe('open');
    expect(staleConfirmations(gameData, new Map([['gear:AxeFlint', 'slash 1'], ['gear:Nope', null]])).map((x) => x.key)).toEqual([
      'gear:AxeFlint',
      'gear:Nope',
    ]);
  });

  it('give an item its own lines: stats, recipe and where to find it', () => {
    const keys = rowsForEntity(gameData, 'AxeFlint').map((r) => r.key.split(':')[0]);
    expect(keys).toEqual(expect.arrayContaining(['gear', 'recipe']));
    expect(rowsForEntity(gameData, 'Wood').map((r) => r.key)).toContain('where:Wood');
  });
});

describe('SpotCheckPage', () => {
  beforeEach(() => {
    localStorage.clear();
    resetGameChecksCache();
    appStore.setState(initialState());
  });
  afterEach(cleanup);

  it('records Matches and Different for the whole browser and counts them', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SpotCheckPage />
      </MemoryRouter>,
    );
    const first = screen.getAllByRole('button', { name: 'Matches' })[0]!;
    await user.click(first);
    expect(Object.values(JSON.parse(localStorage.getItem('vcs:v1:gamechecks')!))).toEqual(['ok']);
    await user.click(screen.getAllByRole('button', { name: 'Different' })[1]!);
    expect(screen.getByText(/1 different/)).toBeTruthy();
    expect(within(document.body).getByText(/2 of/)).toBeTruthy();
  });

  it('clears a check when the same answer is pressed again', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SpotCheckPage />
      </MemoryRouter>,
    );
    const first = screen.getAllByRole('button', { name: 'Matches' })[0]!;
    await user.click(first);
    await user.click(first);
    expect(JSON.parse(localStorage.getItem('vcs:v1:gamechecks')!)).toEqual({});
  });

  it('takes in answers an earlier version kept in a profile, once', () => {
    const start = initialState();
    const profile = { ...start.profiles[start.active]!, checks: { 'gear:X': 'ok' as const } };
    adoptProfileChecks([profile]);
    expect(JSON.parse(localStorage.getItem('vcs:v1:gamechecks')!)).toEqual({ 'gear:X': 'ok' });
  });
});
