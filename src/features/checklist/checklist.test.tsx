// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { initialState, hasFlag } from '../../state/model';
import { appStore } from '../../state/store';
import { ItemPage } from '../items/ItemPage';
import { ProfilePage } from '../profile/ProfilePage';
import { ChecklistPage } from './ChecklistPage';
import { FavoritesPage } from './FavoritesPage';

beforeEach(() => appStore.setState(initialState()));
afterEach(cleanup);

const profile = () => appStore.getState().profiles[appStore.getState().active];

describe('checklist', () => {
  it('toggles a flag and shows biome progress', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ChecklistPage />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('checkbox', { name: 'Collected: Wood' }));
    expect(hasFlag(profile(), 'Wood', 'collected')).toBe(true);
    const bar = screen.getByRole('progressbar', { name: 'Meadows collected' });
    expect(bar.getAttribute('aria-valuenow')).toBe('1');
  });

  it('filters by status', async () => {
    const user = userEvent.setup();
    appStore.getState().toggleFlag('Wood', 'collected');
    render(
      <MemoryRouter initialEntries={['/checklist?status=collected:yes']}>
        <ChecklistPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('checkbox', { name: 'Collected: Wood' })).toBeTruthy();
    expect(screen.queryByRole('checkbox', { name: 'Collected: Stone' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByRole('checkbox', { name: 'Collected: Stone' })).toBeTruthy();
  });
});

describe('item actions', () => {
  function renderItem(id: string) {
    return render(
      <MemoryRouter initialEntries={[`/item/${id}`]}>
        <Routes>
          <Route path="/item/:id" element={<ItemPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('stars an item by category and lists it under favorites', async () => {
    const user = userEvent.setup();
    renderItem('SwordBronze');
    await user.click(screen.getByRole('button', { name: /Add to favorites: Bronze Sword/ }));
    expect(profile().favorites.gear).toEqual(['SwordBronze']);
    cleanup();
    render(
      <MemoryRouter initialEntries={['/favorites']}>
        <FavoritesPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Bronze Sword' })).toBeTruthy();
  });

  it('overrides the hoard category and resets it', async () => {
    const user = userEvent.setup();
    renderItem('Wood');
    await user.selectOptions(screen.getByLabelText('Hoard category'), 'sell');
    expect(profile().hoardOverrides.Wood).toBe('sell');
    expect(screen.getAllByText(/custom/).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Reset to default' }));
    expect(profile().hoardOverrides.Wood).toBeUndefined();
  });

  it('keeps progress separate per profile', async () => {
    const user = userEvent.setup();
    renderItem('Wood');
    await user.click(screen.getByRole('button', { name: 'Collected' }));
    expect(hasFlag(profile(), 'Wood', 'collected')).toBe(true);
    appStore.getState().createProfile('Second');
    cleanup();
    renderItem('Wood');
    expect(screen.getByRole('button', { name: 'Collected' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
  });
});

describe('profile page', () => {
  it('creates, renames-guards and deletes profiles', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull(); // last profile
    await user.type(screen.getByLabelText('New profile name'), 'Hardcore');
    await user.click(screen.getByRole('button', { name: 'Add profile' }));
    expect(appStore.getState().order).toHaveLength(2);
    const rows = screen.getAllByRole('listitem');
    await user.click(within(rows[1]).getByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }));
    expect(appStore.getState().order).toHaveLength(1);
  });

  it('shows a clear error for a bad import file and applies a good one', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, new File(['not json'], 'bad.json', { type: 'application/json' }));
    expect((await screen.findByRole('status')).textContent).toMatch(/not valid JSON/);

    appStore.getState().toggleFlag('Wood', 'collected');
    const good = JSON.stringify({
      app: 'valheim-companion',
      exportVersion: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      active: appStore.getState().active,
      profiles: [profile()],
    });
    appStore.setState(initialState()); // wipe
    await user.upload(input, new File([good], 'ok.json', { type: 'application/json' }));
    await user.click(await screen.findByRole('button', { name: 'Replace everything' }));
    expect(hasFlag(profile(), 'Wood', 'collected')).toBe(true);
  });
});
