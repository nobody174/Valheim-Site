import { describe, expect, it } from 'vitest';
import { iconUrl } from '../data/icons';
import { MENU, pagesOf } from './menu';
import { ROUTES } from './routes';

describe('pages', () => {
  it('lists every page once, with a real game icon', () => {
    const paths = ROUTES.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const r of ROUTES) expect(iconUrl(r.icon), `${r.path}: ${r.icon}`).toBeTruthy();
  });
});

describe('top menu', () => {
  it('has at most eight sections and only real pages', () => {
    expect(MENU.length).toBeLessThanOrEqual(8);
    const known = new Set(ROUTES.map((r) => r.path));
    for (const s of MENU) {
      expect(s.paths.length).toBeGreaterThan(0);
      for (const p of s.paths) expect(known.has(p), `${s.id}: ${p}`).toBe(true);
      expect(pagesOf(s)).toHaveLength(s.paths.length);
    }
  });

  it('reaches every page except Home, which is the logo', () => {
    const inMenu = new Set(MENU.flatMap((s) => s.paths));
    for (const r of ROUTES) if (r.path !== '/') expect(inMenu.has(r.path), r.path).toBe(true);
  });

  it('repeats a page only inside Tools', () => {
    const seen = new Map<string, string>();
    for (const s of MENU) {
      for (const p of s.paths) {
        const first = seen.get(p);
        if (first) expect(s.id, `${p} also in ${first}`).toBe('tools');
        else seen.set(p, s.id);
      }
    }
  });
});
