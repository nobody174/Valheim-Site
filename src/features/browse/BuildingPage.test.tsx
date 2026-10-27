// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { lookup } from '../../data/lookup';
import { initialState } from '../../state/model';
import { appStore } from '../../state/store';
import { BuildingPage } from './BuildingPage';

beforeEach(() => appStore.setState(initialState()));
afterEach(cleanup);

const renderPage = (path = '/building') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <BuildingPage />
    </MemoryRouter>,
  );
const rows = () => within(screen.getAllByRole('table')[0]!).getAllByRole('row').slice(1);

describe('building page', () => {
  it('lists every piece in the data with its cost', () => {
    renderPage();
    expect(rows()).toHaveLength(lookup.allPieces().length);
    expect(screen.getAllByText('Bed').length).toBeGreaterThan(0);
  });

  it('filters by category and by name, and says so when nothing matches', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.selectOptions(screen.getByLabelText('Category'), 'Furniture');
    const furniture = lookup.allPieces().filter((p) => p.category === 'Furniture').length;
    expect(rows()).toHaveLength(furniture);
    await user.type(screen.getByLabelText('Name'), 'zzzz');
    expect(screen.getByText(/No pieces match/)).toBeTruthy();
  });

  it('never lists a workbench extension or a station (they have their own pages)', () => {
    const ids = lookup.allPieces().map((p) => p.id);
    const extensions = lookup.allStations().flatMap((s) => s.extensions.map((e) => e.id));
    for (const id of [...extensions, ...lookup.allStations().map((s) => s.id)]) {
      expect(ids).not.toContain(id);
    }
  });
});
