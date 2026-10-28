// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { ComparePage } from './ComparePage';

afterEach(cleanup);

const renderPage = (path = '/compare') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <ComparePage />
    </MemoryRouter>,
  );

describe('compare page', () => {
  it('starts empty and says how to begin', () => {
    renderPage();
    expect(screen.getByText(/Nothing to compare yet/)).toBeTruthy();
  });

  it('shows two weapons side by side with the best marked', () => {
    renderPage('/compare?items=SwordBronze,SwordIron');
    const table = screen.getByRole('table');
    expect(within(table).getByRole('link', { name: 'Bronze Sword' })).toBeTruthy();
    expect(within(table).getByRole('link', { name: 'Iron Sword' })).toBeTruthy();
    const hit = within(table).getByRole('rowheader', { name: 'Per hit' }).closest('tr')!;
    expect(hit.textContent).toContain('★');
  });

  it('adds an item by name and removes one', async () => {
    const user = userEvent.setup();
    renderPage('/compare?items=SwordBronze');
    expect(screen.getByText('Add one more item to compare.')).toBeTruthy();
    await user.type(screen.getByLabelText('Add an item'), 'Iron Sword');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.queryByText('Add one more item to compare.')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Remove Bronze Sword' }));
    expect(screen.getByText('Add one more item to compare.')).toBeTruthy();
  });

  it('stops at four items', async () => {
    renderPage('/compare?items=SwordBronze,SwordIron,AxeBronze,AxeIron');
    expect((screen.getByRole('button', { name: 'Add' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
