// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '#/';
});
afterEach(cleanup);

describe('command palette', () => {
  it('opens with Ctrl+K, searches, opens a result with Enter, and Esc closes', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.queryByRole('dialog')).toBeNull();

    await user.keyboard('{Control>}k{/Control}');
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('dialog').querySelector('input'));

    await user.keyboard('bronze sword');
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(await screen.findByRole('heading', { level: 1, name: 'Bronze Sword' })).toBeTruthy();

    await user.keyboard('/');
    expect(screen.getByRole('dialog')).toBeTruthy();
    // the opened item is now listed under Recent
    expect(screen.getByText('Recent')).toBeTruthy();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('does not open on "/" while typing in a field', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByLabelText('Search', { selector: 'section input' }));
    await user.keyboard('a/b');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows a real not-found page for unknown addresses', () => {
    window.location.hash = '#/definitely/not/a/page';
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeTruthy();
    expect(screen.queryByText(/Coming in Phase/)).toBeNull();
  });
});
