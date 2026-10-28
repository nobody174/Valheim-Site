// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { initialState } from '../../state/model';
import { appStore } from '../../state/store';
import { AdvisorPage } from './AdvisorPage';

beforeEach(() => appStore.setState(initialState()));
afterEach(cleanup);

const renderPage = () =>
  render(
    <MemoryRouter>
      <AdvisorPage />
    </MemoryRouter>,
  );

describe('advisor page', () => {
  it('starts with the first boss and things worth collecting, but nothing to craft yet', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /Next boss/ })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Worth collecting' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'You can craft now' })).toBeNull();
  });

  it('suggests crafting once the ingredients are collected', () => {
    const { toggleFlag } = appStore.getState();
    toggleFlag('Wood', 'collected');
    toggleFlag('Resin', 'collected');
    renderPage();
    expect(screen.getByRole('heading', { name: 'You can craft now' })).toBeTruthy();
  });
});
