// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { gameData, updateLog } from '../../data/load';
import { UpdateLogPage } from './UpdateLogPage';

describe('update log', () => {
  afterEach(cleanup);

  it('starts with a baseline for the build the data was read from', () => {
    const oldest = updateLog.entries[updateLog.entries.length - 1]!;
    expect(oldest.baseline).toBe(true);
    expect(updateLog.entries[0]!.gameVersion).toBe(gameData.meta.gameVersion);
  });

  it('renders the newest entry open', () => {
    render(
      <MemoryRouter>
        <UpdateLogPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /Update log/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: gameData.meta.gameVersion }).getAttribute('aria-expanded')).toBe('true');
  });
});
