// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { places } from '../../data/load';
import { lookup } from '../../data/lookup';
import { PlacesPage } from './PlacesPage';

describe('places data', () => {
  it('has unique ids and only known zones and bosses', () => {
    const zones = new Set(lookup.allBiomes().map((b) => b.id));
    expect(new Set(places.map((p) => p.id)).size).toBe(places.length);
    for (const p of places) {
      for (const z of p.zones) expect(zones.has(z), `${p.id}: ${z}`).toBe(true);
      if (p.boss) expect(lookup.boss(p.boss), `${p.id}: ${p.boss}`).toBeTruthy();
    }
  });

  it('has the dungeons a player looks for, in the right zones', () => {
    const by = new Map(places.map((p) => [p.id, p]));
    expect(by.get('Crypt')?.zones).toEqual(['blackforest']);
    expect(by.get('SunkenCrypt')?.zones).toEqual(['swamp']);
    expect(by.get('TrollCave')?.name).toBe('Troll Cave');
    expect(by.get('MountainCave')?.name).toBe('Frost Cave');
  });
});

describe('PlacesPage', () => {
  afterEach(cleanup);

  it('filters by zone and kind and tags guide notes', async () => {
    render(
      <MemoryRouter>
        <PlacesPage />
      </MemoryRouter>,
    );
    const user = userEvent.setup();
    const [zoneSelect, kindSelect] = screen.getAllByRole('combobox');
    await user.selectOptions(zoneSelect!, 'swamp');
    await user.selectOptions(kindSelect!, 'dungeon');
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(1);
    expect(within(rows[0]!).getByText('Sunken Crypt')).toBeTruthy();
    expect(within(rows[0]!).getByText('guide, not checked')).toBeTruthy();
  });
});
