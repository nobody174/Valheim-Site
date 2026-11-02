// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { lookup } from '../../data/lookup';
import { FoodOptimizerPage } from './FoodOptimizerPage';
import { rawFoodIds } from './foodOptimizer';

afterEach(cleanup);

const renderPage = (path = '/optimizer') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <FoodOptimizerPage />
    </MemoryRouter>,
  );

const comboCount = () =>
  screen.getAllByRole('listitem').filter((li) => li.textContent?.includes('Health')).length;

describe('food optimizer page', () => {
  it('lists five sets of three foods by default', () => {
    renderPage();
    expect(comboCount()).toBe(5);
    expect(screen.getByText(/Rule: Highest total health/)).toBeTruthy();
  });

  it('starts at the zone you have reached', () => {
    renderPage();
    expect((screen.getByLabelText('Foods up to') as HTMLSelectElement).value).toBe('meadows');
  });

  it('changes the rule with the goal and limits foods by zone', async () => {
    const user = userEvent.setup();
    renderPage('/optimizer?zone=all');
    const all = Number(screen.getByText(/foods considered/).textContent!.match(/(\d+) foods/)![1]);
    await user.selectOptions(screen.getByLabelText('Goal'), 'balanced');
    expect(screen.getByText(/Rule: The smaller of/)).toBeTruthy();
    await user.selectOptions(screen.getByLabelText('Foods up to'), 'meadows');
    const early = Number(
      screen.getByText(/foods considered/).textContent!.match(/(\d+) foods/)![1],
    );
    expect(early).toBeLessThan(all);
    const raw = rawFoodIds(lookup.allRecipes());
    expect(early).toBe(
      lookup
        .allFoods()
        .filter(
          (f) => f.kind === 'food' && !raw.has(f.item) && lookup.item(f.item)?.biome === 'meadows',
        ).length,
    );
    expect(raw).toContain('RawMeat');
    expect(raw).toContain('DeerMeat');
  });

  it('says so when there are not enough foods', () => {
    renderPage('/optimizer?min=40');
    expect(screen.getByText(/Not enough foods/)).toBeTruthy();
  });
});
