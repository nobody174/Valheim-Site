// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describeEntity } from '../data/describe';
import { EntityLink } from './EntityLink';

afterEach(cleanup);

const renderLink = (id: string) =>
  render(
    <MemoryRouter>
      <EntityLink id={id} />
    </MemoryRouter>,
  );

describe('describeEntity', () => {
  it('describes a weapon with its combat damage', () => {
    const d = describeEntity('AxeBronze');
    expect(d?.title).toBe('Bronze Axe');
    // chop damage is tool-only and must not be counted
    expect(d?.lines.some((l) => l.startsWith('Damage 40 '))).toBe(true);
  });

  it('describes stations, creatures and bosses', () => {
    expect(describeEntity('forge')?.subtitle).toBe('Crafting station');
    expect(describeEntity('Boar')?.subtitle).toMatch(/^Creature/);
    expect(describeEntity('Eikthyr')?.subtitle).toMatch(/^Boss/);
  });

  it('returns nothing for an unknown id', () => {
    expect(describeEntity('NotAThing')).toBeUndefined();
  });
});

describe('EntityLink tooltip', () => {
  it('shows a fact card on hover and hides it again', async () => {
    const user = userEvent.setup();
    renderLink('AxeBronze');
    expect(screen.queryByRole('tooltip')).toBeNull();
    await user.hover(screen.getByRole('link', { name: 'Bronze Axe' }));
    const tip = screen.getByRole('tooltip');
    expect(tip.textContent).toContain('Bronze Axe');
    expect(tip.textContent).toContain('Damage 40');
    await user.unhover(screen.getByRole('link', { name: 'Bronze Axe' }));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows the same card for keyboard users and closes on Escape', async () => {
    const user = userEvent.setup();
    renderLink('forge');
    await user.tab();
    expect(screen.getByRole('tooltip').textContent).toContain('Crafting station');
    expect(screen.getByRole('link').getAttribute('aria-describedby')).toBe(
      screen.getByRole('tooltip').id,
    );
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows the card on a touch long press without following the link', () => {
    renderLink('Acorn');
    const link = screen.getByRole('link');
    fireEvent.pointerDown(link, { pointerType: 'touch' });
    return new Promise<void>((resolve) =>
      setTimeout(() => {
        expect(screen.getByRole('tooltip')).toBeTruthy();
        const notPrevented = fireEvent.click(link);
        expect(notPrevented).toBe(false);
        resolve();
      }, 600),
    );
  });

  it('does not show a card for a plain touch tap', () => {
    renderLink('Acorn');
    const link = screen.getByRole('link');
    fireEvent.pointerDown(link, { pointerType: 'touch' });
    fireEvent.pointerUp(link, { pointerType: 'touch' });
    return new Promise<void>((resolve) =>
      setTimeout(() => {
        expect(screen.queryByRole('tooltip')).toBeNull();
        resolve();
      }, 600),
    );
  });

  it('renders an unknown reference as plain text', () => {
    renderLink('NotAThing');
    expect(screen.getByText('NotAThing')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
