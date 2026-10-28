// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { lookup } from '../../data/lookup';
import { SearchPage } from './SearchPage';

afterEach(cleanup);

function renderLanding() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/station/:id" element={<p>station page</p>} />
        <Route path="/item/:id" element={<p>item page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('landing search keyboard', () => {
  it('opens the first result on Enter', async () => {
    const user = userEvent.setup();
    renderLanding();
    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'forge{Enter}');
    expect(screen.getByText('station page')).toBeTruthy();
  });

  it('moves the highlight with the arrow keys before Enter', async () => {
    const user = userEvent.setup();
    renderLanding();
    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'bronze');
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(1);
    expect(options[0]?.getAttribute('aria-selected')).toBe('true');
    await user.keyboard('{ArrowDown}');
    expect(screen.getAllByRole('option')[1]?.getAttribute('aria-selected')).toBe('true');
    await user.keyboard('{Enter}');
    expect(screen.getByText('item page')).toBeTruthy();
  });

  it('does nothing on Enter when there are no results', async () => {
    const user = userEvent.setup();
    renderLanding();
    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'zzzqqq{Enter}');
    expect(screen.getByText(/No results for/)).toBeTruthy();
  });
});

describe('home page zones and tools', () => {
  it('shows a card per zone with progress, and links to the tools', () => {
    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>,
    );
    for (const b of lookup.allBiomes()) {
      expect(screen.getByRole('link', { name: new RegExp(b.name) })).toBeTruthy();
    }
    expect(screen.getAllByRole('progressbar').length).toBe(lookup.allBiomes().length);
    expect(screen.getByRole('link', { name: /Build planner/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Crafting graph/ })).toBeTruthy();
  });
});
