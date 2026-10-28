import { useEffect, useMemo, useRef, useState } from 'react';
import { lookup } from '../../data/lookup';
import { getRecent } from '../../state/recent';
import { search } from './instance';
import { NoResults } from './NoResults';
import { SearchResults } from './SearchResults';
import type { SearchGroup } from './search';
import { useHitKeys } from './useHitKeys';
import styles from './Search.module.css';

/** Recent items shown as a single group when the query is empty. */
function recentGroups(): SearchGroup[] {
  const hits = getRecent()
    .map((id) => lookup.item(id))
    .filter((i) => i !== undefined)
    .map((i) => ({
      key: `items:${i.id}`,
      id: i.id,
      name: i.name,
      group: 'items' as const,
      aliases: '',
      tags: '',
    }));
  return hits.length ? [{ group: 'items', label: 'Recent', hits }] : [];
}

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const opener = useRef<Element | null>(document.activeElement);

  const groups = useMemo(() => (query.trim() ? search(query) : recentGroups()), [query]);
  const flat = groups.flatMap((g) => g.hits);
  const { activeHit, handleKey, resetActive } = useHitKeys(flat, onClose);

  useEffect(() => {
    input.current?.focus();
    const previous = opener.current;
    return () => {
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else {
      handleKey(e);
    }
  };

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div
        className={styles.palette}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <input
          ref={input}
          className={styles.input}
          type="search"
          value={query}
          placeholder="Search items, creatures, bosses, stations"
          aria-label="Search"
          onChange={(e) => {
            setQuery(e.target.value);
            resetActive();
          }}
        />
        <div className={styles.results}>
          <SearchResults groups={groups} activeKey={activeHit?.key} onPick={onClose} />
          {query.trim() && flat.length === 0 && <NoResults query={query} onPick={onClose} />}
          {!query.trim() && flat.length === 0 && (
            <p className={styles.empty}>Type to search. Recent items appear here.</p>
          )}
        </div>
      </div>
    </div>
  );
}
