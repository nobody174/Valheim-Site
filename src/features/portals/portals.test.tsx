// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { gameData } from '../../data/load';
import { emptyProfile, initialState, withPortal, withoutPortal, type Portal } from '../../state/model';
import { appStore } from '../../state/store';
import { PortalsPage } from './PortalsPage';
import { caseClashes, linkStates } from './portals';

const portal = (id: string, name: string, down = false): Portal => ({ id, name, from: 'A', to: 'B', note: '', down });

describe('linkStates', () => {
  it('links exactly two standing portals with the same name', () => {
    const s = linkStates([portal('1', 'boat'), portal('2', 'boat'), portal('3', 'mountain')]);
    expect(s.get('1')).toBe('linked');
    expect(s.get('2')).toBe('linked');
    expect(s.get('3')).toBe('alone');
  });

  it('switches three with one name off, and ignores a portal that is down', () => {
    const three = linkStates([portal('1', 'x'), portal('2', 'x'), portal('3', 'x')]);
    expect([...three.values()]).toEqual(['crowded', 'crowded', 'crowded']); // the game pairs two; which two is random
    const down = linkStates([portal('1', 'x'), portal('2', 'x', true)]);
    expect(down.get('1')).toBe('alone');
    expect(down.get('2')).toBe('down');
  });

  it('finds names that differ only in capitals', () => {
    expect(caseClashes([portal('1', 'Home'), portal('2', 'home'), portal('3', 'boat')])).toEqual(['Home / home']);
  });
});

describe('portal edits', () => {
  it('adds, replaces by id, trims, and removes; blank names are ignored', () => {
    let p = emptyProfile('p', 'P');
    p = withPortal(p, portal('1', '  boat  '));
    p = withPortal(p, { ...portal('1', 'boat'), to: 'Island base' });
    p = withPortal(p, portal('2', '   '));
    expect(p.portals).toEqual([{ id: '1', name: 'boat', from: 'A', to: 'Island base', note: '', down: false }]);
    expect(withoutPortal(p, '1').portals).toEqual([]);
  });
});

describe('PortalsPage', () => {
  beforeEach(() => appStore.setState(initialState()));
  afterEach(cleanup);

  it('saves a portal to the active profile and lists items that cannot be ported', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <PortalsPage />
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText(/Name on the portal/), 'boat');
    await user.type(screen.getByLabelText('To'), 'Island base');
    await user.click(screen.getByRole('button', { name: 'Add portal' }));
    const state = appStore.getState();
    expect(state.profiles[state.active]!.portals?.[0]).toMatchObject({ name: 'boat', to: 'Island base' });
    expect(screen.getByText(/No other portal has this exact name/)).toBeTruthy();
    expect(gameData.items.some((i) => i.portalBlocked)).toBe(true);
  });
});
