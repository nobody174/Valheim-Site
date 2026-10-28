// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { UpgradePage } from './UpgradePage';

afterEach(cleanup);

const renderPage = (path = '/upgrades') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <UpgradePage />
    </MemoryRouter>,
  );

describe('upgrade page', () => {
  it('asks for an item first', () => {
    renderPage();
    expect(screen.getByText('Choose an item to see the cost.')).toBeTruthy();
  });

  it('shows the cost and station level for the whole upgrade path of an item', () => {
    renderPage('/upgrades?item=Club');
    expect(screen.getByRole('heading', { name: /Level 1 to/ })).toBeTruthy();
    expect(screen.getByText(/Station:/).textContent).toMatch(/level \d/);
    expect(screen.getByRole('heading', { name: 'Damage' })).toBeTruthy();
  });

  it('lets the target level change', async () => {
    const user = userEvent.setup();
    renderPage('/upgrades?item=Club');
    await user.selectOptions(screen.getByLabelText('To level'), '2');
    expect(screen.getByRole('heading', { name: 'Level 1 to 2' })).toBeTruthy();
  });
});
