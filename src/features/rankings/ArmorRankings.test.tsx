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

const renderArmor = (query = '') =>
  render(
    <MemoryRouter initialEntries={[`/rankings?tab=armor${query}`]}>
      <RankingsPage />
    </MemoryRouter>,
  );

const pieces = () =>
  within(screen.getAllByRole('table')[0]!)
    .getAllByRole('row')
    .slice(1)
    .map((r) => within(r).getAllByRole('cell')[1]!.querySelector('a')!.textContent);

describe('armor rankings page', () => {
  it('lists the highest armor first', () => {
    renderArmor();
    const first = pieces()[0]!;
    expect(first).not.toMatch(/Rag|Leather/);
  });

  it('applies a preset, shows its rule, and toggles it off', async () => {
    const user = userEvent.setup();
    renderArmor();
    const all = pieces();
    await user.click(screen.getByRole('button', { name: 'Exploration' }));
    // The rule shows next to the buttons (and again in the "how it works" notes).
    expect(screen.getAllByText(/do not slow you down/).length).toBeGreaterThan(0);
    expect(pieces().length).toBeLessThan(all.length);
    expect(screen.getByRole('button', { name: 'Exploration' }).getAttribute('aria-pressed')).toBe('true');
    await user.click(screen.getByRole('button', { name: 'Exploration' }));
    expect(pieces()).toEqual(all);
  });

  it('clicking a column header replaces the preset with that sort', async () => {
    const user = userEvent.setup();
    renderArmor('&preset=light');
    await user.click(screen.getByRole('button', { name: /^Piece/ }));
    expect(screen.getByRole('button', { name: 'Light' }).getAttribute('aria-pressed')).toBe('false');
    const names = pieces();
    expect(names).toEqual([...names].sort((a, b) => a!.localeCompare(b!)));
  });

  it('raises armor and upgrade cost with the upgrade level', async () => {
    const user = userEvent.setup();
    renderArmor('&q=bronze%20plate%20tunic');
    expect(pieces()).toEqual(['Bronze Plate Tunic']);
    const cells = () => within(screen.getAllByRole('table')[0]!).getAllByRole('cell').map((c) => c.textContent);
    expect(cells()).toContain('8');
    await user.selectOptions(screen.getByLabelText('Upgrade level'), '4');
    expect(cells()).toContain('14'); // 8 + 2 * 3
    expect(cells()).toContain('33'); // 8 + 11 + 14 items to upgrade
  });

  it('can be limited to a zone and slot, and says so when nothing matches', async () => {
    const user = userEvent.setup();
    renderArmor();
    await user.selectOptions(screen.getByLabelText('Slot'), 'cape');
    expect(pieces().every((p) => /Cape/.test(p ?? ''))).toBe(true);
    await user.type(screen.getByLabelText('Name'), 'zzzz');
    expect(screen.getByText(/No armor matches/)).toBeTruthy();
  });
});
