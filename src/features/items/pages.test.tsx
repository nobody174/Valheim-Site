// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('puts the recipe and where to get it before the progress block, and ids in a folded Details', () => {
    renderAt('/item/SwordBronze');
    const order = (name: string | RegExp) =>
      screen.getByRole('heading', { name }).compareDocumentPosition(
        screen.getByRole('heading', { name: /Your progress/ }),
      );
    expect(order('Crafted from') & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const details = screen.getByText('Internal id').closest('details')!;
    expect(details.open).toBe(false);
    expect(within(details).getByText('SwordBronze')).toBeTruthy();
  });

  it('tags hand-written sources and summon costs, not values read from the game files', () => {
    renderAt('/item/Wood');
    expect(screen.getAllByText('guide, not checked').length).toBeGreaterThan(0);
    cleanup();
    renderAt('/boss/Dragon');
    expect(screen.queryAllByText('guide, not checked')).toHaveLength(0);
    cleanup();
    renderAt('/item/SwordBronze');
    expect(screen.queryAllByText('guide, not checked')).toHaveLength(0);
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
      const href = a.getAttribute('href') ?? '';
      if (href.startsWith('/planner') || href.startsWith('/upgrades') || href.startsWith('/compare') || href.startsWith('/graph') || href.startsWith('/skills')) continue; // tool pages
      const [, kind, id] = href.split('/');
      if (!targets[kind]?.(decodeURIComponent(id)))
        broken.push(`${path} -> ${a.getAttribute('href')}`);
    }
    cleanup();
    return broken;
  }

  it('every link on every item page resolves to a page', () => {
    const broken = lookup.allItems().flatMap((i) => brokenLinks(`/item/${i.id}`));
    expect(broken).toEqual([]);
  }, 30_000);

  it('every link on creature, boss and station pages resolves', () => {
    const paths = [
      ...['Boar', 'Greydwarf', 'Troll'].map((id) => `/creature/${id}`),
      ...['Eikthyr', 'gd_king'].map((id) => `/boss/${id}`),
      ...['forge', 'piece_workbench', 'piece_cauldron'].map((id) => `/station/${id}`),
    ];
    expect(paths.flatMap(brokenLinks)).toEqual([]);
  });
});

describe('new data on pages', () => {
  it('station page shows how to get it and its extensions', () => {
    renderAt('/station/piece_workbench');
    expect(screen.getByRole('heading', { name: 'How to get it' })).toBeTruthy();
    expect(screen.getByText('Build cost:')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Extensions' })).toBeTruthy();
  });

  it('station page names the zones the materials come from and links each material', () => {
    renderAt('/station/piece_cauldron');
    const section = screen.getByRole('heading', { name: 'How to get it' }).closest('section')!;
    expect(within(section).getByText(/Materials come from:/)).toBeTruthy();
    expect(within(section).getAllByRole('link').length).toBeGreaterThan(0);
  });

  it('creature page shows attacks and resistances', () => {
    renderAt('/creature/Troll');
    expect(screen.getByRole('heading', { name: 'Attacks' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Weaknesses and resistances' })).toBeTruthy();
    expect(screen.getByText('Pierce')).toBeTruthy();
  });

  it('armor shows set bonus and movement change', () => {
    renderAt('/item/ArmorTrollLeatherChest');
    expect(screen.getByText('Set bonus')).toBeTruthy();
    expect(screen.getByText(/4 pieces/)).toBeTruthy();
  });

  it('a mead shows its effect and a conversion recipe shows its time', () => {
    renderAt('/item/MeadHealthMinor');
    expect(screen.getByText('Effect')).toBeTruthy();
    expect(screen.getByText(/Ferments into/)).toBeTruthy();
  });
});

describe('item notes on the page', () => {
  it('lets the player write a note that is kept for the profile', async () => {
    const user = userEvent.setup();
    renderAt('/item/Wood');
    const box = screen.getByLabelText('My note');
    await user.type(box, 'chest by the portal');
    expect((box as HTMLTextAreaElement).value).toBe('chest by the portal');
  });
});
