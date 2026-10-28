// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { gameData } from '../../data/load';
import { initialState, withCheck } from '../../state/model';
import { appStore } from '../../state/store';
import { SpotCheckPage } from './SpotCheckPage';
import { buildSpotChecks } from './spotcheck';

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

  it('says what the site says, so it can be compared with the game', () => {
    const meadows = zones[0]!;
    const boss = meadows.groups.find((g) => g.id === 'boss')!.rows[0]!;
    expect(boss.expect).toMatch(/summon with 2 Deer Trophy/);
  });
});

describe('SpotCheckPage', () => {
  beforeEach(() => appStore.setState(initialState()));
  afterEach(cleanup);

  it('records Matches and Different in the profile and counts them', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SpotCheckPage />
      </MemoryRouter>,
    );
    const first = screen.getAllByRole('button', { name: 'Matches' })[0]!;
    await user.click(first);
    const state = appStore.getState();
    expect(Object.values(state.profiles[state.active]!.checks ?? {})).toEqual(['ok']);
    await user.click(screen.getAllByRole('button', { name: 'Different' })[1]!);
    expect(screen.getByText(/1 different/)).toBeTruthy();
    expect(within(document.body).getByText(/2 of/)).toBeTruthy();
  });

  it('clears a check when the same answer is pressed again', () => {
    const start = initialState();
    const p = withCheck(withCheck(start.profiles[start.active]!, 'a', 'ok'), 'a', 'ok');
    expect(p.checks).toEqual({});
  });
});
