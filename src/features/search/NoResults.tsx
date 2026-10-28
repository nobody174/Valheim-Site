import { Link } from 'react-router';
import { search } from './instance';
import { hitPath } from './SearchResults';
import styles from './Search.module.css';

/** Shown when a search finds nothing: the closest names, if any, as links. */
export function NoResults({ query, onPick }: { query: string; onPick?: () => void }) {
  const suggestions = search.suggest(query);
  return (
    <div className={styles.empty}>
      <p>No results for &quot;{query.trim()}&quot;.</p>
      {suggestions.length > 0 && (
        <p>
          Did you mean{' '}
          {suggestions.map((s, i) => (
            <span key={s.key}>
              {i > 0 && ', '}
              <Link to={hitPath(s)} onClick={onPick}>
                {s.name}
              </Link>
            </span>
          ))}
          ?
        </p>
      )}
    </div>
  );
}
