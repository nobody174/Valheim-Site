// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { initialState } from '../../state/model';
import { appStore } from '../../state/store';
import { RankingsPage } from './RankingsPage';

beforeEach(() => appStore.setState(initialState()));
afterEach(cleanup);

function renderPage(path = '/rankings') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <RankingsPage />
    </MemoryRouter>,
  );
}

/** Weapon names in the order the table shows them. */
const names = () =>
  within(screen.getAllByRole('table')[0]!)
    .getAllByRole('row')
    .slice(1)
    .map((r) => within(r).getAllByRole('cell')[1]!.querySelector('a')!.textContent);

describe('weapon rankings page', () => {
  it('lists the strongest weapon first', () => {
    renderPage();
    expect(names()[0]).toBe('Battleaxe');
    expect(screen.getByText(/DPS ≈ is an estimate/)).toBeTruthy();
  });

  it('shows the best weapon for a zone, including earlier zones by default', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.selectOptions(screen.getByLabelText('Zone'), 'meadows');
    const meadows = names();
    expect(meadows.length).toBeGreaterThan(0);
    expect(meadows).not.toContain('Bronze Atgeir');
    await user.selectOptions(screen.getByLabelText('Zone'), 'blackforest');
    expect(names()).toContain('Bronze Atgeir');
    expect(names()).toContain('Flint Axe');
    await user.click(screen.getByLabelText(/Include earlier zones/));
    expect(names()).not.toContain('Flint Axe');
  });

  it('re-sorts when a column header is clicked, and flips on a second click', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /^Weapon/ }));
    const asc = names();
    expect(asc).toEqual([...asc].sort((a, b) => a!.localeCompare(b!)));
    await user.click(screen.getByRole('button', { name: /^Weapon/ }));
    expect(names()).toEqual([...asc].reverse());
  });

  it('can group the best weapons by zone', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.selectOptions(screen.getByLabelText('Show'), 'zones');
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings[0]).toMatch(/Meadows/);
    expect(headings[1]).toMatch(/Black Forest/);
  });

  it('raises the damage with the upgrade level', async () => {
    const user = userEvent.setup();
    renderPage('/rankings?q=bronze%20sword');
    expect(screen.getByRole('cell', { name: '35' })).toBeTruthy();
    await user.selectOptions(screen.getByLabelText('Upgrade level'), '4');
    expect(screen.getByRole('cell', { name: '53' })).toBeTruthy();
  });

  it('shows the estimate columns and how they are calculated', () => {
    renderPage('/rankings?q=bronze%20sword');
    expect(screen.getByRole('columnheader', { name: /DPS ≈/ })).toBeTruthy();
    expect(screen.getByRole('cell', { name: '140' })).toBeTruthy(); // damage per combo
    expect(screen.getByText('How these numbers are calculated')).toBeTruthy();
  });

  it("applies a creature's resistances", async () => {
    const user = userEvent.setup();
    renderPage('/rankings?q=club');
    expect(screen.getByRole('cell', { name: '12' })).toBeTruthy();
    await user.selectOptions(screen.getByLabelText('Against'), 'Troll');
    expect(screen.getByRole('cell', { name: '6' })).toBeTruthy();
  });

  it('lets the rating weights be changed', async () => {
    const user = userEvent.setup();
    renderPage();
    const ratings = () =>
      within(screen.getAllByRole('table')[0]!)
        .getAllByRole('row')
        .slice(1)
        .map((r) => within(r).getAllByRole('cell')[8]!.textContent);
    const before = ratings();
    const input = screen.getByLabelText(/Damage per second \(estimate\)/);
    await user.clear(input);
    await user.type(input, '0');
    expect(ratings()).not.toEqual(before);
  });

  it('switches to the armor tab', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('tab', { name: 'Armor' }));
    expect(screen.getByRole('button', { name: 'Tank' })).toBeTruthy();
    expect(screen.getByText(/Armor pieces side by side/)).toBeTruthy();
  });

  it('says so when nothing matches', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Name'), 'zzzz');
    expect(screen.getByText(/No weapons match/)).toBeTruthy();
  });
});

describe('weapon skill', () => {
  it('scales damage and shows the range', () => {
    renderPage('/rankings?q=bronze%20axe&skill=100');
    expect(screen.getByRole('cell', { name: /^37 ?\(34-40\)$/ })).toBeTruthy(); // 40 * 0.925
  });
});
