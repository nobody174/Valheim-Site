// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { lookup } from '../../data/lookup';
import { ArmorSetsPage } from './ArmorSetsPage';
import { armorSets } from './armorSets';

afterEach(cleanup);

describe('armor sets', () => {
  const sets = armorSets(lookup.allArmor());

  it('groups helmet, chest, legs and cape of one material', () => {
    const wolf = sets.find((s) => s.name === 'Wolf')!;
    expect(wolf.pieces.map((p) => p.item)).toEqual(['ArmorWolfChest', 'ArmorWolfLegs', 'CapeWolf']);
    expect(sets.find((s) => s.name === 'Ashlands Medium')!.pieces).toHaveLength(3);
    expect(sets.find((s) => s.name === 'Troll Leather')!.pieces).toHaveLength(4);
  });

  it('shows the whole-set total in raw materials', () => {
    render(
      <MemoryRouter>
        <ArmorSetsPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Wolf' })).toBeTruthy();
    expect(screen.getAllByText(/You need:/).length).toBe(sets.length);
  });
});
