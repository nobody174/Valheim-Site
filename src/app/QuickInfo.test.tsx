// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { appStore } from '../state/store';
import { QuickInfo } from './QuickInfo';

const show = () =>
  render(
    <MemoryRouter>
      <QuickInfo />
    </MemoryRouter>,
  );

describe('QuickInfo', () => {
  afterEach(() => {
    cleanup();
    for (const p of appStore.getState().profiles[appStore.getState().active].portals ?? [])
      appStore.getState().removePortal(p.id);
  });

  it('says what to do when there are no portals', () => {
    show();
    expect(screen.getByText(/None yet/)).toBeTruthy();
  });

  it('lists each portal alphabetically with where it goes, and names the start only when it differs', () => {
    const { savePortal } = appStore.getState();
    savePortal({
      id: '1',
      name: 'portal 2',
      from: 'Home Base',
      to: 'Mountain',
      note: '',
      down: false,
    });
    savePortal({
      id: '2',
      name: 'boat',
      from: 'Home Base',
      to: 'Island Base',
      note: '',
      down: false,
    });
    savePortal({
      id: '3',
      name: 'portal 3',
      from: 'Home Base',
      to: 'Hildir’s Store',
      note: '',
      down: true,
    });
    savePortal({ id: '4', name: 'far', from: 'Island Base', to: 'Swamp', note: '', down: false });
    show();
    const items = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(items).toEqual([
      'boat → Island Base',
      'far → Swamp (from Island Base)',
      'portal 2 → Mountain',
      'portal 3 → Hildir’s Store · down',
    ]);
  });
});
