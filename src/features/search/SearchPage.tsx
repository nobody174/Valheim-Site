import { useMemo, useState } from 'react';
import { search } from './instance';
import { SearchResults } from './SearchResults';
import styles from './Search.module.css';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const groups = useMemo(() => search(query, 20), [query]);
  return (
    <section>
      <h1>Search</h1>
      <input
        className={styles.input}
        type="search"
        value={query}
        placeholder="Search items, creatures, bosses, stations"
        aria-label="Search"
        onChange={(e) => setQuery(e.target.value)}
      />
      <p className={styles.hint}>Press Ctrl+K or / on any page to search.</p>
      <SearchResults groups={groups} />
      {query.trim() && groups.length === 0 && <p className={styles.empty}>No matches.</p>}
    </section>
  );
}
