// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ComfortPage } from './ComfortPage';
import { PiecePage } from './PiecePage';

afterEach(cleanup);

describe('comfort planner', () => {
  it('adds up one piece per ticked group and says what is unchecked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ComfortPage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Shelter .* sources disagree/)).toBeTruthy();
    await user.click(screen.getByLabelText('I have a Bed piece'));
    expect(screen.getByLabelText('Which Bed piece I have')).toHaveProperty('value', 'piece_bed02');
    await user.click(screen.getByLabelText('I have a Carpet piece'));
    expect(document.querySelector('[aria-live] strong')?.textContent).toBe('4');
    // Picking a weaker bed lowers the total; it never adds to it.
    await user.selectOptions(screen.getByLabelText('Which Bed piece I have'), 'bed');
    expect(document.querySelector('[aria-live] strong')?.textContent).toBe('3');
  });
});

describe('piece page', () => {
  it('shows make, comfort and group', () => {
    render(
      <MemoryRouter initialEntries={['/piece/piece_bed02']}>
        <Routes>
          <Route path="/piece/:id" element={<PiecePage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Dragon Bed')).toBeTruthy();
    expect(screen.getByText('Make')).toBeTruthy();
    expect(screen.getByText('+2')).toBeTruthy();
    expect(screen.getByText(/Bed: only the strongest counts/)).toBeTruthy();
  });
});
