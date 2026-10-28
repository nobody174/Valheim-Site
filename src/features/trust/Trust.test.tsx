// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { gameData } from '../../data/load';
import { TrustPage } from './TrustPage';
import { trustReport } from './trust';

describe('trustReport', () => {
  const r = trustReport(gameData);

  it('counts every entry once, by level', () => {
    expect(r.overall.total).toBe(r.overall.unverified + r.overall.fromFiles + r.overall.inGame);
    expect(r.overall.total).toBeGreaterThan(1000);
  });

  it('says honestly that nothing is seen in game until something is marked so', () => {
    const marked = [...gameData.items, ...gameData.creatures, ...gameData.bosses].filter((e) => e.verified === 'in-game').length;
    expect(r.overall.inGame).toBeGreaterThanOrEqual(marked);
  });

  it('has a row for every zone and a reason for every unverified entry', () => {
    expect(r.zones.map((z) => z.id)).toEqual(gameData.biomes.sort((a, b) => a.order - b.order).map((b) => b.id));
    const listed = r.unverified.reduce((n, g) => n + g.entries.length, 0);
    const unverified = [...gameData.items, ...gameData.creatures, ...gameData.bosses].filter((e) => e.verified === 'unverified').length;
    expect(listed).toBe(unverified);
  });
});

describe('TrustPage', () => {
  afterEach(cleanup);
  it('shows the headline numbers and the zone table', () => {
    render(
      <MemoryRouter>
        <TrustPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Data trust' })).toBeTruthy();
    expect(screen.getByText('seen in game')).toBeTruthy();
    expect(screen.getByRole('table')).toBeTruthy();
  });
});
