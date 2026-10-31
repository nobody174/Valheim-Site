import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { EntityIcon } from '../components/EntityIcon';
import { groupsOfTier, type RouteDef } from './routes';
import styles from './MobileTabs.module.css';

const TABS = [
  { to: '/', label: 'Home', icon: 'Torch' },
  { to: '/items', label: 'Items', icon: 'Wood' },
  { to: '/planner', label: 'Planner', icon: 'Hammer' },
];

const link = (r: RouteDef) => (
  <NavLink key={r.path} to={r.path} end className={({ isActive }) => (isActive ? styles.active : '')}>
    <EntityIcon id={r.icon} size={22} />
    {r.label}
  </NavLink>
);

/**
 * The phone's bottom bar: Home, Search, Items, Planner and a More sheet with every page. Shown only
 * on narrow screens (the sidebar covers wider ones); both are in the page, one is hidden by CSS.
 */
export function MobileTabs({ onSearch }: { onSearch: () => void }) {
  // The sheet belongs to the page it was opened on, so going to another page closes it.
  const { pathname } = useLocation();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const setOpen = (next: boolean) => setOpenAt(next ? pathname : null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenAt(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {open && (
        <div id="more-sheet" className={styles.sheet} role="region" aria-label="All pages">
          <div className={styles.group}>
            <div className={styles.links}>{groupsOfTier('main').flatMap((g) => g.routes).map(link)}</div>
          </div>
          {(['more', 'owner'] as const).map((tier) => (
            <details key={tier} className={styles.group}>
              <summary className={styles.groupTitle}>
                {tier === 'more' ? 'More pages' : 'My game and data'}
              </summary>
              <div className={styles.links}>{groupsOfTier(tier).flatMap((g) => g.routes).map(link)}</div>
            </details>
          ))}
        </div>
      )}
      <nav className={styles.bar} aria-label="Quick pages">
        <NavLink to={TABS[0]!.to} end className={({ isActive }) => (isActive ? styles.active : '')}>
          <EntityIcon id={TABS[0]!.icon} size={26} />
          {TABS[0]!.label}
        </NavLink>
        <button type="button" onClick={onSearch}>
          <EntityIcon id="Amber" size={26} />
          Search
        </button>
        {TABS.slice(1).map((t) => (
          <NavLink key={t.to} to={t.to} end className={({ isActive }) => (isActive ? styles.active : '')}>
            <EntityIcon id={t.icon} size={26} />
            {t.label}
          </NavLink>
        ))}
        <button type="button" aria-expanded={open} aria-controls="more-sheet" onClick={() => setOpen(!open)}>
          <EntityIcon id="Coins" size={26} />
          More
        </button>
      </nav>
    </>
  );
}
