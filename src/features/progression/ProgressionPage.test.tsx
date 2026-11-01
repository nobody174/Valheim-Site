// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { initialState } from '../../state/model';
import { appStore } from '../../state/store';
import { ProgressionPage } from './ProgressionPage';

beforeEach(() => appStore.setState(initialState()));
afterEach(cleanup);

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/progression/meadows']}>
      <Routes>
        <Route path="/progression/:biome" element={<ProgressionPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('progression page ticks', () => {
  it('ticks one item, and every item in a list at once', async () => {
    const user = userEvent.setup();
    renderPage();
    const boxes = () =>
      screen.getAllByRole('checkbox', { name: /^Collected:/ }) as HTMLInputElement[];
    expect(boxes().every((b) => !b.checked)).toBe(true);
    await user.click(boxes()[0]!);
    expect(boxes()[0]!.checked).toBe(true);
    for (const b of screen.getAllByRole('button', { name: 'Mark all as collected' }))
      await user.click(b);
    expect(boxes().every((b) => b.checked)).toBe(true);
    expect(screen.queryByRole('button', { name: 'Mark all as collected' })).toBeNull();
    await user.click(screen.getAllByRole('button', { name: 'Untick all' })[0]!);
    expect(boxes().some((b) => !b.checked)).toBe(true);
  });
});
