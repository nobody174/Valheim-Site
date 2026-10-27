// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { iconUrl } from '../data/icons';
import { lookup } from '../data/lookup';
import { EntityIcon } from './EntityIcon';
import { EntityLink } from './EntityLink';

afterEach(cleanup);

describe('icons', () => {
  it('finds the icon for an item and a station', () => {
    expect(iconUrl('SwordBronze')).toMatch(/SwordBronze.*\.webp$/);
    expect(iconUrl('forge')).toMatch(/forge.*\.webp$/);
  });

  it('uses the trophy icon for creatures and bosses', () => {
    expect(iconUrl('Boar')).toBe(iconUrl('TrophyBoar'));
    expect(iconUrl('Eikthyr')).toBe(iconUrl('TrophyEikthyr'));
  });

  it('has no icon for an unknown id', () => {
    expect(iconUrl('NotAThing')).toBeUndefined();
  });

  it('has an exported icon for every item and station (re-run tools/extract/extract_icons.py)', () => {
    const ids = [...lookup.allItems().map((i) => i.id), ...lookup.allStations().map((s) => s.id)];
    expect(ids.filter((id) => !iconUrl(id))).toEqual([]);
  });
});

describe('EntityIcon', () => {
  it('renders the image at the requested size, decorative and lazy', () => {
    const { container } = render(<EntityIcon id="SwordBronze" size={32} />);
    const img = container.querySelector('img')!;
    expect(img.getAttribute('width')).toBe('32');
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('loading')).toBe('lazy');
  });

  it('falls back to a category glyph when there is no icon', () => {
    const { container } = render(<EntityIcon id="NotAThing" />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('shows next to the name in a link without changing the link name', () => {
    render(
      <MemoryRouter>
        <EntityLink id="SwordBronze" />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: 'Bronze Sword' });
    expect(link.querySelector('img')).not.toBeNull();
  });
});
