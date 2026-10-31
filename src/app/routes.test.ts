import { describe, expect, it } from 'vitest';
import { iconUrl } from '../data/icons';
import { groupsOfTier, ROUTE_GROUPS, ROUTES } from './routes';

describe('sidebar groups', () => {
  it('lists every page once, with a real game icon', () => {
    const paths = ROUTES.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const r of ROUTES) expect(iconUrl(r.icon), `${r.path}: ${r.icon}`).toBeTruthy();
  });

  it('has a short title for every group but the first, and keeps Home on top', () => {
    expect(ROUTE_GROUPS[0]!.routes[0]!.path).toBe('/');
    for (const g of ROUTE_GROUPS.slice(1)) expect(g.title.length).toBeGreaterThan(0);
    expect(ROUTE_GROUPS.length).toBeLessThanOrEqual(6);
  });

  it('shows ten pages or fewer in the default menu, and every page is in exactly one tier', () => {
    expect(ROUTES.filter((r) => r.tier === 'main').length).toBeLessThanOrEqual(10);
    expect(['main', 'more', 'owner'].flatMap((t) => groupsOfTier(t as 'main').flatMap((g) => g.routes))).toHaveLength(ROUTES.length);
  });
});
