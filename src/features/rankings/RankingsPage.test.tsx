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
    expect(names()[0]).toBe('Bronze Atgeir');
    expect(screen.getByText(/not damage per second/i)).toBeTruthy();
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

  it('says so when nothing matches', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Name'), 'zzzz');
    expect(screen.getByText(/No weapons match/)).toBeTruthy();
  });
});
