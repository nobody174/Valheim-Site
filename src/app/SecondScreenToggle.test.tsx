// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SecondScreenToggle } from './SecondScreenToggle';

afterEach(() => {
  cleanup();
  localStorage.clear();
  delete document.documentElement.dataset.screen;
});

describe('second screen toggle', () => {
  it('switches the mode on and off and remembers it', async () => {
    const user = userEvent.setup();
    render(<SecondScreenToggle />);
    const button = screen.getByRole('button', { name: 'Big text' });
    expect(button.getAttribute('aria-pressed')).toBe('false');
    await user.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(document.documentElement.dataset.screen).toBe('second');
    expect(localStorage.getItem('vcs:v1:display')).toContain('true');
    await user.click(button);
    expect(document.documentElement.dataset.screen).toBe('normal');
  });

  it('starts on when it was left on', () => {
    localStorage.setItem('vcs:v1:display', JSON.stringify({ secondScreen: true }));
    render(<SecondScreenToggle />);
    expect(screen.getByRole('button', { name: 'Big text' }).getAttribute('aria-pressed')).toBe('true');
    expect(document.documentElement.dataset.screen).toBe('second');
  });

  it('offers a bigger step only while Big text is on', async () => {
    const user = userEvent.setup();
    render(<SecondScreenToggle />);
    expect(screen.queryByRole('button', { name: 'Bigger' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Big text' }));
    await user.click(screen.getByRole('button', { name: 'Bigger' }));
    expect(document.documentElement.dataset.screen).toBe('bigger');
    await user.click(screen.getByRole('button', { name: 'Bigger' }));
    expect(document.documentElement.dataset.screen).toBe('second');
    await user.click(screen.getByRole('button', { name: 'Bigger' }));
    await user.click(screen.getByRole('button', { name: 'Big text' }));
    expect(document.documentElement.dataset.screen).toBe('normal');
    expect(screen.queryByRole('button', { name: 'Bigger' })).toBeNull();
  });
});
