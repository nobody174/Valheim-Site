// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { lookup } from '../../data/lookup';
import { initialState } from '../../state/model';
import { appStore } from '../../state/store';
import { BossesPage, CreaturesPage, FoodPage, TrophiesPage } from './BrowsePages';

beforeEach(() => appStore.setState(initialState()));
afterEach(cleanup);

const renderAt = (ui: React.ReactElement, path: string) =>
  render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);

const bodyRows = () => within(screen.getAllByRole('table')[0]!).getAllByRole('row').slice(1);
const firstCells = () => bodyRows().map((r) => within(r).getAllByRole('cell')[0]!.textContent);

describe('browse pages', () => {
  it('lists every trophy with where it drops', () => {
    renderAt(<TrophiesPage />, '/trophies');
    expect(bodyRows()).toHaveLength(lookup.allTrophies().length);
    expect(screen.getByText('Boar')).toBeTruthy();
  });

  it('filters trophies by name and says so when nothing matches', async () => {
    const user = userEvent.setup();
    renderAt(<TrophiesPage />, '/trophies');
    await user.type(screen.getByLabelText('Name'), 'zzzz');
    expect(screen.getByText(/No trophies match/)).toBeTruthy();
  });

  it('lists bosses in zone order with their summon items', () => {
    renderAt(<BossesPage />, '/bosses');
    expect(firstCells()).toHaveLength(lookup.allBosses().length);
    expect(firstCells()[0]).toMatch(/Eikthyr/);
  });

  it('lists creatures and filters by zone', async () => {
    const user = userEvent.setup();
    renderAt(<CreaturesPage />, '/creatures');
    const all = bodyRows().length;
    expect(all).toBe(lookup.allCreatures().length);
    await user.selectOptions(screen.getByLabelText('Zone'), 'meadows');
    expect(bodyRows().length).toBeLessThan(all);
  });

  it('sorts food by a column and flips on a second click', async () => {
    const user = userEvent.setup();
    renderAt(<FoodPage />, '/food');
    const health = () =>
      bodyRows().map((r) => Number(within(r).getAllByRole('cell')[1]!.textContent));
    await user.click(screen.getByRole('button', { name: /^Health/ }));
    const desc = health();
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
    await user.click(screen.getByRole('button', { name: /^Health/ }));
    expect(health()).toEqual([...desc].sort((a, b) => a - b));
  });

  it('filters food by type', async () => {
    const user = userEvent.setup();
    renderAt(<FoodPage />, '/food');
    await user.selectOptions(screen.getByLabelText('Type'), 'mead');
    expect(bodyRows().length).toBe(lookup.allFoods().filter((f) => f.kind === 'mead').length);
  });
});
