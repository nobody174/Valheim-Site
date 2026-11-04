import styles from '../features/items/Items.module.css';

/** The one message every list shows when its filters match nothing: what was empty, what to try, one click to start over. */
export function NoMatches({ message, onClear }: { message: string; onClear?: () => void }) {
  return (
    <div className={styles.empty} role="status">
      <p>{message}</p>
      <p>
        Try a shorter word or fewer filters.{' '}
        {onClear && (
          <button type="button" className={styles.linkButton} onClick={onClear}>
            Clear filters
          </button>
        )}
      </p>
    </div>
  );
}
