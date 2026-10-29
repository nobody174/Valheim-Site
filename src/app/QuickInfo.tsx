import { Link } from 'react-router';
import { sortPortals } from '../features/portals/portals';
import { useProfile } from '../state/store';
import styles from './App.module.css';

/**
 * Right-hand strip on wide screens: the profile's own at-a-glance facts, kept in view while the page
 * in the middle scrolls. For now the portals: name and where each one goes.
 */
export function QuickInfo() {
  const profile = useProfile();
  const portals = sortPortals(profile.portals ?? []);
  // Most portals lead back from one place (home); only the odd one out says where it starts.
  const counts = new Map<string, number>();
  for (const p of portals) counts.set(p.from, (counts.get(p.from) ?? 0) + 1);
  const common = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';

  return (
    <aside className={styles.side} aria-label={`${profile.name}: quick info`}>
      <h2 className={styles.sideTitle}>Portals</h2>
      {portals.length === 0 ? (
        <p className={styles.sideEmpty}>None yet. Add them on My portals.</p>
      ) : (
        <ul className={styles.sideList}>
          {portals.map((p) => (
            <li key={p.id} className={p.down ? styles.sideDown : undefined}>
              <strong>{p.name}</strong>
              {' → '}
              {p.to || '?'}
              {p.from && p.from !== common && (
                <span className={styles.sideFrom}> (from {p.from})</span>
              )}
              {p.down && <span className={styles.sideFrom}> · down</span>}
            </li>
          ))}
        </ul>
      )}
      <Link to="/portals" className={styles.sideLink}>
        Edit portals
      </Link>
    </aside>
  );
}
