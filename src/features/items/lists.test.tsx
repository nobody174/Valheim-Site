// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { ItemsPage } from './ItemsPage';
import { RecipesPage } from './RecipesPage';

afterEach(cleanup);

describe('recipes page', () => {
  it('lists recipes grouped by station and filters by ingredient', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/recipes']}>
        <RecipesPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Recipes' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /^Forge/ })).toBeTruthy();
    // The station name in each group heading links to the station page.
    const link = within(screen.getByRole('heading', { name: /^Forge/ })).getByRole('link');
    expect(link.getAttribute('href')).toBe('/station/forge');
    await user.type(screen.getByLabelText('Search'), 'carrot');
    expect(screen.getByText(/recipes?$/).textContent).toMatch(/^\d+ recipes?$/);
    expect(screen.getAllByRole('link', { name: 'Carrot Soup' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: 'Bronze Sword' })).toBeNull();
  });

  it('shows an empty state', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/recipes']}>
        <RecipesPage />
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText('Search'), 'zzzzqq');
    expect(screen.getByText(/No recipes match/)).toBeTruthy();
  });
});

describe('items page filters', () => {
  it('reads filters from the URL', () => {
    render(
      <MemoryRouter initialEntries={['/items?category=trophy']}>
        <ItemsPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Boar Trophy' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Bronze Sword' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeTruthy();
  });
});
