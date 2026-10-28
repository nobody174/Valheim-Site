// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { initialState } from '../../state/model';
import { appStore } from '../../state/store';
import { PlannerPage } from './PlannerPage';

beforeEach(() => appStore.setState(initialState()));
afterEach(cleanup);

const renderPage = (path = '/planner') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <PlannerPage />
    </MemoryRouter>,
  );

describe('planner page', () => {
  it('starts empty and explains how to begin', () => {
    renderPage();
    expect(screen.getByText(/Nothing planned yet/)).toBeTruthy();
  });

  it('adds an item from the item page link and lists materials by zone', () => {
    renderPage('/planner?add=SwordBronze');
    expect(screen.getByRole('heading', { name: 'Shopping list' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Meadows' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Black Forest' })).toBeTruthy();
    expect(screen.getByText('Stations you need').closest('section')!.textContent).toContain('Forge');
  });

  it('subtracts the inventory and remembers it in the profile', async () => {
    const user = userEvent.setup();
    renderPage('/planner?add=SwordBronze');
    const have = screen.getByLabelText('You have of Wood');
    await user.clear(have);
    await user.type(have, '100');
    const profile = appStore.getState().profiles[appStore.getState().active]!;
    expect(profile.inventory.Wood).toBe(100);
    const row = screen.getByLabelText('You have of Wood').closest('tr')!;
    expect(within(row).getAllByRole('cell')[4]!.textContent).toBe('0');
  });

  it('keeps ticks and the plan per profile', async () => {
    const user = userEvent.setup();
    renderPage('/planner?add=SwordBronze');
    await user.click(screen.getByLabelText('Got Wood'));
    const profile = appStore.getState().profiles[appStore.getState().active]!;
    expect(profile.planner?.ticked).toContain('Wood');
    expect(profile.planner?.targets[0]?.item).toBe('SwordBronze');
  });
});
