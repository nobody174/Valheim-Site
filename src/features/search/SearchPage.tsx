import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { entityPath } from '../../components/EntityLink';
import { CATEGORY_LABELS } from '../items/ItemsPage';
import { lookup } from '../../data/lookup';
import { getRecent } from '../../state/recent';
import { search } from './instance';
import { NoResults } from './NoResults';
import { SearchResults } from './SearchResults';
import { useHitKeys } from './useHitKeys';
import styles from './Search.module.css';

const QUICK = ['weapon', 'armor', 'food', 'material', 'trophy', 'tool'];

/** Landing page: a big search box, then shortcuts so there is something to click right away. */
export function SearchPage() {
  const [query, setQuery] = useState('');
  const groups = useMemo(() => search(query, 20), [query]);
  const searching = query.trim().length > 0;
  const { activeHit, handleKey, resetActive } = useHitKeys(groups.flatMap((g) => g.hits));
  const recent = useMemo(
    () =>
      getRecent()
        .map((id) => lookup.item(id))
        .filter((i) => i !== undefined),
    [],
  );

  return (
    <section>
      <h1>What are you looking for?</h1>
      <input
        className={styles.bigInput}
        type="search"
        value={query}
        placeholder="Search items, creatures, bosses, stations"
        aria-label="Search"
        autoFocus
        onChange={(e) => {
          setQuery(e.target.value);
          resetActive();
        }}
        onKeyDown={handleKey}
      />
      <p className={styles.hint}>
        Tip: press <kbd>Ctrl</kbd>+<kbd>K</kbd> or <kbd>/</kbd> on any page to search.
      </p>

      {searching ? (
        <>
          <SearchResults groups={groups} activeKey={activeHit?.key} />
          {groups.length === 0 && (
            <>
              <NoResults query={query} />
              <p className={styles.empty}>
                Or <Link to="/items">browse all items</Link>.
              </p>
            </>
          )}
        </>
      ) : (
        <>
          <h2 className={styles.sectionTitle}>Browse</h2>
          <div className={styles.chips}>
            {QUICK.map((c) => (
              <Link key={c} to={`/items?category=${c}`} className={styles.chip}>
                {CATEGORY_LABELS[c]}
              </Link>
            ))}
            <Link to="/recipes" className={styles.chip}>
              Recipes
            </Link>
            <Link to="/items?hoard=must_keep" className={styles.chip}>
              Must keep
            </Link>
          </div>
          {recent.length > 0 && (
            <>
              <h2 className={styles.sectionTitle}>Recently viewed</h2>
              <div className={styles.chips}>
                {recent.map((i) => (
                  <Link key={i.id} to={entityPath('item', i.id)} className={styles.chip}>
                    {i.name}
                  </Link>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
