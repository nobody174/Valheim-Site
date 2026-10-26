import { Link } from 'react-router';
import { entityPath } from '../../components/EntityLink';
import type { EntityKind } from '../../data/lookup';
import type { SearchDoc, SearchGroup, SearchGroupKey } from './search';
import styles from './Search.module.css';

const KIND_OF_GROUP: Record<SearchGroupKey, EntityKind> = {
  items: 'item',
  trophies: 'item',
  creatures: 'creature',
  bosses: 'boss',
  stations: 'station',
};

export const hitPath = (hit: SearchDoc) => entityPath(KIND_OF_GROUP[hit.group], hit.id);

/** Grouped result list. `activeKey` highlights one hit for keyboard navigation. */
export function SearchResults({
  groups,
  activeKey,
  onPick,
}: {
  groups: SearchGroup[];
  activeKey?: string;
  onPick?: () => void;
}) {
  return (
    <div role="listbox" aria-label="Search results">
      {groups.map((g) => (
        <div key={g.group} className={styles.group}>
          <h2 className={styles.groupTitle}>{g.label}</h2>
          {g.hits.map((h) => (
            <Link
              key={h.key}
              to={hitPath(h)}
              role="option"
              aria-selected={h.key === activeKey}
              className={h.key === activeKey ? `${styles.hit} ${styles.active}` : styles.hit}
              onClick={onPick}
            >
              {h.name}
              <span className={styles.id}>{h.id}</span>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
