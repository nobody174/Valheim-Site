// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { lookup } from '../../data/lookup';
import { CreaturePage, StationPage } from './EntityPage';
import { ItemPage } from './ItemPage';

afterEach(cleanup);

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/item/:id" element={<ItemPage />} />
        <Route path="/creature/:id" element={<CreaturePage />} />
        <Route path="/boss/:id" element={<CreaturePage boss />} />
        <Route path="/station/:id" element={<StationPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('item page', () => {
  it('renders a material with sources and uses', () => {
    renderAt('/item/Wood');
    expect(screen.getByRole('heading', { level: 1, name: 'Wood' })).toBeTruthy();
    expect(screen.getByText(/Gathered from/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Used in' })).toBeTruthy();
  });

  it('renders a weapon with stats and a recipe', () => {
    renderAt('/item/SwordBronze');
    expect(screen.getByRole('heading', { level: 1, name: 'Bronze Sword' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Stats' })).toBeTruthy();
    expect(screen.getByText(/Slash 35/)).toBeTruthy();
    const crafted = screen.getByRole('heading', { name: 'Crafted from' }).parentElement!;
    expect(within(crafted).getAllByRole('link', { name: 'Bronze' }).length).toBeGreaterThan(0);
    expect(within(crafted).getByRole('link', { name: 'Forge' })).toBeTruthy();
  });

  it('renders a food with its numbers', () => {
    renderAt('/item/CookedMeat');
    expect(screen.getByRole('heading', { name: 'Stats' })).toBeTruthy();
    expect(screen.getByText('Health')).toBeTruthy();
    expect(screen.getByText('Duration')).toBeTruthy();
  });

  it('renders a trophy linking to its creature', () => {
    renderAt('/item/TrophyBoar');
    expect(screen.getByRole('heading', { level: 1, name: 'Boar Trophy' })).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'Boar' }).length).toBeGreaterThan(0);
  });

  it('marks unverified data visibly', () => {
    renderAt('/item/Wood');
    expect(screen.getAllByText('Unverified').length).toBeGreaterThan(0);
  });

  it('handles an unknown id', () => {
    renderAt('/item/Nope');
    expect(screen.getByRole('heading', { name: 'Unknown item' })).toBeTruthy();
  });
});

describe('link integrity', () => {
  const targets: Record<string, (id: string) => unknown> = {
    item: lookup.item,
    creature: lookup.creature,
    boss: lookup.boss,
    station: lookup.station,
  };

  function brokenLinks(path: string): string[] {
    const { container } = renderAt(path);
    const broken: string[] = [];
    for (const a of container.querySelectorAll('a')) {
      const [, kind, id] = (a.getAttribute('href') ?? '').split('/');
      if (!targets[kind]?.(decodeURIComponent(id)))
        broken.push(`${path} -> ${a.getAttribute('href')}`);
    }
    cleanup();
    return broken;
  }

  it('every link on every item page resolves to a page', () => {
    const broken = lookup.allItems().flatMap((i) => brokenLinks(`/item/${i.id}`));
    expect(broken).toEqual([]);
  });

  it('every link on creature, boss and station pages resolves', () => {
    const paths = [
      ...['Boar', 'Greydwarf', 'Troll'].map((id) => `/creature/${id}`),
      ...['Eikthyr', 'gd_king'].map((id) => `/boss/${id}`),
      ...['forge', 'piece_workbench', 'piece_cauldron'].map((id) => `/station/${id}`),
    ];
    expect(paths.flatMap(brokenLinks)).toEqual([]);
  });
});
